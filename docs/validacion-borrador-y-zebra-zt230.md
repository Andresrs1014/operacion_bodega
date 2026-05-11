# Validación: borrador por usuario, historial e impresión Zebra ZT-230

## Comportamiento nuevo

### Borrador (servidor, propio por usuario)

- Cada usuario autenticado tiene **como máximo un borrador** en tabla `validacion_borradores` (`id_usuario` único).
- Se actualiza con **debounce ~2 s** mientras la validación está abierta (escaneos, tabla, observaciones).
- Tras **finalizar** validación, el borrador se **elimina** automáticamente.
- UI en **Gestión datos**: aviso para **continuar** o **descartar**; `PUT/GET/DELETE /api/validacion/mi-borrador`.

### Historial propio

- `GET /api/validacion/mias?limit=…` lista validaciones **cerradas** del **validador actual** (no incluye `EN_PROCESO`).
- Panel **“Mis validaciones cerradas”** en la misma pantalla de carga Excel.

### Seguridad y KPIs

- Cierre y correcciones: solo el **validador asignado**, o **supervisor/admin**.
- `POST /validacion/{id}/correccion` con `id_supervisor` resuelto desde `GET /validacion/supervisores-firma` (nombres deben coincidir con usuarios en BD).
- Códigos locales `SUPERVISORS` en JS deben mapear a **nombres reales** de supervisores en la base (exactamente como en tabla `usuarios.nombre`). Crear esos usuarios desde **Usuarios** (admin). Si hay desajuste, la corrección puede no persistir.
- Pedido con cierre **CON_NOVEDADES** queda en estado `EN_PROCESO` (antes quedaba inconsistente).

### Alistamiento cancelado

- `PATCH /api/validacion/alistamiento/{id}/cancelar`: operario dueño o supervisor/admin; marca `CANCELADO` y cierra `hora_fin`.

### Impresión ZT-230

- Hoja **`frontend/css/print-zebra-zt230.css`**: `@page` orientado a **4"×6"** (~102×152 mm), uso típico ZT-203 dpi.
- **Validación:** botón imprime con clase `print-validation-active` en `<body>` y solo expone `#print-area`.
- **Empaque:** cola `#finalPrintQueue`; **`style_index.css`** define `.label-container` en **102×152 mm** (consistente con `@page`). La fila ciudad/depto/tel (`.location-row`) va en **fila horizontal**, no en el bloque legacy 100×80 mm que desalineaba la UM respecto a la ZT-230.
- **No** aplica a exportes Excel ni vistas solo web (p. ej. gráficas del dashboard).

## Docker / BD

- `create_all` creará `validacion_borradores` al arrancar el backend. Sin migraciones Alembic en el repo.

## Archivos tocados (referencia)

- Backend: `models.py`, `schemas.py`, `routers/validacion.py`, `services/validation_access.py`, `services/validacion_borrador.py`
- Frontend: `js/api.js`, `js/validacion_aux.js`, `js/script_validacion.js`, `validacion_estructura.html`, `css/print-zebra-zt230.css`, `css/style_validacion.css`, `index_estructura.html`, `css/style_index.css`
