from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from auth import hash_password
from database import get_db
from dependencies import get_current_user, require_admin, require_supervisor_or_admin
from models import Usuario
from schemas import UsuarioCreate, UsuarioOut, UsuarioUpdate

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


@router.get("/", response_model=List[UsuarioOut])
def listar_usuarios(
    rol: Optional[str] = Query(None),
    activo: Optional[bool] = Query(None),
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_supervisor_or_admin),
):
    """Supervisores y admins pueden ver la lista de usuarios."""
    query = db.query(Usuario)
    if rol:
        query = query.filter(Usuario.rol == rol)
    if activo is not None:
        query = query.filter(Usuario.activo == activo)
    return query.order_by(Usuario.nombre).all()


@router.post("/", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear_usuario(
    body: UsuarioCreate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    """Solo el admin puede crear usuarios."""
    if db.query(Usuario).filter(Usuario.cedula == body.cedula).first():
        raise HTTPException(status_code=400, detail="Ya existe un usuario con esa cédula")

    user = Usuario(
        cedula=body.cedula,
        nombre=body.nombre,
        password_hash=hash_password(body.password),
        rol=body.rol,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{usuario_id}", response_model=UsuarioOut)
def actualizar_usuario(
    usuario_id: int,
    body: UsuarioUpdate,
    db: Session = Depends(get_db),
    _: Usuario = Depends(require_admin),
):
    """Solo el admin puede modificar usuarios."""
    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if body.nombre is not None:
        user.nombre = body.nombre
    if body.password is not None:
        user.password_hash = hash_password(body.password)
    if body.rol is not None:
        user.rol = body.rol
    if body.activo is not None:
        user.activo = body.activo

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT)
def desactivar_usuario(
    usuario_id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_admin),
):
    """Desactiva un usuario (soft delete). Solo admin."""
    if usuario_id == current_user.id:
        raise HTTPException(status_code=400, detail="No puedes desactivarte a ti mismo")

    user = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.activo = False
    db.commit()
