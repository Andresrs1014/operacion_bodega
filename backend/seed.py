"""
Entrada legada para equipos habituados a `python seed.py`.

- En PRODUCCIÓN: el administrador inicial se crea al arrancar el API mediante
  BOOTSTRAP_ADMIN_CEDULA / BOOTSTRAP_ADMIN_PASSWORD (ver bootstrap.py).
- Usuarios de demostración: solo con APP_ENV=development ejecutando:  python seed_dev.py
"""

import sys

from config import settings


def main() -> None:
    print(
        "\nEste proyecto ya no carga usuarios de produccion desde este archivo.\n\n"
        "  • Produccion / Docker:\n"
        "    Configure en .env: BOOTSTRAP_ADMIN_CEDULA, BOOTSTRAP_ADMIN_PASSWORD\n"
        "    (opcional: BOOTSTRAP_ADMIN_NOMBRE). Al iniciar el backend, se crea el primer\n"
        "    admin si no existe ninguno activo.\n\n"
        "  • Desarrollo (usuarios demo supervisor/operario):\n"
        "    APP_ENV=development  y  python seed_dev.py\n\n"
        "Mas detalle: frontend/docs/plan-usuarios-admin-bootstrap.md\n",
        file=sys.stderr,
    )
    if settings.app_environment.lower() == "development":
        print(
            "(APP_ENV=development) Para crear usuarios demo ejecute: python seed_dev.py\n",
            file=sys.stderr,
        )
    sys.exit(1)


if __name__ == "__main__":
    main()
