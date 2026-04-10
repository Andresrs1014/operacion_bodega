"""
Script de seed inicial.
Crea el usuario admin y los supervisores definidos.

Uso:
    python seed.py
"""
import sys
from database import SessionLocal, engine, Base
import models  # noqa: F401 — registra todos los modelos
from models import Usuario
from auth import hash_password


USUARIOS_INICIALES = [
    {
        "cedula": "admin",
        "nombre": "Administrador",
        "password": "cambiar_esta_clave",
        "rol": "admin",
    },
    {
        "cedula": "79714232",
        "nombre": "JUVENAL GALINDO",
        "password": "cambiar_esta_clave",
        "rol": "supervisor",
    },
    {
        "cedula": "1013678677",
        "nombre": "LAURA PELAEZ",
        "password": "cambiar_esta_clave",
        "rol": "supervisor",
    },
]


def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        created = 0
        for data in USUARIOS_INICIALES:
            existe = db.query(Usuario).filter(Usuario.cedula == data["cedula"]).first()
            if not existe:
                user = Usuario(
                    cedula=data["cedula"],
                    nombre=data["nombre"],
                    password_hash=hash_password(data["password"]),
                    rol=data["rol"],
                )
                db.add(user)
                created += 1
                print(f"  ✓ Creado: {data['nombre']} ({data['rol']})")
            else:
                print(f"  - Ya existe: {data['nombre']}")

        db.commit()
        print(f"\nSeed completado. {created} usuario(s) creado(s).")
        print("\n⚠️  Cambia las contraseñas desde la app antes de poner en producción.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
