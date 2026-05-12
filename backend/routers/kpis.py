from datetime import datetime, date, timedelta, timezone
from typing import Optional
from zoneinfo import ZoneInfo
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, case, and_
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_supervisor_or_admin
from models import Alistamiento, Correccion, Empaque, Pedido, Usuario, Validacion

router = APIRouter(prefix="/kpis", tags=["KPIs"])

BOGOTA = ZoneInfo("America/Bogota")


def _ahora_utc_naive() -> datetime:
    """Retorna el momento actual en UTC como datetime naive (igual al formato en BD)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _bogota_midnight_to_utc(d: date) -> datetime:
    """Convierte la medianoche de una fecha en Bogotá a UTC naive para consultas en BD."""
    dt_bogota = datetime(d.year, d.month, d.day, tzinfo=BOGOTA)
    return dt_bogota.astimezone(timezone.utc).replace(tzinfo=None)


def _rango(periodo: str) -> tuple[datetime, datetime]:
    """Retorna (fecha_inicio, fecha_fin) en UTC naive según el periodo en hora Colombia."""
    ahora_bogota = datetime.now(BOGOTA)
    hoy = ahora_bogota.date()

    if periodo == "semana":
        inicio = hoy - timedelta(days=hoy.weekday())
    elif periodo == "mes":
        inicio = hoy.replace(day=1)
    else:  # dia
        inicio = hoy

    inicio_utc = _bogota_midnight_to_utc(inicio)
    fin_utc = _ahora_utc_naive()
    return inicio_utc, fin_utc


# ── Resumen general ───────────────────────────────────────────────────────────

@router.get("/resumen")
def resumen(
    periodo: str = Query("dia", pattern="^(dia|semana|mes)$"),
    db: Session = Depends(get_db),
    _=Depends(require_supervisor_or_admin),
):
    inicio, fin = _rango(periodo)

    total_empaques = db.query(func.count(Empaque.id)).filter(
        Empaque.fecha_hora.between(inicio, fin)
    ).scalar() or 0

    total_validaciones = db.query(func.count(Validacion.id)).filter(
        Validacion.hora_inicio.between(inicio, fin),
        Validacion.estado != "EN_PROCESO",
    ).scalar() or 0

    validaciones_ok = db.query(func.count(Validacion.id)).filter(
        Validacion.hora_inicio.between(inicio, fin),
        Validacion.estado == "OK",
    ).scalar() or 0

    validaciones_novedades = db.query(func.count(Validacion.id)).filter(
        Validacion.hora_inicio.between(inicio, fin),
        Validacion.estado == "CON_NOVEDADES",
    ).scalar() or 0

    # Tiempo promedio de validación en minutos
    vals_con_tiempo = db.query(Validacion).filter(
        Validacion.hora_inicio.between(inicio, fin),
        Validacion.hora_fin.isnot(None),
    ).all()

    tiempos = [
        (v.hora_fin - v.hora_inicio).total_seconds() / 60
        for v in vals_con_tiempo
        if v.hora_fin > v.hora_inicio
    ]
    promedio_minutos = round(sum(tiempos) / len(tiempos), 1) if tiempos else 0

    total_correcciones = db.query(func.count(Correccion.id)).filter(
        Correccion.fecha_hora.between(inicio, fin)
    ).scalar() or 0

    # Auxiliares activos en el periodo
    auxiliares_activos = db.query(func.count(func.distinct(Validacion.id_validador))).filter(
        Validacion.hora_inicio.between(inicio, fin)
    ).scalar() or 0

    return {
        "periodo": periodo,
        "total_empaques": total_empaques,
        "total_validaciones": total_validaciones,
        "validaciones_ok": validaciones_ok,
        "validaciones_novedades": validaciones_novedades,
        "tasa_exactitud": round((validaciones_ok / total_validaciones * 100), 1) if total_validaciones else 0,
        "promedio_minutos_por_pedido": promedio_minutos,
        "total_correcciones": total_correcciones,
        "auxiliares_activos": auxiliares_activos,
    }


# ── Ranking de auxiliares ─────────────────────────────────────────────────────

@router.get("/ranking")
def ranking(
    periodo: str = Query("dia", pattern="^(dia|semana|mes)$"),
    db: Session = Depends(get_db),
    _=Depends(require_supervisor_or_admin),
):
    inicio, fin = _rango(periodo)

    auxiliares = db.query(Usuario).filter(
        Usuario.rol.in_(["operario", "admin"]),
        Usuario.activo == True,
    ).all()
    resultado = []

    for aux in auxiliares:
        vals = db.query(Validacion).filter(
            Validacion.id_validador == aux.id,
            Validacion.hora_inicio.between(inicio, fin),
            Validacion.hora_fin.isnot(None),
        ).all()

        if not vals:
            continue

        tiempos = [
            (v.hora_fin - v.hora_inicio).total_seconds() / 60
            for v in vals
            if v.hora_fin and v.hora_fin > v.hora_inicio
        ]
        promedio = round(sum(tiempos) / len(tiempos), 1) if tiempos else 0
        total_ok = sum(1 for v in vals if v.estado == "OK")
        total_novedades = sum(1 for v in vals if v.estado == "CON_NOVEDADES")
        exactitud = round((total_ok / len(vals)) * 100, 1) if vals else 0

        correcciones = db.query(func.count(Correccion.id)).join(Validacion).filter(
            Validacion.id_validador == aux.id,
            Correccion.fecha_hora.between(inicio, fin),
        ).scalar() or 0

        # Score compuesto: exactitud (60%) + velocidad (40%)
        # Velocidad normalizada: 0-100 donde <5min = 100, >30min = 0
        vel_score = max(0, min(100, (30 - promedio) / 25 * 100)) if promedio > 0 else 0
        score = round((exactitud * 0.6) + (vel_score * 0.4), 1)

        resultado.append({
            "id": aux.id,
            "nombre": aux.nombre,
            "cedula": aux.cedula,
            "total_pedidos": len(vals),
            "total_ok": total_ok,
            "total_novedades": total_novedades,
            "exactitud": exactitud,
            "promedio_minutos": promedio,
            "total_correcciones": correcciones,
            "score": score,
        })

    # Ordenar por score descendente → posición en el ranking
    resultado.sort(key=lambda x: x["score"], reverse=True)
    for i, r in enumerate(resultado):
        r["posicion"] = i + 1

    return resultado


# ── Detalle por auxiliar ──────────────────────────────────────────────────────

@router.get("/auxiliar/{usuario_id}")
def detalle_auxiliar(
    usuario_id: int,
    periodo: str = Query("dia", pattern="^(dia|semana|mes)$"),
    db: Session = Depends(get_db),
    _=Depends(require_supervisor_or_admin),
):
    inicio, fin = _rango(periodo)

    aux = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not aux:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Auxiliar no encontrado")

    vals = db.query(Validacion).filter(
        Validacion.id_validador == usuario_id,
        Validacion.hora_inicio.between(inicio, fin),
    ).order_by(Validacion.hora_inicio).all()

    historial = []
    for v in vals:
        duracion = None
        if v.hora_fin:
            duracion = round((v.hora_fin - v.hora_inicio).total_seconds() / 60, 1)
        historial.append({
            "id": v.id,
            "numero_pedido": v.pedido.numero_pedido if v.pedido else "-",
            "hora_inicio": v.hora_inicio.isoformat() + "Z",
            "hora_fin": (v.hora_fin.isoformat() + "Z") if v.hora_fin else None,
            "duracion_minutos": duracion,
            "estado": v.estado,
            "total_unidades": v.total_unidades,
            "correcciones": len(v.correcciones),
        })

    tiempos = [h["duracion_minutos"] for h in historial if h["duracion_minutos"]]
    return {
        "auxiliar": {"id": aux.id, "nombre": aux.nombre, "cedula": aux.cedula},
        "periodo": periodo,
        "total_pedidos": len(historial),
        "promedio_minutos": round(sum(tiempos) / len(tiempos), 1) if tiempos else 0,
        "mejor_tiempo": min(tiempos) if tiempos else None,
        "peor_tiempo": max(tiempos) if tiempos else None,
        "historial": historial,
    }


# ── Actividad en tiempo real ──────────────────────────────────────────────────

@router.get("/activos")
def auxiliares_activos(
    db: Session = Depends(get_db),
    _=Depends(require_supervisor_or_admin),
):
    """Muestra qué auxiliares tienen una validación en curso ahora mismo."""
    en_proceso = db.query(Validacion).filter(
        Validacion.estado == "EN_PROCESO",
        Validacion.hora_fin.is_(None),
    ).all()

    resultado = []
    ahora = _ahora_utc_naive()
    for v in en_proceso:
        minutos = round((ahora - v.hora_inicio).total_seconds() / 60, 1)
        resultado.append({
            "validacion_id": v.id,
            "auxiliar": v.validador.nombre if v.validador else "-",
            "numero_pedido": v.pedido.numero_pedido if v.pedido else "-",
            "minutos_transcurridos": minutos,
            "hora_inicio": v.hora_inicio.isoformat() + "Z",
        })

    return resultado


# ── Forzar cierre de validación huérfana ─────────────────────────────────────

@router.post("/activos/{validacion_id}/forzar-cierre")
def forzar_cierre_validacion(
    validacion_id: int,
    db: Session = Depends(get_db),
    _=Depends(require_supervisor_or_admin),
):
    """Cierra forzosamente una validación que quedó abierta (huérfana).
    Solo accesible por supervisor o admin. Se cierra como CON_NOVEDADES."""
    val = db.query(Validacion).filter(
        Validacion.id == validacion_id,
        Validacion.estado == "EN_PROCESO",
        Validacion.hora_fin.is_(None),
    ).first()

    if not val:
        raise HTTPException(status_code=404, detail="Validación activa no encontrada.")

    val.hora_fin = _ahora_utc_naive()
    val.estado = "CON_NOVEDADES"
    if val.pedido:
        val.pedido.estado = "EN_PROCESO"

    db.commit()
    return {"ok": True, "validacion_id": validacion_id}


# ── Tendencia por hora (heatmap del día) ─────────────────────────────────────

@router.get("/tendencia-hoy")
def tendencia_hoy(
    db: Session = Depends(get_db),
    _=Depends(require_supervisor_or_admin),
):
    """Cuántas validaciones se completaron por hora durante el día de hoy (hora Colombia)."""
    ahora_bogota = datetime.now(BOGOTA)
    hoy = ahora_bogota.date()
    inicio_utc = _bogota_midnight_to_utc(hoy)
    fin_utc = _ahora_utc_naive()

    vals = db.query(Validacion).filter(
        Validacion.hora_inicio.between(inicio_utc, fin_utc),
        Validacion.hora_fin.isnot(None),
    ).all()

    por_hora = {}
    for v in vals:
        # Convertir hora UTC almacenada a hora Colombia para el heatmap
        hora_bogota = v.hora_inicio.replace(tzinfo=timezone.utc).astimezone(BOGOTA).hour
        por_hora[hora_bogota] = por_hora.get(hora_bogota, 0) + 1

    return [{"hora": h, "validaciones": por_hora.get(h, 0)} for h in range(6, 22)]
