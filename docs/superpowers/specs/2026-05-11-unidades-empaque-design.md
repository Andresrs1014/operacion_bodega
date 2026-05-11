# Diseño: Módulo Unidades de Empaque (UE)

**Fecha:** 2026-05-11
**Estado:** Aprobado — pendiente plan de implementación
**Referencia de negocio:** `docs/Unidades_de_empaque.md`
**Plan original:** `docs/plan-implementacion-unidades-empaque.md`

---

## 1. Objetivo

Permitir a admins y supervisores gestionar el catálogo de **unidades de empaque (UE)** por referencia. Al validar un pedido, el sistema usa la UE del catálogo para calcular cuántos pistoleos necesita el operario en lugar de uno por unidad suelta.

**Ejemplo:** pedido 30 unidades, UE = 10 → el operario pistolea **3 veces**, no 30.

---

## 2. Decisiones tomadas

| Decisión | Elección | Razón |
|----------|----------|-------|
| Permisos de escritura | Admin + supervisor | Ajustes en piso sin depender del admin |
| Permisos de lectura `/batch` | Cualquier rol autenticado | Los operarios validan; necesitan UE |
| Sincronización en validación | Al cargar el Excel del pedido | Solo descarga las refs del pedido activo |
| Google Sheets | Eliminar completamente | Código muerto, proxies inestables, deuda técnica |
| Estructura frontend | Página nueva independiente | Sigue patrón `usuarios.html`, sin contaminar páginas existentes |
| `updated_at` en Producto | Obligatorio | `.cursorrules` exige auditoría en módulos sensibles |

---

## 3. Arquitectura y flujo de datos

```
unidades_empaque.html
  └── js/unidades_empaque.js  (funciones ≤40 líneas c/u)
        └── api.js  (nuevos métodos UE)
              └── /api/productos/ue  (CRUD + import + batch)

backend/routers/productos.py   ← nuevo
  └── backend/services/productos.py  ← nuevo
        └── models.Producto  (ya existe, añadir updated_at)

validacion (cambio mínimo):
  handleExcelUpload()
    → extrae refs del Excel
    → POST /api/productos/ue/batch
    → puebla app.masterData
    → si ref no está → UE=1 + banner amarillo (no bloquea)
    → si /batch falla → UE=1 + banner amarillo (fallback explícito)
```

**Eliminaciones comprometidas:**
- `fetchMasterData()` y su bloque de proxies CORS
- Spinner/botón de sincronización de Google Sheets
- URLs de Google Sheets en el código
- TODO comment sobre reemplazar Sheets (ya no aplica)

---

## 4. Backend

### 4.1 Endpoints

Prefijo: `/api/productos/ue`

| Método | Ruta | Roles | Descripción |
|--------|------|-------|-------------|
| `GET` | `/` | admin, supervisor | Lista paginada. Params: `q`, `page=1`, `limit=50`. Respuesta: `{items, total, page, pages}` |
| `POST` | `/` | admin, supervisor | Alta manual. Body: `{referencia, unidad_empaque, texto_unidad_empaque?}` |
| `PATCH` | `/{id}` | admin, supervisor | Edición parcial |
| `DELETE` | `/{id}` | admin, supervisor | Elimina solo si sin ItemPedido activos → 409 si tiene |
| `POST` | `/import` | admin, supervisor | Multipart Excel → upsert por chunks de 500. Respuesta: `{ok, creadas, actualizadas, errores[{fila, referencia, motivo}]}` |
| `POST` | `/batch` | todos (auth) | Body: `{referencias: [str]}` máx 500. Devuelve solo las que existen: `[{referencia, unidad_empaque, texto_unidad_empaque}]` |
| `GET` | `/plantilla` | admin, supervisor | Descarga Excel vacío con columnas Referencia / UE |

### 4.2 Reglas de negocio (`services/productos.py`)

- `referencia`: trim + uppercase + máx 50 chars + única
- `unidad_empaque`: entero ≥ 1, obligatorio
- `texto_unidad_empaque`: texto libre, opcional, máx 50 chars
- **Import:** transacciones de 500 filas. Responde `{fila, referencia, motivo}` por error. Límite: 10 MB de archivo, 10.000 filas máximo — HTTP 413 si excede
- **`/batch`:** máx 500 refs por llamada. Usa índice existente en `referencia`. Respuesta < 100 ms esperada
- **DELETE:** verificación transaccional antes de eliminar. Si `ItemPedido.referencia` coincide y pedido en estado activo → HTTP 409

### 4.3 Modelo — ajuste a `Producto`

Añadir columna:

```python
updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

Migración automática en `lifespan` (mismo patrón que `migration_add_label_snapshot.py`):

```python
ALTER TABLE productos ADD COLUMN updated_at TIMESTAMP;
UPDATE productos SET updated_at = NOW() WHERE updated_at IS NULL;
```

### 4.4 Permisos

```python
# Lectura catálogo + escritura
require_supervisor_or_admin

