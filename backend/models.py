from datetime import datetime
from sqlalchemy import (
    Boolean, Column, DateTime, Enum, ForeignKey,
    Integer, String, Text
)
from sqlalchemy.orm import relationship

from database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    cedula = Column(String(20), unique=True, index=True, nullable=False)
    nombre = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    rol = Column(Enum("admin", "supervisor", "operario", name="rol_enum"), nullable=False, default="operario")
    activo = Column(Boolean, default=True)
    fecha_registro = Column(DateTime, default=datetime.utcnow)

    alistamientos = relationship("Alistamiento", back_populates="alistador", foreign_keys="Alistamiento.id_alistador")
    validaciones_hechas = relationship("Validacion", back_populates="validador", foreign_keys="Validacion.id_validador")
    correcciones_autorizadas = relationship("Correccion", back_populates="supervisor")
    empaques = relationship("Empaque", back_populates="usuario")


class Departamento(Base):
    __tablename__ = "departamentos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), unique=True, nullable=False, index=True)

    ciudades = relationship("Ciudad", back_populates="departamento")


class Ciudad(Base):
    __tablename__ = "ciudades"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False, index=True)
    id_departamento = Column(Integer, ForeignKey("departamentos.id"), nullable=False)

    departamento = relationship("Departamento", back_populates="ciudades")
    clientes = relationship("Cliente", back_populates="ciudad")


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(200), nullable=False, index=True)
    direccion = Column(String(500))
    id_ciudad = Column(Integer, ForeignKey("ciudades.id"))
    telefono = Column(String(50))
    fecha_registro = Column(DateTime, default=datetime.utcnow)

    ciudad = relationship("Ciudad", back_populates="clientes")
    pedidos = relationship("Pedido", back_populates="cliente")


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    referencia = Column(String(50), unique=True, nullable=False, index=True)
    descripcion = Column(String(300))
    unidad_empaque = Column(Integer, default=1)
    texto_unidad_empaque = Column(String(50))
    fecha_actualizacion = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    items = relationship("ItemPedido", back_populates="producto")


class Pedido(Base):
    __tablename__ = "pedidos"

    id = Column(Integer, primary_key=True, index=True)
    numero_pedido = Column(String(50), unique=True, nullable=False, index=True)
    id_cliente = Column(Integer, ForeignKey("clientes.id"))
    fecha_pedido = Column(DateTime, default=datetime.utcnow, index=True)
    estado = Column(
        Enum("PENDIENTE", "EN_PROCESO", "VALIDADO", "DESPACHADO", name="estado_pedido_enum"),
        default="PENDIENTE"
    )

    cliente = relationship("Cliente", back_populates="pedidos")
    items = relationship("ItemPedido", back_populates="pedido", cascade="all, delete-orphan")
    alistamientos = relationship("Alistamiento", back_populates="pedido")
    validaciones = relationship("Validacion", back_populates="pedido")


class ItemPedido(Base):
    __tablename__ = "items_pedido"

    id = Column(Integer, primary_key=True, index=True)
    id_pedido = Column(Integer, ForeignKey("pedidos.id", ondelete="CASCADE"), nullable=False, index=True)
    id_producto = Column(Integer, ForeignKey("productos.id"), nullable=True)
    referencia = Column(String(50), nullable=False, index=True)
    descripcion = Column(String(300))
    cantidad_solicitada = Column(Integer, nullable=False)
    cantidad_validada = Column(Integer, default=0)
    estado = Column(
        Enum("PENDIENTE", "OK", "FALTANTE", "SOBRANTE", "NO_SOLICITADO", name="estado_item_enum"),
        default="PENDIENTE"
    )

    pedido = relationship("Pedido", back_populates="items")
    producto = relationship("Producto", back_populates="items")


