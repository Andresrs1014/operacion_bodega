from datetime import datetime
from typing import List, Literal, Optional
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


# ── VALIDACIÓN (API módulo validación + borradores) ──────────────────────────

class SupervisorFirmaOut(BaseModel):
    """Perfil mínimo para relacionar firma supervisora ↔ id en correcciones."""

    id: int
    nombre: str

    model_config = {"from_attributes": True}


class MisValidacionOut(BaseModel):
    id: int
    numero_pedido: str
    hora_inicio: datetime
    hora_fin: Optional[datetime] = None
    estado: str
    total_unidades: int = 0


class ValidacionBorradorUpsert(BaseModel):
    numero_pedido: str
    payload: dict
    id_validacion: Optional[int] = None


class ValidacionBorradorResponse(BaseModel):
    numero_pedido: str
    payload: dict
    id_validacion: Optional[int] = None
    actualizado_en: datetime


class LabelSnapshotOut(BaseModel):
    id: int
    numero_pedido: str
    cliente: str
    direccion: str
    ciudad: str
    departamento: str
    picker: str
    validador: str
    hora_inicio: datetime
    hora_fin: Optional[datetime] = None
    total_unidades: int
    estado: str


# ── PRODUCTOS / UNIDADES DE EMPAQUE ───────────────────────────────────────────

class ProductoUeOut(BaseModel):
    id: int
    referencia: str
    unidad_empaque: int
    texto_unidad_empaque: Optional[str] = None
    fecha_actualizacion: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ProductoUeCreate(BaseModel):
    referencia: str
    unidad_empaque: int
    texto_unidad_empaque: Optional[str] = None


class ProductoUeUpdate(BaseModel):
    unidad_empaque: Optional[int] = None
    texto_unidad_empaque: Optional[str] = None


class ProductoUePage(BaseModel):
    items: List[ProductoUeOut]
    total: int
    page: int
    pages: int


class ProductoUeBatchRequest(BaseModel):
    referencias: List[str]


class ProductoUeBatchItem(BaseModel):
    referencia: str
    unidad_empaque: int
    texto_unidad_empaque: Optional[str] = None


class ImportRowError(BaseModel):
    fila: int
    referencia: str
    motivo: str


class ImportResult(BaseModel):
    ok: bool
    creadas: int
    actualizadas: int
    errores: List[ImportRowError]