# /batch — solo requiere sesión válida
get_current_user
```

### 4.5 Seguridad (`.cursorrules`)

- Validación de entrada en backend siempre (no confiar en cliente)
- Límite de payload en import: 10 MB / 10.000 filas
- No exponer stacktraces en errores — solo mensaje de negocio
- Logs de acceso denegado en endpoints de escritura
- `/batch` sin rate limit agresivo pero con auth obligatoria

---

## 5. Frontend

### 5.1 Archivos nuevos

```
frontend/
  unidades_empaque.html
  js/unidades_empaque.js    ← funciones cortas, una responsabilidad c/u
```

### 5.2 Nuevos métodos en `api.js`

```javascript
getUnidadesEmpaque({ q, page, limit })   // GET /
createProductoUe(body)                    // POST /
updateProductoUe(id, body)               // PATCH /{id}
deleteProductoUe(id)                     // DELETE /{id}
importUnidadesEmpaque(file, onProgress)  // POST /import (chunks)
batchUnidadesEmpaque(referencias)        // POST /batch
descargarPlantillaUe()                   // GET /plantilla
```

### 5.3 Nuevo enlace en `nav.js`

```javascript
catalogo: {
    label: 'CATÁLOGO UE',
    href: '/unidades_empaque.html',
    roles: ['admin', 'supervisor']
}
```

### 5.4 Layout pantalla principal

**Barra superior:**
- Input búsqueda con debounce 300 ms → limpia paginación, vuelve a página 1
- Botón `NUEVA +` (rojo, abre modal)
- Botón `↑ IMPORTAR` (gris oscuro, abre modal import)
- Link `↓ Plantilla` (texto pequeño)
- Contador `X referencias registradas`

**Tabla:**

| REFERENCIA | UE | TEXTO | |
|---|---|---|---|
| ABC-1234 | `6` ← badge verde | PAR X 6 | ✏️ |
| GHI-0001 | `1` ← badge gris | — | ✏️ |

- UE > 1 → badge verde (configurada)
- UE = 1 → badge gris (sin configurar operativamente)
- Sin zebra striping, hover sutil
- Sin botón eliminar en tabla — solo en modal de edición

**Paginación:** `← Anterior | Página N de M | Siguiente →` + `Mostrando X–Y de Z`

**Estado vacío:** "Sin referencias. Importa un Excel o añade una manualmente."
**Estado cargando:** skeleton rows (3 filas grises animadas)

### 5.5 Modal añadir / editar

Campos:
1. **Referencia*** — text, auto-uppercase al escribir, máx 50, requerido
2. **Unidad de empaque*** — number, mín 1, requerido
3. **Texto descriptivo** — text, opcional, máx 50, placeholder "Ej: PAR X 6"

Comportamiento:
- Validación inline al perder foco (no al escribir)
- `GUARDAR` → POST/PATCH → toast "Referencia guardada" → cierra modal → refresca tabla
- Modal edición incluye botón `ELIMINAR` en rojo tenue al pie, separado visualmente de los botones principales
- Error de referencia duplicada → mensaje inline "Esta referencia ya existe"

### 5.6 Modal importar Excel — 2 pasos

**Paso 1 — Selección:**
- Drop zone + selección de archivo (.xlsx, .xls, máx 10 MB)
- SheetJS parsea en cliente → detecta columnas "Referencia" y "UE" (case-insensitive, trim)
- ✅ verde si detecta ambas columnas + N filas
- ❌ rojo si no detecta → botón IMPORTAR deshabilitado + mensaje de ayuda
- Muestra modo: "UPSERT — actualiza si existe, crea si no. No elimina referencias."

**Paso 2 — Progreso:**
- Barra de progreso por chunk: `████████░░ 58% · Procesando lote 8 de 13 · 3.890 / 6.166 filas`
- No cierra modal durante proceso
- Al terminar:
  - `X actualizadas · Y creadas · Z con error`
  - Si errores > 0 → botón `↓ Descargar errores CSV`
  - Botón `CERRAR`

### 5.7 Banner en validación

Aparece debajo del nombre del archivo Excel cargado, solo si `/batch` devuelve referencias faltantes:

```
⚠ 12 referencias sin UE registrada. Se tomará 1 unidad por pistoleo.  [Ver catálogo →]  [×]
```

- Fondo `bg-amber-50`, borde `border-amber-400`
- No bloquea el flujo — operario puede seguir
- Link abre catálogo en pestaña nueva (`target="_blank"`)
- `[×]` cierra el banner sin efecto en la sesión

**Fallback si `/batch` falla por red/backend:**
- Mismo banner con texto: "No se pudo verificar catálogo UE. Se tomará 1 unidad por pistoleo."
- Validación continúa con `UE=1` para todas las referencias

### 5.8 Modularidad `unidades_empaque.js`

Funciones exportadas / expuestas:

```javascript
loadPage(page)           // fetch + renderTable
submitSearch()           // lee input, llama loadPage(1)
openAddModal()           // abre modal vacío
openEditModal(item)      // abre modal con datos
submitModal()            // POST o PATCH según modo
confirmDelete(id)        // confirmación + DELETE
openImportModal()        // abre modal import
handleFileSelect(file)   // SheetJS parse + validación encabezados
submitImport()           // envío por chunks con progress
renderTable(data)        // pinta filas
renderPagination(meta)   // pinta controles
showUeToast(msg, type)   // toast local — mismo patrón visual que validacion_aux.js
                         // pero independiente (validacion_aux no se carga en esta página)
