# Plan: administradores sin hardcode (bootstrap desde el admin inicial)

> **Estado:** Fase 1 (bootstrap vía `.env` + `seed_dev` opcional + `lifespan`) **implementada** en el código. Este documento sigue sirviendo como referencia; Fases 2–3 pendientes.

**Alcance original:** análisis, viabilidad y pasos de implementación.

**Contexto actual (revisado contra el código):**

- `backend/seed.py` define en duro `admin` + 2 supervisores con cédulas, nombres y contraseñas reales — esto viola el principio de **no secretos en fuente** incluso si el seed es "solo desarrollo".
- `backend/config.py` usa `pydantic_settings.BaseSettings` con `env_file = ".env"` — ya existe la infraestructura para leer variables de entorno; solo hay que añadir las del bootstrap.
- `backend/main.py` ya tiene un hook `lifespan` activo (arranca el scheduler). El bootstrap puede engancharse allí sin cambio de arquitectura.
- `docker-compose.yml` ya pasa variables por `env_file: .env` al backend — agregar `BOOTSTRAP_*` no requiere modificar el compose, solo documentarlas.
- `backend/routers/usuarios.py` ya expone `POST /api/usuarios/` restringido a `require_admin`. Es decir, **una vez exista el admin inicial, puede crear el resto vía UI o script**; el único hueco es ese primer admin.
- `SUPERVISORS` en `frontend/js/script_validacion.js` (pines hardcoded) y `GET /validacion/supervisores-firma` (ya implementado) son redundantes — ver Fase 3.

---

## Objetivo

1. Un **único** usuario raíz obtenido de variables de entorno (nunca lista en código).
2. Ese usuario crea el resto (admins, supervisores) vía la pantalla Usuarios o un script de ops.
3. Eliminar del repositorio: contraseñas y cédulas/nombres de producción de `seed.py`.

---

## Viabilidad

