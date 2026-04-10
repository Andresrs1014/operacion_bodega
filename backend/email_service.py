"""
Servicio de envío de reportes KPI por correo.
Genera un HTML detallado y lo envía vía Gmail SMTP.
"""
import smtplib
from datetime import date, datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from sqlalchemy.orm import Session
from sqlalchemy import func

from config import settings
from models import Correccion, Empaque, Usuario, Validacion


# ──────────────────────────────────────────────────────────────────────────────
# Helpers de datos
# ──────────────────────────────────────────────────────────────────────────────

def _rango_quincenal() -> tuple[datetime, datetime]:
    hoy = date.today()
    if hoy.day <= 15:
        inicio = date(hoy.year, hoy.month, 1)
        fin_d  = date(hoy.year, hoy.month, 15)
    else:
        inicio = date(hoy.year, hoy.month, 16)
        import calendar
        fin_d = date(hoy.year, hoy.month, calendar.monthrange(hoy.year, hoy.month)[1])
    return datetime(inicio.year, inicio.month, inicio.day), datetime(fin_d.year, fin_d.month, fin_d.day, 23, 59, 59)


def _rango_mensual() -> tuple[datetime, datetime]:
    hoy = date.today()
    import calendar
    inicio = date(hoy.year, hoy.month, 1)
    fin_d  = date(hoy.year, hoy.month, calendar.monthrange(hoy.year, hoy.month)[1])
    return datetime(inicio.year, inicio.month, inicio.day), datetime(fin_d.year, fin_d.month, fin_d.day, 23, 59, 59)


def _calcular_stats_auxiliar(db: Session, aux: Usuario, inicio: datetime, fin: datetime) -> dict:
    vals = db.query(Validacion).filter(
        Validacion.id_validador == aux.id,
        Validacion.hora_inicio.between(inicio, fin),
        Validacion.hora_fin.isnot(None),
    ).all()

    if not vals:
        return None

    tiempos = [(v.hora_fin - v.hora_inicio).total_seconds() / 60 for v in vals if v.hora_fin > v.hora_inicio]
    total_ok       = sum(1 for v in vals if v.estado == "OK")
    total_novedades= sum(1 for v in vals if v.estado == "CON_NOVEDADES")
    exactitud      = round((total_ok / len(vals)) * 100, 1)
    promedio       = round(sum(tiempos) / len(tiempos), 1) if tiempos else 0
    mejor          = round(min(tiempos), 1) if tiempos else 0
    peor           = round(max(tiempos), 1) if tiempos else 0

    correcciones = db.query(func.count(Correccion.id)).join(Validacion).filter(
        Validacion.id_validador == aux.id,
        Correccion.fecha_hora.between(inicio, fin),
    ).scalar() or 0

    vel_score  = max(0, min(100, (30 - promedio) / 25 * 100)) if promedio > 0 else 0
    score      = round((exactitud * 0.6) + (vel_score * 0.4), 1)

    return {
        "nombre":         aux.nombre,
        "cedula":         aux.cedula,
        "total":          len(vals),
        "total_ok":       total_ok,
        "total_novedades":total_novedades,
        "exactitud":      exactitud,
        "promedio":       promedio,
        "mejor":          mejor,
        "peor":           peor,
        "correcciones":   correcciones,
        "score":          score,
    }


def _build_kpi_data(db: Session, inicio: datetime, fin: datetime) -> dict:
    auxiliares = db.query(Usuario).filter(Usuario.rol == "operario", Usuario.activo == True).all()

    stats_list = []
    for aux in auxiliares:
        s = _calcular_stats_auxiliar(db, aux, inicio, fin)
        if s:
            stats_list.append(s)

    stats_list.sort(key=lambda x: x["score"], reverse=True)
    for i, s in enumerate(stats_list):
        s["posicion"] = i + 1

    # Totales generales
    total_val = sum(s["total"] for s in stats_list)
    total_ok  = sum(s["total_ok"] for s in stats_list)
    total_nov = sum(s["total_novedades"] for s in stats_list)
    tasa_exactitud = round((total_ok / total_val * 100), 1) if total_val else 0
    tiempos_todos  = [s["promedio"] for s in stats_list if s["promedio"] > 0]
    prom_global    = round(sum(tiempos_todos) / len(tiempos_todos), 1) if tiempos_todos else 0

    total_empaques = db.query(func.count(Empaque.id)).filter(
        Empaque.fecha_hora.between(inicio, fin)
    ).scalar() or 0

    total_correcciones = db.query(func.count(Correccion.id)).filter(
        Correccion.fecha_hora.between(inicio, fin)
    ).scalar() or 0

    return {
        "inicio":              inicio,
        "fin":                 fin,
        "total_validaciones":  total_val,
        "total_ok":            total_ok,
        "total_novedades":     total_nov,
        "tasa_exactitud":      tasa_exactitud,
        "promedio_global":     prom_global,
        "total_empaques":      total_empaques,
        "total_correcciones":  total_correcciones,
        "auxiliares_activos":  len(stats_list),
        "ranking":             stats_list,
    }