```

Cada función: ≤ 40 líneas. Sin lógica de negocio en handlers de eventos.

> **Nota de implementación:** `showUeToast` usa su propio div `#ue-toast` en el HTML de la página, siguiendo el mismo patrón de `#val-toast` en `validacion_estructura.html` (fixed, centrado, fade, auto-ocultar a 3s).

---

## 6. Integración con validación

### Reemplaza `fetchMasterData()`

En `handleExcelUpload()`, después de parsear el Excel:

```javascript
// Extraer referencias únicas del pedido
const refs = [...new Set(rows.map(r => String(r[kRef]).trim().toUpperCase()))];

// Consultar catálogo (solo las refs del pedido)
let catalogMap = {};
try {
    const found = await api.batchUnidadesEmpaque(refs);
    found.forEach(p => {
        catalogMap[p.referencia] = { unit: p.unidad_empaque, unitLabel: p.texto_unidad_empaque || String(p.unidad_empaque) };
    });
} catch {
    // Fallback: catálogo vacío, UE=1 para todo
}

app.masterData = catalogMap;

// Banner si hay refs sin UE
const sinUe = refs.filter(r => !catalogMap[r]);
if (sinUe.length > 0) {
    showCatalogoWarningBanner(sinUe.length);
}
```

### Eliminar de `script_validacion.js`

- Función `fetchMasterData()` completa
- Variable `proxies` y toda la lógica de CORS
- Spinner `#sync-spinner` y `#sync-text` (si existen en el HTML)
- Cualquier referencia a URLs de Google Sheets

---

## 7. Fases de implementación

| Fase | Entrega | Verificación |
|------|---------|--------------|
| **F1** | Migración `updated_at` + `routers/productos.py` + `services/productos.py` (list, get, create, patch, delete) | Build Docker, endpoints responden en OpenAPI |
| **F2** | Import por chunks + `/batch` + `/plantilla` | Import de 6k filas < 30s, sin timeout, errores por fila |
| **F3** | `unidades_empaque.html` + `js/unidades_empaque.js` + nav link | Listado 6k sin lag, búsqueda, paginación, CRUD |
| **F4** | Modal import UI + barra de progreso | Import desde UI funciona end-to-end en Docker |
| **F5** | Validación consume `/batch`, elimina `fetchMasterData`, banner amarillo | Regresión pistoleo OK, Google Sheets eliminado, doc actualizada |

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Timeout en import 6k filas | Chunks de 500 + transacciones separadas |
| Import > 10MB / > 10k filas | HTTP 413 en backend + validación previa en cliente |
| Catálogo desactualizado en piso | `/batch` se llama en cada carga de Excel (siempre fresco) |
| `/batch` falla durante validación | Fallback UE=1 + banner — validación nunca se bloquea |
| Referencias duplicadas en Excel | Upsert por `referencia` — último valor gana, se reporta en resumen |
| DELETE con ItemPedido activos | HTTP 409 + mensaje claro, verificación transaccional |
| `unidades_empaque.js` crece descontrolado | Funciones ≤40 líneas, revisión en code-review |

---

## 9. Definición de hecho

- [ ] Build Docker pasa sin errores tras F5
- [ ] Import de 6.166 filas completa en < 30s sin timeout
- [ ] Listado con 6k+ registros no degrada UI (paginación server-side verificada)
- [ ] Validación usa UE del catálogo con fallback explícito y banner en UI
- [ ] `fetchMasterData()` y referencias a Google Sheets eliminadas del código
- [ ] Ningún flujo nuevo usa `alert()` para errores recuperables
- [ ] `updated_at` en tabla `productos` con migración automática en lifespan
- [ ] Contrato API documentado (este doc + OpenAPI auto-generado por FastAPI)
- [ ] `nav.js` muestra "CATÁLOGO UE" solo para admin y supervisor

---

## 10. Referencias en el repo

- Requisitos originales: `docs/Unidades_de_empaque.md`
- Plan técnico anterior: `docs/plan-implementacion-unidades-empaque.md`
- Modelo: `backend/models.py → Producto`
- Multiplicador actual: `frontend/js/script_validacion.js → processScan, startValidation, app.masterData`
- Patrón migración: `backend/migration_add_label_snapshot.py`
- Patrón toast: `frontend/js/validacion_aux.js → showToast`
- Patrón modal: `frontend/usuarios.html`
- Permisos: `backend/dependencies.py → require_supervisor_or_admin`
