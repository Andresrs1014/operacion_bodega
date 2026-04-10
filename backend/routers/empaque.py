from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from models import Empaque, SecuenciaDiaria, Usuario
from schemas import EmpaqueCreate, EmpaqueOut, SecuenciaOut

router = APIRouter(prefix="/empaque", tags=["Empaque"])


def _get_prefijo_hoy() -> str:
    now = datetime.utcnow()
    return f"{str(now.year)[-2:]}{str(now.month).zfill(2)}{str(now.day).zfill(2)}"


@router.get("/secuencia", response_model=SecuenciaOut)
def get_secuencia(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Retorna el siguiente código de empaque disponible para hoy."""
    prefijo = _get_prefijo_hoy()
    seq = db.query(SecuenciaDiaria).filter(SecuenciaDiaria.prefijo_fecha == prefijo).first()
    ultimo = seq.ultimo_numero if seq else 0
    siguiente = prefijo + str(ultimo + 1).zfill(2)
    return SecuenciaOut(prefijo_fecha=prefijo, ultimo_numero=ultimo, siguiente_codigo=siguiente)


@router.post("/", response_model=List[EmpaqueOut])
def registrar_empaques(
    items: List[EmpaqueCreate],
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """
    Registra uno o más empaques de una impresión (una caja o varias de un cliente).
    Actualiza la secuencia diaria de forma atómica.
    """
    if not items:
        raise HTTPException(status_code=400, detail="Lista de empaques vacía")

    prefijo = _get_prefijo_hoy()
    seq = db.query(SecuenciaDiaria).filter(SecuenciaDiaria.prefijo_fecha == prefijo).with_for_update().first()

    if not seq:
        seq = SecuenciaDiaria(prefijo_fecha=prefijo, ultimo_numero=0)
        db.add(seq)
        db.flush()

    creados = []
    for item in items:
        seq.ultimo_numero += 1
        codigo = prefijo + str(seq.ultimo_numero).zfill(2)

        empaque = Empaque(
            codigo_empaque=codigo,
            id_usuario=current_user.id,
            tipo_empaque=item.tipo_empaque,
            numero_caja=item.numero_caja,
            total_cajas=item.total_cajas,
            cajas_internas=item.cajas_internas,
            pedidos_asociados=item.pedidos_asociados,
            cliente=item.cliente,
            direccion=item.direccion,
            ciudad=item.ciudad,
            departamento=item.departamento,
            telefono=item.telefono,
        )
        db.add(empaque)
        creados.append(empaque)

    db.commit()
    for e in creados:
        db.refresh(e)

    return creados


@router.get("/turno", response_model=List[EmpaqueOut])
def empaques_del_turno(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    """Retorna todos los empaques generados hoy por el usuario actual."""
    hoy = datetime.utcnow().date()
    return (
        db.query(Empaque)
        .filter(
            Empaque.id_usuario == current_user.id,
            Empaque.fecha_hora >= datetime.combine(hoy, datetime.min.time()),
        )
        .order_by(Empaque.fecha_hora)
        .all()
    )
