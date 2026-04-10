from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel


# ── AUTH ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    cedula: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    rol: str
    nombre: str
    cedula: str


# ── USUARIOS ──────────────────────────────────────────────────────────────────

class UsuarioCreate(BaseModel):
    cedula: str
    nombre: str
    password: str
    rol: Literal["admin", "supervisor", "operario"] = "operario"


class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    password: Optional[str] = None
    rol: Optional[Literal["admin", "supervisor", "operario"]] = None
    activo: Optional[bool] = None


class UsuarioOut(BaseModel):
    id: int
    cedula: str
    nombre: str
    rol: str
    activo: bool
    fecha_registro: datetime

    model_config = {"from_attributes": True}


# ── EMPAQUE ───────────────────────────────────────────────────────────────────

class EmpaqueCreate(BaseModel):
    tipo_empaque: Literal["CAJA", "ESTIBA"]
    numero_caja: int
    total_cajas: int
    cajas_internas: Optional[int] = None
    pedidos_asociados: str
    cliente: str
    direccion: str
    ciudad: str
    departamento: str
    telefono: Optional[str] = None


class EmpaqueOut(BaseModel):
    id: int
    codigo_empaque: str
    tipo_empaque: str
    numero_caja: int
    total_cajas: int
    cajas_internas: Optional[int]
    pedidos_asociados: str
    cliente: str
    direccion: str
    ciudad: str
    departamento: str
    telefono: Optional[str]
    fecha_hora: datetime

    model_config = {"from_attributes": True}


class SecuenciaOut(BaseModel):
    prefijo_fecha: str
    ultimo_numero: int
    siguiente_codigo: str
