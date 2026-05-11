"""
Usuario y roles de DEMOSTRACION — solo ejecutar en entorno de desarrollo.

NO usar en producción. El administrador real se crea con BOOTSTRAP_* al arrancar el API.

Uso (con .env y APP_ENV=development):
    python seed_dev.py
"""

import sys

from sqlalchemy.orm import Session

from auth import hash_password
from config import settings
from database import SessionLocal, engine, Base
import models  # noqa: F401
from models import Usuario


USUARIOS_DEMO = [
    {
        "cedula": "sup_demo_1",
        "nombre": "SUPERVISOR DEMO UNO",
        "password": "demo12345678",
        "rol": "supervisor",
    },
    {
        "cedula": "sup_demo_2",
        "nombre": "SUPERVISOR DEMO DOS",
        "password": "demo12345678",
        "rol": "supervisor",
    },
    {
        "cedula": "op_demo_1",
        "nombre": "OPERARIO DEMO UNO",
        "password": "demo12345678",
        "rol": "operario",
    },
]


def seed_dev(db: Session) -> int:
    created = 0
    for data in USUARIOS_DEMO:
        existe = db.query(Usuario).filter(Usuario.cedula == data["cedula"]).first()
        if existe:
            continue
        db.add(
            Usuario(
                cedula=data["cedula"],
                nombre=data["nombre"],
                password_hash=hash_password(data["password"]),
                rol=data["rol"],
                activo=True,
            )
        )
        created += 1
        print(f"  ✓ Creado demo: {data['nombre']} ({data['rol']})")
    db.commit()
    return created


def main() -> None:
    if settings.app_environment.lower() != "development":
        print(
            "ERROR: seed_dev.py solo se ejecuta con APP_ENV=development en .env.\n"
            "En produccion use BOOTSTRAP_ADMIN_* y cree el resto desde la pantalla Usuarios.",
            file=sys.stderr,
        )
        sys.exit(1)

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        n = seed_dev(db)
        print(f"\nseed_dev completado: {n} usuario(s) demo nuevos.")
        print("Credenciales demo: revisar passwords en backend/seed_dev.py (solo dev).")
    finally:
        db.close()


if __name__ == "__main__":
    main()
