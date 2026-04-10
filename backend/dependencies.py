from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from auth import decode_token
from database import get_db
from models import Usuario

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> Usuario:
    payload = decode_token(token)
    cedula: str = payload.get("sub")
    if not cedula:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")

    user = db.query(Usuario).filter(Usuario.cedula == cedula, Usuario.activo == True).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado o inactivo")
    return user


def require_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol admin")
    return current_user


def require_supervisor_or_admin(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol not in ("admin", "supervisor"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requiere rol supervisor o admin")
    return current_user


def require_operario(current_user: Usuario = Depends(get_current_user)) -> Usuario:
    if current_user.rol not in ("admin", "supervisor", "operario"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
    return current_user
