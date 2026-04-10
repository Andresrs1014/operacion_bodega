from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, require_supervisor_or_admin
from models import Alistamiento, Correccion, Pedido, Validacion, Usuario
from schemas import UsuarioOut

router = APIRouter(prefix="/validacion", tags=["Validación"])


# ── Schemas internos ───────────────────────────────────────────────────────────

class AlistamientoCreate(BaseModel):
    numero_pedido: str
    hora_inicio: datetime


class AlistamientoClose(BaseModel):
    hora_fin: datetime


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


# ── Empleados (reemplaza localStorage brakepak_employees) ─────────────────────

@router.get("/empleados", response_model=List[UsuarioOut])
def listar_empleados(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Lista operarios activos. Reemplaza el localStorage brakepak_employees."""
    return (
        db.query(Usuario)
        .filter(Usuario.rol == "operario", Usuario.activo == True)
        .order_by(Usuario.nombre)
        .all()
    )


# ── Alistamiento ──────────────────────────────────────────────────────────────

@router.post("/alistamiento", status_code=status.HTTP_201_CREATED)
def iniciar_alistamiento(
    body: AlistamientoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Registra el inicio del alistamiento de un pedido."""
    pedido = db.query(Pedido).filter(Pedido.numero_pedido == body.numero_pedido).first()
    if not pedido:
        # Crear pedido on-the-fly si no existe (viene del Excel)
        pedido = Pedido(numero_pedido=body.numero_pedido, estado="EN_PROCESO")
        db.add(pedido)
        db.flush()

    alistamiento = Alistamiento(
        id_pedido=pedido.id,
        id_alistador=current_user.id,
        hora_inicio=body.hora_inicio,
        estado="EN_PROCESO",
    )
    db.add(alistamiento)
    db.commit()
    db.refresh(alistamiento)
    return {"id": alistamiento.id, "numero_pedido": body.numero_pedido}


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


# ── Validación ────────────────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
def iniciar_validacion(
    body: ValidacionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Registra el inicio de una validación."""
    pedido = db.query(Pedido).filter(Pedido.numero_pedido == body.numero_pedido).first()
    if not pedido:
        pedido = Pedido(numero_pedido=body.numero_pedido, estado="EN_PROCESO")
        db.add(pedido)
        db.flush()

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
    return {"id": validacion.id, "numero_pedido": body.numero_pedido}


@router.patch("/{validacion_id}/cerrar")
def cerrar_validacion(
    validacion_id: int,
    body: ValidacionClose,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Cierra una validación con su resultado final."""
    val = db.query(Validacion).filter(Validacion.id == validacion_id).first()
    if not val:
        raise HTTPException(status_code=404, detail="Validación no encontrada")

    val.hora_fin = body.hora_fin
    val.total_unidades = body.total_unidades
    val.estado = body.estado
    val.observaciones = body.observaciones
    val.cerrado_con_novedades = body.cerrado_con_novedades

    # Actualizar estado del pedido
    if body.estado == "OK":
        val.pedido.estado = "VALIDADO"

    db.commit()
    return {"ok": True}


@router.post("/{validacion_id}/correccion", status_code=status.HTTP_201_CREATED)
def registrar_correccion(
    validacion_id: int,
    body: CorreccionCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Registra una corrección autorizada por supervisor durante la validación."""
    val = db.query(Validacion).filter(Validacion.id == validacion_id).first()
    if not val:
        raise HTTPException(status_code=404, detail="Validación no encontrada")

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
