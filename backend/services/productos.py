"""
Servicio: lógica de negocio para el catálogo de Unidades de Empaque.
Reglas:
  - referencia: trim + uppercase + max 50 chars + única
  - unidad_empaque: entero >= 1
  - DELETE: solo si no hay ItemPedido con esa referencia en pedidos activos
"""
import logging
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status

from models import Producto, ItemPedido, Pedido

logger = logging.getLogger(__name__)

_ESTADOS_ACTIVOS = ("PENDIENTE", "EN_PROCESO")


def _normalizar_referencia(ref: str) -> str:
    return ref.strip().upper()[:50]


def list_productos_ue(
    db: Session,
    q: Optional[str],
    page: int,
    limit: int,
) -> dict:
    query = db.query(Producto)
    if q:
        patron = f"%{q.strip().upper()}%"
        query = query.filter(
            or_(
                Producto.referencia.ilike(patron),
                Producto.texto_unidad_empaque.ilike(patron),
            )
        )
    total = query.count()
    items = (
        query.order_by(Producto.referencia)
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )
    pages = max(1, -(-total // limit))  # ceil division
    return {"items": items, "total": total, "page": page, "pages": pages}


def get_producto_ue(db: Session, producto_id: int) -> Producto:
    p = db.query(Producto).filter(Producto.id == producto_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Referencia no encontrada.")
    return p


def create_producto_ue(
    db: Session,
    referencia: str,
    unidad_empaque: int,
    texto: Optional[str],
) -> Producto:
    if unidad_empaque < 1:
        raise HTTPException(status_code=400, detail="unidad_empaque debe ser >= 1.")
    ref = _normalizar_referencia(referencia)
    existe = db.query(Producto).filter(Producto.referencia == ref).first()
    if existe:
        raise HTTPException(status_code=409, detail=f"La referencia '{ref}' ya existe.")
    p = Producto(
        referencia=ref,
        unidad_empaque=unidad_empaque,
        texto_unidad_empaque=texto.strip()[:50] if texto else None,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    logger.info("Producto UE creado: %s (UE=%d)", ref, unidad_empaque)
    return p


def update_producto_ue(
    db: Session,
    producto_id: int,
    unidad_empaque: Optional[int],
    texto: Optional[str],
) -> Producto:
    p = get_producto_ue(db, producto_id)
    if unidad_empaque is not None:
        if unidad_empaque < 1:
            raise HTTPException(status_code=400, detail="unidad_empaque debe ser >= 1.")
        p.unidad_empaque = unidad_empaque
    if texto is not None:
        p.texto_unidad_empaque = texto.strip()[:50] if texto else None
    db.commit()
    db.refresh(p)
    logger.info("Producto UE actualizado: %s (UE=%s)", p.referencia, p.unidad_empaque)
    return p


def delete_producto_ue(db: Session, producto_id: int) -> None:
    p = get_producto_ue(db, producto_id)
    # Verificar ItemPedido activos con esta referencia
    activo = (
        db.query(ItemPedido)
        .join(Pedido, ItemPedido.id_pedido == Pedido.id)
        .filter(
            ItemPedido.referencia == p.referencia,
            Pedido.estado.in_(_ESTADOS_ACTIVOS),
        )
        .first()
    )
    if activo:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"No se puede eliminar '{p.referencia}': tiene pedidos activos.",
        )
    db.delete(p)
    db.commit()
    logger.info("Producto UE eliminado: %s", p.referencia)


def batch_productos_ue(db: Session, referencias: list[str]) -> list[Producto]:
    if len(referencias) > 500:
        raise HTTPException(status_code=400, detail="Máximo 500 referencias por consulta batch.")
    refs = [r.strip().upper() for r in referencias if r.strip()]
    if not refs:
        return []
    return db.query(Producto).filter(Producto.referencia.in_(refs)).all()


def import_productos_ue(db: Session, rows: list[dict]) -> dict:
    """
    Upsert masivo de productos. Procesa en chunks de 500.
    rows: lista de dicts con claves 'referencia' y 'unidad_empaque' (ya validados en router).
    Devuelve dict con creadas, actualizadas y errores por fila.
    """
    creadas = 0
    actualizadas = 0
    errores = []

    CHUNK = 500
    for chunk_start in range(0, len(rows), CHUNK):
        chunk = rows[chunk_start: chunk_start + CHUNK]
        try:
            for i, row in enumerate(chunk, start=chunk_start + 2):  # fila 2 = primera de datos
                try:
                    ref = _normalizar_referencia(str(row.get("referencia", "")))
                    if not ref:
                        errores.append({"fila": i, "referencia": "", "motivo": "Referencia vacía"})
                        continue
                    ue_raw = row.get("unidad_empaque", 1)
                    try:
                        ue = int(ue_raw)
                    except (ValueError, TypeError):
                        errores.append({"fila": i, "referencia": ref, "motivo": f"UE inválida: '{ue_raw}'"})
                        continue
                    if ue < 1:
                        errores.append({"fila": i, "referencia": ref, "motivo": "UE debe ser >= 1"})
                        continue
                    texto = str(row.get("texto", "") or "").strip()[:50] or None

                    existente = db.query(Producto).filter(Producto.referencia == ref).first()
                    if existente:
                        existente.unidad_empaque = ue
                        if texto is not None:
                            existente.texto_unidad_empaque = texto
                        actualizadas += 1
                    else:
                        db.add(Producto(referencia=ref, unidad_empaque=ue, texto_unidad_empaque=texto))
                        creadas += 1
                except Exception as e:
                    errores.append({"fila": i, "referencia": str(row.get("referencia", "")), "motivo": str(e)})
            db.commit()
        except Exception as e:
            db.rollback()
            logger.error("Error en chunk import UE (fila ~%d): %s", chunk_start + 2, e)
            for i, row in enumerate(chunk, start=chunk_start + 2):
                errores.append({"fila": i, "referencia": str(row.get("referencia", "")), "motivo": "Error en lote"})

    return {"ok": True, "creadas": creadas, "actualizadas": actualizadas, "errores": errores}