class Alistamiento(Base):
    __tablename__ = "alistamientos"

    id = Column(Integer, primary_key=True, index=True)
    id_pedido = Column(Integer, ForeignKey("pedidos.id"), nullable=False, index=True)
    id_alistador = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    hora_inicio = Column(DateTime, nullable=False)
    hora_fin = Column(DateTime)
    estado = Column(
        Enum("EN_PROCESO", "COMPLETADO", "CANCELADO", name="estado_alistamiento_enum"),
        default="EN_PROCESO"
    )

    pedido = relationship("Pedido", back_populates="alistamientos")
    alistador = relationship("Usuario", back_populates="alistamientos", foreign_keys=[id_alistador])
    validacion = relationship("Validacion", back_populates="alistamiento", uselist=False)


class Validacion(Base):
    __tablename__ = "validaciones"

    id = Column(Integer, primary_key=True, index=True)
    id_pedido = Column(Integer, ForeignKey("pedidos.id"), nullable=False, index=True)
    id_validador = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    id_alistador = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    id_alistamiento = Column(Integer, ForeignKey("alistamientos.id"), nullable=True)
    hora_inicio = Column(DateTime, nullable=False)
    hora_fin = Column(DateTime)
    total_unidades = Column(Integer, default=0)
    estado = Column(
        Enum("EN_PROCESO", "OK", "CON_NOVEDADES", name="estado_validacion_enum"),
        default="EN_PROCESO"
    )
    observaciones = Column(Text)
    cerrado_con_novedades = Column(Boolean, default=False)

    pedido = relationship("Pedido", back_populates="validaciones")
    validador = relationship("Usuario", back_populates="validaciones_hechas", foreign_keys=[id_validador])
    alistador = relationship("Usuario", foreign_keys=[id_alistador])
    alistamiento = relationship("Alistamiento", back_populates="validacion")
    correcciones = relationship("Correccion", back_populates="validacion", cascade="all, delete-orphan")


class Correccion(Base):
    __tablename__ = "correcciones"

    id = Column(Integer, primary_key=True, index=True)
    id_validacion = Column(Integer, ForeignKey("validaciones.id", ondelete="CASCADE"), nullable=False, index=True)
    id_supervisor = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    referencia_afectada = Column(String(50))
    cantidad_corregida = Column(Integer)
    causa = Column(
        Enum(
            "PISTOLEO DE MAS",
            "TOMO EL QR MAS NO EL CODEBAR",
            "ALISTAMIENTO DE MAS",
            "ALISTAMIENTO DE MENOS",
            "ALISTAMIENTO DE REF NO SOLICITADA",
            "ERROR DE ETIQUETA ORIGINAL",
            "OTRO",
            name="causa_correccion_enum"
        )
    )
    descripcion_causa = Column(Text)
    fecha_hora = Column(DateTime, default=datetime.utcnow)

    validacion = relationship("Validacion", back_populates="correcciones")
    supervisor = relationship("Usuario", back_populates="correcciones_autorizadas")


class Empaque(Base):
    __tablename__ = "empaques"

    id = Column(Integer, primary_key=True, index=True)
    codigo_empaque = Column(String(20), unique=True, nullable=False, index=True)
    id_usuario = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    tipo_empaque = Column(Enum("CAJA", "ESTIBA", name="tipo_empaque_enum"), nullable=False)
    numero_caja = Column(Integer, nullable=False)
    total_cajas = Column(Integer, nullable=False)
    cajas_internas = Column(Integer)
    pedidos_asociados = Column(Text)
    cliente = Column(String(200), index=True)
    direccion = Column(String(500))
    ciudad = Column(String(100))
    departamento = Column(String(100))
    telefono = Column(String(50))
    fecha_hora = Column(DateTime, default=datetime.utcnow, index=True)

    usuario = relationship("Usuario", back_populates="empaques")


class SecuenciaDiaria(Base):
    __tablename__ = "secuencias_diarias"

    id = Column(Integer, primary_key=True, index=True)
    prefijo_fecha = Column(String(6), unique=True, nullable=False, index=True)
    ultimo_numero = Column(Integer, default=0)
