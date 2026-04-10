from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth import create_access_token, verify_password
from database import get_db
from dependencies import get_current_user
from models import Usuario
from schemas import LoginRequest, Token, UsuarioOut

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/login", response_model=Token)
def login(body: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Usuario).filter(Usuario.cedula == body.cedula, Usuario.activo == True).first()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Cédula o contraseña incorrectos"
        )

    token = create_access_token({"sub": user.cedula, "rol": user.rol})
    return Token(access_token=token, rol=user.rol, nombre=user.nombre, cedula=user.cedula)


@router.get("/me", response_model=UsuarioOut)
def me(current_user: Usuario = Depends(get_current_user)):
    return current_user