| Enfoque | Factible | Notas |
|--------|----------|--------|
| Admin inicial vía env (`BOOTSTRAP_ADMIN_CEDULA`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_NOMBRE`) creado en `lifespan` si no existe ningún admin | **Sí** | Encaja con `config.py` (BaseSettings) y `lifespan` en `main.py` sin fricción. |
| `seed.py` solo para dev con datos no sensibles | **Sí** | Guardar en `seed_dev.py`, nunca ejecutar en prod. Separar responsabilidades. |
| Cambio de contraseña forzado en primer login | **Sí (fase 2)** | Añadir `debe_cambiar_password: bool` al modelo `Usuario` + flujo en frontend. |
| Auditoría de creación de usuarios | **Sí (fase 2)** | Añadir `creado_por_id: int FK` y `creado_en: datetime` a `Usuario`. |
| Eliminar mapa `SUPERVISORS` hardcoded del frontend | **Sí (fase 3)** | La API `/validacion/supervisores-firma` ya existe; solo falta reemplazar el mapa local. |

---

## Cómo implementarlo

### Fase 1 — Bootstrap mínimo (cambios pequeños, alto valor)

#### 1. Añadir variables a `config.py`

```python
# backend/config.py
class Settings(BaseSettings):
    # ... campos existentes ...

    # Bootstrap: solo se usan si no hay ningún admin en BD
    bootstrap_admin_cedula: str = ""
    bootstrap_admin_password: str = ""
    bootstrap_admin_nombre: str = "Administrador"
```

Las variables en `.env` serían (en minúsculas o mayúsculas, pydantic-settings las normaliza):

```dotenv
BOOTSTRAP_ADMIN_CEDULA=admin
BOOTSTRAP_ADMIN_PASSWORD=cambia-esto-en-produccion
BOOTSTRAP_ADMIN_NOMBRE=Administrador
```

#### 2. Función de bootstrap (nuevo archivo `backend/bootstrap.py`)

```python
import logging
from sqlalchemy.orm import Session
from models import Usuario
from auth import hash_password
from config import settings

logger = logging.getLogger(__name__)


def run_bootstrap(db: Session) -> None:
    """Crea el admin inicial si no existe ningún usuario con rol=admin.

    Idempotente: si ya hay al menos un admin, no hace nada.
    No lanza excepción si las variables no están definidas; solo avisa.
    """
    if not settings.bootstrap_admin_cedula or not settings.bootstrap_admin_password:
        logger.warning(
            "BOOTSTRAP_ADMIN_CEDULA / BOOTSTRAP_ADMIN_PASSWORD no definidas. "
            "Si la BD no tiene admins, el sistema no tendrá acceso inicial."
        )
        return

    hay_admin = db.query(Usuario).filter(Usuario.rol == "admin", Usuario.activo.is_(True)).first()
    if hay_admin:
        return  # ya existe, nada que hacer

    admin = Usuario(
        cedula=settings.bootstrap_admin_cedula,
        nombre=settings.bootstrap_admin_nombre,
        password_hash=hash_password(settings.bootstrap_admin_password),
        rol="admin",
        activo=True,
    )
    db.add(admin)
    db.commit()
    logger.info("Bootstrap: admin inicial creado (cédula=%s).", settings.bootstrap_admin_cedula)
```

#### 3. Llamarlo desde `lifespan` en `main.py`

```python
# backend/main.py
from database import SessionLocal
from bootstrap import run_bootstrap

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Bootstrap del admin inicial
    with SessionLocal() as db:
        run_bootstrap(db)
    # Scheduler
    start_scheduler()
    yield
    stop_scheduler()
```

#### 4. Limpiar `seed.py`

Renombrar a `seed_dev.py` y eliminar contraseñas reales:

```python
# backend/seed_dev.py  — SOLO para entornos de desarrollo local
# NO ejecutar en producción. Usar bootstrap via env para el admin real.

USUARIOS_DEMO = [
    # Contraseñas de demo: cambiar antes de cualquier uso real
    {"cedula": "supervisor1", "nombre": "Supervisor Demo 1", "password": "demo1234", "rol": "supervisor"},
    {"cedula": "supervisor2", "nombre": "Supervisor Demo 2", "password": "demo1234", "rol": "supervisor"},
    {"cedula": "operario1",   "nombre": "Operario Demo 1",  "password": "demo1234", "rol": "operario"},
]
```

El admin de dev también vendría de `.env` (con valores de dev no sensibles).

#### 5. Documentar en `docker-compose.yml` (comentario)

```yaml
  backend:
    env_file: .env
    # Variables requeridas en .env:
    #   DATABASE_URL, SECRET_KEY
    #   BOOTSTRAP_ADMIN_CEDULA, BOOTSTRAP_ADMIN_PASSWORD  ← primer admin
    #   (ver docs/plan-usuarios-admin-bootstrap.md)
```

---

### Fase 2 — UX y gobernanza

1. **Cambio de contraseña forzado:** añadir `debe_cambiar_password: bool = False` a `Usuario`. El endpoint de login devuelve `{"debe_cambiar_password": true}` y el frontend redirige al flujo de cambio.
2. **Wizard primer acceso:** al detectar que solo existe el admin bootstrap, mostrar modal "Crea un segundo admin antes de empezar" para evitar lock-out.
3. **Auditoría:** añadir `creado_por_id: int FK nullable` y `creado_en: datetime` a `Usuario`; popular en `POST /api/usuarios/`.

---

### Fase 3 — Eliminar hardcode de supervisores en frontend

El mapa `SUPERVISORS` en `script_validacion.js` y el endpoint `/validacion/supervisores-firma` son redundantes. El mapa local es **fuente de desajuste**: si se cambia un supervisor en BD, el frontend no se entera.

**Plan de migración:**

1. Al cargar la vista de validación (`attemptLogin` ya llama `loadSupervisoresFirmaCache`), poblar un mapa local desde la API en vez del literal hardcoded.
2. Reemplazar la verificación `SUPERVISORS[code]` por una búsqueda en ese caché por código/cédula — requiere que el modelo `Usuario` exponga `cedula` en `supervisores-firma` (hoy solo devuelve `id` y `nombre`).
3. Los PINs (`PIN_CODE = "2025"`) son un caso distinto: son un mecanismo de acceso de emergencia, deben vivir en configuración de servidor, no en código fuente.

**Propuesta de schema extendido:**

```python
class SupervisorFirmaOut(BaseModel):
    id: int
    nombre: str
    codigo_pin: str  # código de supervisor para validar desde frontend (ej: "*197501")
    model_config = {"from_attributes": True}
```

O bien: el frontend envía el código al backend para que lo valide (`POST /validacion/verificar-supervisor`) y el backend responde con el id. Así los códigos nunca viajan al cliente.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Despliegue sin variables de bootstrap → sin admin | Log de advertencia claro al arrancar; documentación obligatoria en `.env.example`. |
| Variable `BOOTSTRAP_ADMIN_PASSWORD` débil en prod | Exigir longitud mínima en `run_bootstrap` (validar antes de crear). |
| Credencial bootstrap olvidada / filtrada | Proceso operativo: al crear el segundo admin, rotar o desactivar la cuenta bootstrap. Documentar en guía de despliegue. |
| `seed_dev.py` ejecutado en prod por error | Añadir guardia `if settings.env != "development": sys.exit(1)` al inicio del script. |
| `seed.py` actual en historial git con contraseñas | Girar contraseñas actuales una vez implementado el bootstrap. El historial no se puede limpiar fácilmente sin rebase; la mitigación es la rotación. |

---

## Definición de hecho

- `seed.py` sin contraseñas ni cédulas de producción (eliminado o renombrado a `seed_dev.py`).
- `bootstrap.py` idempotente: crear, no sobrescribir.
- Variables documentadas en `.env.example` (crear si no existe).
- Un camino documentado para el primer admin en la guía de despliegue.
- Creación de admins adicionales vía UI probada en Docker end-to-end.
- Regresión: login, creación de operario/supervisor, validación/empaque sin cambios de contrato.

---

## Referencia cruzada

- Routers relevantes: `backend/routers/usuarios.py` (`require_admin`), `backend/routers/validacion.py` (`/supervisores-firma`).
- Infraestructura de configuración: `backend/config.py` (BaseSettings), `docker-compose.yml`.
- Matriz de fallos: `matriz-fallos-empaque-validacion.md` (mismo directorio).
- Impresión Zebra: `confirmacion-impresora-zebra-zt230.md` (mismo directorio).
