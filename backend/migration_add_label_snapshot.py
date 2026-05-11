"""
Migración manual: añade columna label_snapshot a validaciones.
Ejecutar UNA VEZ en el servidor:
    cd backend && python migration_add_label_snapshot.py
"""
from database import engine
from sqlalchemy import text


def up():
    with engine.connect() as conn:
        try:
            conn.execute(text(
                "ALTER TABLE validaciones ADD COLUMN label_snapshot TEXT;"
            ))
            conn.commit()
            print("✓ Columna label_snapshot añadida.")
        except Exception as e:
            if "already exists" in str(e).lower() or "duplicate column" in str(e).lower():
                print("- label_snapshot ya existe, sin cambios.")
            else:
                raise


if __name__ == "__main__":
    up()