# ──────────────────────────────────────────────────────────────────────────────
# Generador de HTML
# ──────────────────────────────────────────────────────────────────────────────

def _medalla(pos: int) -> str:
    return {1: "🥇", 2: "🥈", 3: "🥉"}.get(pos, f"#{pos}")


def _semaforo_exactitud(v: float) -> str:
    if v >= 90: return "#16a34a"
    if v >= 75: return "#ca8a04"
    return "#dc2626"


def _semaforo_tiempo(v: float) -> str:
    if v <= 8:  return "#16a34a"
    if v <= 15: return "#ca8a04"
    return "#dc2626"


def _barra(pct: float, color: str) -> str:
    return f"""
    <div style="background:#f1f5f9;border-radius:4px;height:8px;width:100%;margin-top:4px;">
        <div style="background:{color};width:{min(pct,100)}%;height:8px;border-radius:4px;"></div>
    </div>"""


def build_html_report(data: dict, tipo: str) -> str:
    titulo_tipo = "QUINCENAL" if tipo == "quincenal" else "MENSUAL"
    fecha_inicio = data["inicio"].strftime("%d/%m/%Y")
    fecha_fin    = data["fin"].strftime("%d/%m/%Y")
    generado     = datetime.now().strftime("%d/%m/%Y %H:%M")

    # Filas de ranking
    filas_ranking = ""
    for r in data["ranking"]:
        color_exact = _semaforo_exactitud(r["exactitud"])
        color_tiempo = _semaforo_tiempo(r["promedio"])
        fondo = "#fffbeb" if r["posicion"] <= 3 else "white"
        filas_ranking += f"""
        <tr style="background:{fondo};border-bottom:1px solid #f1f5f9;">
            <td style="padding:10px 12px;font-size:18px;">{_medalla(r['posicion'])}</td>
            <td style="padding:10px 12px;">
                <div style="font-weight:700;color:#1e293b;">{r['nombre']}</div>
                <div style="font-size:11px;color:#94a3b8;">CC {r['cedula']}</div>
            </td>
            <td style="padding:10px 12px;text-align:center;font-weight:700;color:#1e293b;">{r['total']}</td>
            <td style="padding:10px 12px;text-align:center;">
                <span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:20px;font-size:12px;font-weight:700;">{r['total_ok']}</span>
            </td>
            <td style="padding:10px 12px;text-align:center;">
                <span style="background:#fef9c3;color:#854d0e;padding:2px 8px;border-radius:20px;font-size:12px;font-weight:700;">{r['total_novedades']}</span>
            </td>
            <td style="padding:10px 12px;text-align:center;font-weight:700;color:{color_exact};">{r['exactitud']}%</td>
            <td style="padding:10px 12px;text-align:center;font-weight:700;color:{color_tiempo};">{r['promedio']} min</td>
            <td style="padding:10px 12px;text-align:center;color:#64748b;font-size:12px;">{r['correcciones']}</td>
            <td style="padding:10px 12px;text-align:center;">
                <div style="font-weight:900;font-size:18px;color:{'#16a34a' if r['score']>=80 else '#ca8a04' if r['score']>=60 else '#dc2626'};">{r['score']}</div>
                {_barra(r['score'], '#16a34a' if r['score']>=80 else '#ca8a04' if r['score']>=60 else '#dc2626')}
            </td>
        </tr>"""

    # Podio top 3
    podio_html = ""
    for r in data["ranking"][:3]:
        podio_html += f"""
        <div style="background:white;border-radius:12px;padding:16px;text-align:center;min-width:150px;border:2px solid {'#fbbf24' if r['posicion']==1 else '#d1d5db'};">
            <div style="font-size:32px;">{_medalla(r['posicion'])}</div>
            <div style="font-weight:900;color:#1e293b;font-size:13px;margin-top:6px;">{r['nombre'].split()[0]}</div>
            <div style="font-size:11px;color:#94a3b8;">{r['nombre'].split()[-1] if len(r['nombre'].split())>1 else ''}</div>
            <div style="font-size:24px;font-weight:900;color:{'#d97706' if r['posicion']==1 else '#475569'};margin-top:8px;">{r['score']}</div>
            <div style="font-size:10px;color:#94a3b8;">score</div>
            <div style="margin-top:8px;font-size:12px;color:#16a34a;font-weight:700;">{r['exactitud']}% exactitud</div>
            <div style="font-size:12px;color:#2563eb;font-weight:700;">{r['promedio']} min/ped</div>
        </div>"""

    return f"""<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Reporte KPI {titulo_tipo} · BRAKEPAK</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">

<div style="max-width:900px;margin:0 auto;padding:24px 16px;">

    <!-- HEADER -->
    <div style="background:linear-gradient(135deg,#be123c,#991b1b);border-radius:16px;padding:32px;color:white;margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:16px;">
            <div>
                <div style="font-size:28px;font-weight:900;letter-spacing:4px;">BRAKEPAK</div>
                <div style="font-size:13px;opacity:0.8;margin-top:4px;letter-spacing:2px;">LOGIMAT · SISTEMA DE BODEGA</div>
                <div style="font-size:22px;font-weight:700;margin-top:12px;">REPORTE {titulo_tipo} DE KPIs</div>
                <div style="font-size:14px;opacity:0.9;margin-top:4px;">Periodo: {fecha_inicio} — {fecha_fin}</div>
            </div>
            <div style="text-align:right;opacity:0.8;font-size:12px;">
                <div>Generado: {generado}</div>
                <div style="margin-top:8px;font-size:11px;">Este reporte es automático.</div>
                <div style="font-size:11px;">No requiere respuesta.</div>
            </div>
        </div>
    </div>

    <!-- TARJETAS RESUMEN -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px;">
        <div style="background:white;border-radius:12px;padding:16px;border-left:4px solid #3b82f6;">
            <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-bottom:6px;">Total Validaciones</div>
            <div style="font-size:32px;font-weight:900;color:#1e293b;">{data['total_validaciones']}</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">{data['auxiliares_activos']} auxiliares activos</div>
        </div>
        <div style="background:white;border-radius:12px;padding:16px;border-left:4px solid #22c55e;">
            <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-bottom:6px;">Tasa de Exactitud</div>
            <div style="font-size:32px;font-weight:900;color:{'#16a34a' if data['tasa_exactitud']>=85 else '#ca8a04' if data['tasa_exactitud']>=70 else '#dc2626'};">{data['tasa_exactitud']}%</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">{data['total_ok']} OK · {data['total_novedades']} con novedad</div>
        </div>
        <div style="background:white;border-radius:12px;padding:16px;border-left:4px solid #f97316;">
            <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-bottom:6px;">Tiempo Promedio</div>
            <div style="font-size:32px;font-weight:900;color:{'#16a34a' if data['promedio_global']<=10 else '#ca8a04' if data['promedio_global']<=18 else '#dc2626'};">{data['promedio_global']}<span style="font-size:14px;"> min</span></div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">por pedido validado</div>
        </div>
        <div style="background:white;border-radius:12px;padding:16px;border-left:4px solid #a855f7;">
            <div style="font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-bottom:6px;">Empaques</div>
            <div style="font-size:32px;font-weight:900;color:#7c3aed;">{data['total_empaques']}</div>
            <div style="font-size:11px;color:#94a3b8;margin-top:4px;">{data['total_correcciones']} correcciones registradas</div>
        </div>
    </div>

    <!-- PODIO TOP 3 -->
    {'<div style="background:white;border-radius:16px;padding:24px;margin-bottom:20px;"><div style="font-size:14px;font-weight:900;color:#1e293b;letter-spacing:2px;margin-bottom:16px;">🏆 PODIO — MEJORES AUXILIARES</div><div style="display:flex;gap:12px;flex-wrap:wrap;">' + podio_html + '</div></div>' if data['ranking'] else ''}

    <!-- TABLA RANKING COMPLETO -->
    <div style="background:white;border-radius:16px;padding:24px;margin-bottom:20px;">
        <div style="font-size:14px;font-weight:900;color:#1e293b;letter-spacing:2px;margin-bottom:16px;">📊 RANKING COMPLETO DE AUXILIARES</div>
        <table style="width:100%;border-collapse:collapse;">
            <thead>
                <tr style="background:#f8fafc;border-bottom:2px solid #e2e8f0;">
                    <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:700;">#</th>
                    <th style="padding:10px 12px;text-align:left;font-size:11px;color:#94a3b8;font-weight:700;">AUXILIAR</th>
                    <th style="padding:10px 12px;text-align:center;font-size:11px;color:#94a3b8;font-weight:700;">PEDIDOS</th>
                    <th style="padding:10px 12px;text-align:center;font-size:11px;color:#94a3b8;font-weight:700;">OK ✓</th>
                    <th style="padding:10px 12px;text-align:center;font-size:11px;color:#94a3b8;font-weight:700;">NOVEDAD ⚠</th>
                    <th style="padding:10px 12px;text-align:center;font-size:11px;color:#94a3b8;font-weight:700;">EXACTITUD</th>
                    <th style="padding:10px 12px;text-align:center;font-size:11px;color:#94a3b8;font-weight:700;">PROM. TIEMPO</th>
                    <th style="padding:10px 12px;text-align:center;font-size:11px;color:#94a3b8;font-weight:700;">CORREC.</th>
                    <th style="padding:10px 12px;text-align:center;font-size:11px;color:#94a3b8;font-weight:700;">SCORE</th>
                </tr>
            </thead>
            <tbody>{filas_ranking}</tbody>
        </table>
    </div>

    <!-- ANÁLISIS DE TIEMPOS -->
    <div style="background:white;border-radius:16px;padding:24px;margin-bottom:20px;">
        <div style="font-size:14px;font-weight:900;color:#1e293b;letter-spacing:2px;margin-bottom:16px;">⏱ ANÁLISIS DE TIEMPOS</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
            {''.join(f"""
            <div style="background:#f8fafc;border-radius:10px;padding:14px;">
                <div style="font-size:12px;font-weight:700;color:#475569;margin-bottom:8px;">{r['nombre'].split()[0]} {r['nombre'].split()[-1] if len(r['nombre'].split())>1 else ''}</div>
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                    <span style="color:#94a3b8;">Promedio</span>
                    <span style="font-weight:700;color:{_semaforo_tiempo(r['promedio'])};">{r['promedio']} min</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                    <span style="color:#94a3b8;">Mejor</span>
                    <span style="font-weight:700;color:#16a34a;">{r['mejor']} min</span>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:12px;">
                    <span style="color:#94a3b8;">Peor</span>
                    <span style="font-weight:700;color:#dc2626;">{r['peor']} min</span>
                </div>
                {_barra(100 - min(r['promedio']/30*100, 100), _semaforo_tiempo(r['promedio']))}
            </div>""" for r in data['ranking'])}
        </div>
    </div>

    <!-- FOOTER -->
    <div style="text-align:center;padding:16px;color:#94a3b8;font-size:11px;">
        <div>Este reporte fue generado automáticamente por el sistema BRAKEPAK · LOGIMAT</div>
        <div style="margin-top:4px;">Powered and Designed by Laura Peláez for Logimat</div>
    </div>

</div>
</body>
</html>"""


