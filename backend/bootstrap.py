"""
Crea el usuario administrador inicial desde variables de entorno si no existe ningún admin activo.

Idempotente y seguro ante reinicios; no sobrescribe cuentas existentes.
"""

import logging
from sqlalchemy.orm import Session

from auth import hash_password
from config import settings
from models import Usuario

logger = logging.getLogger(__name__)

_MIN_PW_LENGTH_PROD = 12
_MIN_PW_LENGTH_DEV = 8


def run_bootstrap(db: Session) -> None:
    """Si no hay admins activos y BOOTSTRAP_* están definidos, crea un admin inicial."""
    if not settings.bootstrap_admin_cedula or not settings.bootstrap_admin_password:
        logger.warning(
            "Bootstrap omitido: defina BOOTSTRAP_ADMIN_CEDULA y BOOTSTRAP_ADMIN_PASSWORD en .env "
            "si necesita crear el primer administrador automaticamente."
        )
        return

    min_len = (
        _MIN_PW_LENGTH_DEV
        if settings.app_environment.lower() == "development"
        else _MIN_PW_LENGTH_PROD
    )
    if len(settings.bootstrap_admin_password) < min_len:
        logger.error(
            "Bootstrap abortado: la contraseña de BOOTSTRAP_ADMIN_PASSWORD debe tener "
            "al menos %s caracteres (entorno '%s').",
            min_len,
            settings.app_environment,
        )
        return

    exists = db.query(Usuario).filter(
        Usuario.rol == "admin",
        Usuario.activo.is_(True),
    ).first()
    if exists:
        return

    clash = db.query(Usuario).filter(
        Usuario.cedula == settings.bootstrap_admin_cedula.strip(),
    ).first()
    if clash:
        logger.warning(
            "Bootstrap omitido: la cédula %s ya existe sin rol admin activo.",
            settings.bootstrap_admin_cedula.strip(),
        )
        return

    nombre = settings.bootstrap_admin_nombre.strip() or "Administrador"
    admin = Usuario(
        cedula=settings.bootstrap_admin_cedula.strip(),
        nombre=nombre,
        password_hash=hash_password(settings.bootstrap_admin_password),
        rol="admin",
        activo=True,
    )
    db.add(admin)
    db.commit()
    logger.info(
        "Bootstrap: administrador inicial creado (cédula=%s). Cree supervisores desde Usuarios.",
        admin.cedula,
    )
