"""Reglas de acceso a validaciones y borradores (por usuario autenticado)."""
from fastapi import HTTPException, status

from models import Usuario, Validacion, ValidacionBorrador


def ensure_validacion_mutable(val: Validacion, user: Usuario) -> None:
    if val.id_validador == user.id:
        return
    if user.rol in ("admin", "supervisor"):
        return
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Solo el validador asignado o supervisor/admin pueden modificar esta validación.",
    )


def ensure_borrador_owner(borrador: ValidacionBorrador, user: Usuario) -> None:
    if borrador.id_usuario != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El borrador pertenece a otro usuario.",
        )
