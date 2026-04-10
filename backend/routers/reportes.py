from fastapi import APIRouter, Depends, BackgroundTasks
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_supervisor_or_admin
from email_service import send_report

router = APIRouter(prefix="/reportes", tags=["Reportes"])


@router.post("/enviar/{tipo}")
def enviar_reporte_manual(
    tipo: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _=Depends(require_supervisor_or_admin),
):
    """
    Dispara manualmente el envío de un reporte.
    tipo: 'quincenal' | 'mensual'
    """
    if tipo not in ("quincenal", "mensual"):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="tipo debe ser 'quincenal' o 'mensual'")

    background_tasks.add_task(send_report, db, tipo)
    return {"ok": True, "mensaje": f"Reporte {tipo} en cola de envío"}
