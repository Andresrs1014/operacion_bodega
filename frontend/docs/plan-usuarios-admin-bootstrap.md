# Plan: administradores sin hardcode (bootstrap desde el admin inicial)

**Alcance:** solo análisis y pasos propuestos. **No implementa cambios.**

**Contexto actual (revisión rápida):**

- `backend/seed.py` define en código varios usuarios iniciales: un `admin` y dos `supervisor` con cédulas, nombres y contraseñas fijas — esto contradice la regla de **mínimo hardcode** y de **no secretos en fuente** (aunque el seed sea “solo desarrollo”).
- El API ya permite **crear cualquier rol** desde un usuario autenticado como admin: `POST /api/usuarios/` con `require_admin` en `backend/routers/usuarios.py`. Es decir, **la capacidad de que el admin inicial cree más administradores ya existe**; el hueco es el **arranque** (quién es el primer admin y cómo se provisiona sin lista fija en repo).

---

## Objetivo

1. Un **único** usuario “raíz” o de arranque, obtenido de **configuración segura** (entorno / secretos), no de listas en código.
2. Ese usuario crea el resto (incluidos **otros admins** y supervisores) vía la pantalla **Usuarios** o un script de ops.
3. Reducir o eliminar del repositorio: contraseñas, y en la medida posible cédulas/nombres de producción en `seed.py`.

---

## Viabilidad

| Enfoque | Factible | Notas |
|--------|----------|--------|
| Solo admin inicial vía env (`BOOTSTRAP_ADMIN_CEDULA`, `BOOTSTRAP_ADMIN_PASSWORD`, nombre opcional) y `seed`/`startup` lo crea si no existe | Sí | Alineado con `.cursorrules` (secretos en env). Requiere documentar variables en `docs` y en `docker-compose`/plantilla `.env.example`. |
| Mantener `seed.py` solo para **dev** con datos de demo mínimos (sin credenciales reales) | Sí | Separar `seed.dev.py` vs comportamiento en producción. |
| Primer login forzado a **cambiar contraseña** del bootstrap | Sí (fase 2) | Campo `debe_cambiar_password` o similar + flujo en login. |
| Restringir “solo un admin en el sistema” | Producto | Hoy el modelo permite varios `rol=admin`; multi-admin suele ser deseable con auditoría. Si se quiere un solo admin, hace falta regla de negocio explícita + tests. |

---

## Cómo implementarlo (fases sugeridas)

### Fase 1 — Provisionamiento mínimo

1. **Variables de entorno** (nombres orientativos):  
   `BOOTSTRAP_ADMIN_CEDULA`, `BOOTSTRAP_ADMIN_PASSWORD`, opcional `BOOTSTRAP_ADMIN_NOMBRE`.  
   - En producción: secret manager o compose secrets, nunca valores en git.
2. **Al arrancar la app** (o en un comando `python -m … bootstrap` ejecutado una vez en despliegue):  
   - Si no existe ningún usuario con `rol=admin`, crear **uno** con esas variables.  
   - Si ya hay admin(s), **no** sobrescribir (idempotente).
3. **`seed.py`**:  
   - Opción A: dejar solo `create_all` + mensaje “usar bootstrap por env”.  
   - Opción B: mantener usuarios demo **solo** cuando `ENV=development` y contraseñas no reutilizables en prod.

### Fase 2 — UX y gobernanza

1. Documentar en la guía de despliegue: “primer paso → login bootstrap → crear supervisores/admins reales → desactivar o rotar credencial bootstrap”.
2. (Opcional) Primer inicio: wizard “crear segundo admin” para no depender de una sola cuenta.
3. (Opcional) Auditoría: quién creó cada usuario (`creado_por_id`, `creado_en`).

### Fase 3 — Reducir hardcode en frontend

- `SUPERVISORS` y PINs en `script_validacion.js`: plan aparte alinear con `GET /validacion/supervisores-firma` y/o política de “solo supervisores en BD” (ya hay API; el mapa local es redundante y fuente de desajuste).
- `nav.js` “roles por ruta”: es configuración de producto, no secretos; puede quedarse o moverse a JSON cargado desde backend si se quiere un solo lugar.

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Despliegue sin variables → BD sin admin | Healthcheck o logs claros “no bootstrap admin”; documentación obligatoria. |
| Credencial bootstrap olvidada / filtrada | Rotación desde otro canal de recuperación solo si hay segundo admin (proceso operativo). |
| `seed.py` en CI crea admins duplicados | `seed` idempotente por `cedula` + no mezclar seed de prod con datos vivos. |

---

## Definición de hecho (para cuando se implemente)

- Ningún secreto ni contraseña de producción en archivos versionados.
- Un camino documentado para el **primer** admin.
- Creación de **admins adicionales** vía UI (ya soportado) probada en Docker.
- Regresión: login, creación de operario/supervisor, validación/empaque sin cambios de contrato no deseados.

---

## Referencia cruzada

- Matriz de fallos empaque/validación: `matriz-fallos-empaque-validacion.md` (mismo directorio).
- Impresión Zebra: confirmación técnica en `confirmacion-impresora-zebra-zt230.md` (mismo directorio).
