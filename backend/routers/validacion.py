from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Alistamiento, Correccion, Pedido, Usuario, Validacion, ValidacionBorrador
from schemas import (
    MisValidacionOut,
    SupervisorFirmaOut,
    UsuarioOut,
    ValidacionBorradorResponse,
    ValidacionBorradorUpsert,
)
from services.validation_access import ensure_borrador_owner, ensure_validacion_mutable
from services.validacion_borrador import json_to_payload, payload_to_json, utcnow

router = APIRouter(prefix="/validacion", tags=["Validación"])


# ── Schemas internos ───────────────────────────────────────────────────────────

class AlistamientoCreate(BaseModel):
    numero_pedido: str
    hora_inicio: datetime


class AlistamientoClose(BaseModel):
    hora_fin: datetime


class AlistamientoCancelar(BaseModel):
    hora_fin: Optional[datetime] = None


class ValidacionCreate(BaseModel):
    numero_pedido: str
    id_alistador: Optional[int] = None
    hora_inicio: datetime


class ValidacionClose(BaseModel):
    hora_fin: datetime
    total_unidades: int
    estado: str  # "OK" | "CON_NOVEDADES"
    observaciones: Optional[str] = None
    cerrado_con_novedades: bool = False


class CorreccionCreate(BaseModel):
    referencia_afectada: str
    cantidad_corregida: int
    causa: str
    descripcion_causa: Optional[str] = None
    id_supervisor: int


def _pedido_por_numero(db: Session, numero: str) -> Pedido:
    n = numero.strip()
    p = db.query(Pedido).filter(Pedido.numero_pedido == n).first()
    if not p:
        p = Pedido(numero_pedido=n, estado="EN_PROCESO")
        db.add(p)
        db.flush()
    return p


# ── Empleados ─────────────────────────────────────────────────────────────────

