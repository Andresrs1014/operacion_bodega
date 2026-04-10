"""
Scheduler de reportes automáticos.
Se integra en el startup de FastAPI.

Disparadores:
  - Quincenal: día 15 y último día del mes, a las 18:00
  - Mensual:   último día del mes, a las 19:00
"""
import calendar
from datetime import date

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from database import SessionLocal
from email_service import send_report

_scheduler = BackgroundScheduler(timezone="America/Bogota")


def _run(tipo: str):
    db = SessionLocal()
    try:
        send_report(db, tipo)
    finally:
        db.close()


def _es_ultimo_dia() -> bool:
    hoy = date.today()
    return hoy.day == calendar.monthrange(hoy.year, hoy.month)[1]


def _job_quincenal():
    """Corre el día 15 y el último día del mes."""
    hoy = date.today()
    if hoy.day == 15 or _es_ultimo_dia():
        _run("quincenal")


def _job_mensual():
    """Corre solo el último día del mes."""
    if _es_ultimo_dia():
        _run("mensual")


def start_scheduler():
    # Quincenal: todos los días revisa si es 15 o último día → 18:00
    _scheduler.add_job(_job_quincenal, CronTrigger(hour=18, minute=0), id="quincenal", replace_existing=True)
    # Mensual: todos los días revisa si es último → 19:00
    _scheduler.add_job(_job_mensual,  CronTrigger(hour=19, minute=0), id="mensual",   replace_existing=True)
    _scheduler.start()
    print("✓ Scheduler de reportes iniciado (quincenal 18:00 · mensual 19:00 · zona: Bogotá)")


def stop_scheduler():
    if _scheduler.running:
        _scheduler.shutdown()