# ──────────────────────────────────────────────────────────────────────────────
# Envío de correo
# ──────────────────────────────────────────────────────────────────────────────

def send_report(db: Session, tipo: str = "quincenal"):
    """
    Construye y envía el reporte KPI a todos los destinatarios configurados.
    tipo: 'quincenal' | 'mensual'
    """
    if not settings.smtp_password:
        print("⚠ SMTP no configurado. Agrega SMTP_PASSWORD al .env")
        return

    inicio, fin = _rango_quincenal() if tipo == "quincenal" else _rango_mensual()
    data = _build_kpi_data(db, inicio, fin)
    html = build_html_report(data, tipo)

    titulo_tipo = "Quincenal" if tipo == "quincenal" else "Mensual"
    fecha_inicio = data["inicio"].strftime("%d/%m/%Y")
    fecha_fin    = data["fin"].strftime("%d/%m/%Y")
    asunto = f"[BRAKEPAK] Reporte {titulo_tipo} KPI Bodega · {fecha_inicio} – {fecha_fin}"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = asunto
    msg["From"]    = settings.smtp_user
    msg["To"]      = ", ".join(settings.recipients_list)
    msg.attach(MIMEText(html, "html", "utf-8"))

    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.smtp_user, settings.smtp_password)
            server.sendmail(settings.smtp_user, settings.recipients_list, msg.as_string())
        print(f"✓ Reporte {tipo} enviado a: {', '.join(settings.recipients_list)}")
    except Exception as e:
        print(f"✗ Error enviando correo: {e}")