@router.get("/empleados", response_model=List[UsuarioOut])
def listar_empleados(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    return (
        db.query(Usuario)
        .filter(Usuario.rol == "operario", Usuario.activo.is_(True))
        .order_by(Usuario.nombre)
        .all()
    )


@router.get("/supervisores-firma", response_model=List[SupervisorFirmaOut])
def supervisores_firma(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Usuarios autorizados para firmar correcciones (id para persistir en KPIs)."""
    return (
        db.query(Usuario)
        .filter(
            Usuario.activo.is_(True),
            Usuario.rol.in_(("supervisor", "admin")),
        )
        .order_by(Usuario.nombre)
        .all()
    )


# ── Mi historial de validaciones cerradas ─────────────────────────────────────

@router.get("/mias", response_model=List[MisValidacionOut])
def mis_validaciones_cerradas(
    limit: int = Query(50, ge=1, le=120),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Histórico propio: validaciones finalizadas por el usuario autenticado."""
    rows = (
        db.query(Validacion)
        .join(Pedido, Validacion.id_pedido == Pedido.id)
        .filter(
            Validacion.id_validador == current_user.id,
            Validacion.hora_fin.isnot(None),
            Validacion.estado != "EN_PROCESO",
        )
        .order_by(Validacion.hora_inicio.desc())
        .limit(limit)
        .all()
    )
    out: List[MisValidacionOut] = []
    for v in rows:
        num = v.pedido.numero_pedido if v.pedido else "—"
        out.append(
            MisValidacionOut(
                id=v.id,
                numero_pedido=num,
                hora_inicio=v.hora_inicio,
                hora_fin=v.hora_fin,
                estado=v.estado,
                total_unidades=v.total_unidades or 0,
            )
        )
    return out


# ── Borrador (una fila por usuario) ───────────────────────────────────────────

@router.get("/mi-borrador", response_model=ValidacionBorradorResponse)
def obtener_mi_borrador(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    row = db.query(ValidacionBorrador).filter(ValidacionBorrador.id_usuario == current_user.id).first()
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sin borrador guardado.")
    try:
        payload = json_to_payload(row.payload_json)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=str(e)) from e
    return ValidacionBorradorResponse(
        numero_pedido=row.numero_pedido,
        payload=payload,
        id_validacion=row.id_validacion,
        actualizado_en=row.actualizado_en,
    )


@router.put("/mi-borrador", response_model=ValidacionBorradorResponse)
def guardar_mi_borrador(
    body: ValidacionBorradorUpsert,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    try:
        raw = payload_to_json(body.payload)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e)) from e

    if body.id_validacion is not None:
        val = db.query(Validacion).filter(Validacion.id == body.id_validacion).first()
        if not val or val.id_validador != current_user.id or val.estado != "EN_PROCESO":
            raise HTTPException(status_code=400, detail="id_validacion no corresponde a validación abierta propia.")

    num = body.numero_pedido.strip()[:50]
    row = db.query(ValidacionBorrador).filter(ValidacionBorrador.id_usuario == current_user.id).first()
    now = utcnow()
    if row:
        row.numero_pedido = num
        row.payload_json = raw
        row.id_validacion = body.id_validacion
        row.actualizado_en = now
    else:
        row = ValidacionBorrador(
            id_usuario=current_user.id,
            numero_pedido=num,
            payload_json=raw,
            id_validacion=body.id_validacion,
            actualizado_en=now,
        )
        db.add(row)
    db.commit()
    db.refresh(row)
    return ValidacionBorradorResponse(
        numero_pedido=row.numero_pedido,
        payload=json_to_payload(row.payload_json),
        id_validacion=row.id_validacion,
        actualizado_en=row.actualizado_en,
    )


@router.delete("/mi-borrador", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_mi_borrador(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    row = db.query(ValidacionBorrador).filter(ValidacionBorrador.id_usuario == current_user.id).first()
    if row:
        db.delete(row)
        db.commit()
    return None


# ── Alistamiento ──────────────────────────────────────────────────────────────

@router.post("/alistamiento", status_code=status.HTTP_201_CREATED)
def iniciar_alistamiento(
    body: AlistamientoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pedido = _pedido_por_numero(db, body.numero_pedido)

    alistamiento = Alistamiento(
        id_pedido=pedido.id,
        id_alistador=current_user.id,
        hora_inicio=body.hora_inicio,
        estado="EN_PROCESO",
    )
    db.add(alistamiento)
    db.commit()
    db.refresh(alistamiento)
    return {"id": alistamiento.id, "numero_pedido": body.numero_pedido.strip()}


@router.patch("/alistamiento/{alistamiento_id}/cerrar")
def cerrar_alistamiento(
    alistamiento_id: int,
    body: AlistamientoClose,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    alistamiento = db.query(Alistamiento).filter(Alistamiento.id == alistamiento_id).first()
    if not alistamiento:
        raise HTTPException(status_code=404, detail="Alistamiento no encontrado")

    alistamiento.hora_fin = body.hora_fin
    alistamiento.estado = "COMPLETADO"
    db.commit()
    return {"ok": True}


@router.patch("/alistamiento/{alistamiento_id}/cancelar")
def cancelar_alistamiento(
    alistamiento_id: int,
    body: AlistamientoCancelar,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Cancela un alistamiento en curso (evita filas EN_PROCESO huérfanas)."""
    al = db.query(Alistamiento).filter(Alistamiento.id == alistamiento_id).first()
    if not al:
        raise HTTPException(status_code=404, detail="Alistamiento no encontrado")
    if al.estado != "EN_PROCESO":
        raise HTTPException(status_code=400, detail="Solo se pueden cancelar alistamientos en proceso.")
    if al.id_alistador != current_user.id and current_user.rol not in ("admin", "supervisor"):
        raise HTTPException(status_code=403, detail="No autorizado.")
    al.estado = "CANCELADO"
    al.hora_fin = body.hora_fin or datetime.utcnow()
    db.commit()
    return {"ok": True}


# ── Validación ────────────────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
def iniciar_validacion(
    body: ValidacionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    pedido = _pedido_por_numero(db, body.numero_pedido)

    abierta = (
        db.query(Validacion)
        .filter(
            Validacion.id_pedido == pedido.id,
            Validacion.id_validador == current_user.id,
            Validacion.estado == "EN_PROCESO",
        )
        .first()
    )
    if abierta:
        return {"id": abierta.id, "numero_pedido": body.numero_pedido.strip(), "reanudada": True}

    if body.id_alistador is not None:
        aldor = db.query(Usuario).filter(Usuario.id == body.id_alistador, Usuario.activo.is_(True)).first()
        if not aldor:
            raise HTTPException(status_code=400, detail="id_alistador inválido o inactivo.")

    validacion = Validacion(
        id_pedido=pedido.id,
        id_validador=current_user.id,
        id_alistador=body.id_alistador,
        hora_inicio=body.hora_inicio,
        estado="EN_PROCESO",
    )
    db.add(validacion)
    db.commit()
    db.refresh(validacion)
    return {"id": validacion.id, "numero_pedido": body.numero_pedido.strip(), "reanudada": False}


@router.patch("/{validacion_id}/cerrar")
def cerrar_validacion(
    validacion_id: int,
    body: ValidacionClose,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    val = db.query(Validacion).filter(Validacion.id == validacion_id).first()
    if not val:
        raise HTTPException(status_code=404, detail="Validación no encontrada")

    ensure_validacion_mutable(val, current_user)

    if body.estado not in ("OK", "CON_NOVEDADES"):
        raise HTTPException(status_code=400, detail="estado debe ser OK o CON_NOVEDADES")

    val.hora_fin = body.hora_fin
    val.total_unidades = body.total_unidades
    val.estado = body.estado
    val.observaciones = body.observaciones
    val.cerrado_con_novedades = body.cerrado_con_novedades

    if body.estado == "OK":
        val.pedido.estado = "VALIDADO"
    elif body.estado == "CON_NOVEDADES":
        val.pedido.estado = "EN_PROCESO"

    db.commit()
    return {"ok": True}


@router.post("/{validacion_id}/correccion", status_code=status.HTTP_201_CREATED)
def registrar_correccion(
    validacion_id: int,
    body: CorreccionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    val = db.query(Validacion).filter(Validacion.id == validacion_id).first()
    if not val:
        raise HTTPException(status_code=404, detail="Validación no encontrada")

    ensure_validacion_mutable(val, current_user)
    if val.estado != "EN_PROCESO":
        raise HTTPException(status_code=400, detail="Solo se registran correcciones en validaciones abiertas.")

    sup = db.query(Usuario).filter(Usuario.id == body.id_supervisor, Usuario.activo.is_(True)).first()
    if not sup or sup.rol not in ("supervisor", "admin"):
        raise HTTPException(status_code=400, detail="id_supervisor inválido.")

    correccion = Correccion(
        id_validacion=validacion_id,
        id_supervisor=body.id_supervisor,
        referencia_afectada=body.referencia_afectada,
        cantidad_corregida=body.cantidad_corregida,
        causa=body.causa,
        descripcion_causa=body.descripcion_causa,
    )
    db.add(correccion)
    db.commit()
    return {"ok": True}
