# Plan de implementación: unidades de empaque (Referencia + UE)

**Referencia de negocio:** [Unidades_de_empaque.md](./Unidades_de_empaque.md)

**Alcance de este documento:** plan viable (sobre todo **frontend** + contratos con backend), alineado con **`.cursorrules`**: capas separadas, seguridad por defecto, Docker-ready, retrocompatibilidad, sin deuda crítica sin registrar, UX sin `alert()` bloqueante en flujos, documentación actualizada al cerrar fases.

---

## 1. Objetivo de producto

Permitir **configurar la unidad de empaque (UE)** por **referencia** para que, al validar (pistoleo), el sistema sume **cantidad = UE × 1 escaneo** en lugar de forzar un escaneo por unidad suelta.

**Ejemplo:** pedido 30 unidades, UE = 10 → el operario pistolea **3 veces**, no 30.

---

## 2. Estado actual del código (breve)

| Pieza | Estado |
|-------|--------|
| **Backend** | Existe modelo `Producto` (`referencia`, `unidad_empaque`, `texto_unidad_empaque`, índice en `referencia`). **No** hay router CRUD dedicado en `routers/` para exponer catálogo al frontend (convive con empaque, validación, usuarios, etc.). |
| **Validación (frontend)** | `app.masterData` se llena con `fetchMasterData()` desde Google Sheets vía **proxies CORS**; el propio código lo marca como frágil. `startValidation` y `processScan` ya aplican `item.unit` como multiplicador — el fallo operativo es **origen y mantenimiento** de esos datos, no la fórmula del pistoleo. |
| **Empaque** | No depende del catálogo UE para el flujo de etiquetas descrito en el doc de unidades; el impacto principal es **validación** (y futura consistencia si empaque consumiera el mismo catálogo). |

**Conclusión:** la implementación debe **centralizar UE en backend** (fuente de verdad) y hacer que **validación consuma API** (con caché local razonable), no hojas/proxies.

---

## 3. Principios según `.cursorrules`

1. **Capas:** `routers` (HTTP + validación entrada/salida) → `services` (reglas de negocio, import masivo) → `models` / DB. El frontend solo presenta estado y llama API; **no** duplicar reglas de “qué número es UE” más allá de parseo de presentación si el backend ya normaliza.
2. **Seguridad:** endpoints de escritura/import con **rol mínimo** acordado (p. ej. solo `admin`, o `admin` + `supervisor`). Validación de tipos, límites de payload, rate limit razonable en import masivo. Sin secretos en repo.
3. **Producción / Docker:** variables de entorno ya usadas; nuevas solo si hacen falta (p. ej. límites). Build de imagen y `docker compose` verificados al cerrar fase.
4. **Frontend:** estados de error/éxito visibles; **sin `alert()`** en errores de flujo (toasts o banners). Estilos con variables/tokens reutilizables (misma familia que pantallas actuales o CSS compartido).
5. **Documentación:** al implementar, actualizar este plan o un `docs/` operativo con contratos API y flujo de import.
6. **Backward compatibility:** mantener comportamiento si API falla: fallback documentado (p. ej. UE=1 o última caché con aviso), sin romper validación existente.

---

## 4. Diseño backend (mínimo necesario para soportar el frontend)

> El plan es “viable” con frontend rico; el backend no puede omitirse sin violar capas y seguridad.

### 4.1 Endpoints propuestos (borrador de contrato)

| Método | Ruta (prefijo `/api`) | Uso |
|--------|------------------------|-----|
| `GET` | `/productos/unidades-empaque` | Lista **paginada** + `q` (búsqueda por referencia). Respuesta: `{ items, total, page, page_size }`. |
| `GET` | `/productos/unidades-empaque/{referencia}` | Detalle una referencia (normalizada URL encoding). |
| `POST` | `/productos/unidades-empaque` | Alta manual (body: `referencia`, `unidad_empaque`, `texto_unidad_empaque` opcional). |
| `PATCH` | `/productos/unidades-empaque/{id}` o `/{referencia}` | Edición. |
| `POST` | `/productos/unidades-empaque/import` | `multipart/form-data` Excel o JSON generado en cliente; **upsert** por `referencia`. |
| `GET` | `/productos/unidades-empaque/export/plantilla` (opcional) | Plantilla vacía con columnas *Referencia* / *UE* para descarga. |

**Reglas de negocio (servicio):**

- `referencia`: trim, longitud acorde a columna BD (p. ej. ≤ 50), única.
- `unidad_empaque`: entero **≥ 1** (validar en backend).
- Import: transacción por lote (p. ej. 500–1000 filas por commit) para no bloquear SQLite/Postgres; respuesta con `{ ok, errores[] }` por fila inválida.
- Índice existente en `referencia` — mantener; evitar N+1 en listados.

### 4.2 Permisos

- **Lectura** del catálogo: roles que hoy usan validación (`operario` podría solo leer vía endpoint dedicado “compacto” para pistoleo, o reutilizar el mismo con rate limit).
- **Escritura / import:** `admin` (o `admin` + `supervisor` según decisión de negocio — documentar en ADR corto en `docs/`).

---

## 5. Frontend: módulo “Unidades de empaque” (enfoque rendimiento ~6 166+ filas)

**Riesgo:** pintar **6 166 filas** en el DOM destruye rendimiento y memoria.

### 5.1 Estrategia obligatoria: no lista infinita en DOM

| Opción | Viabilidad | Notas |
|--------|------------|--------|
| **Paginación server-side** + búsqueda `q` debounced | **Recomendada** | Backend devuelve 25–100 ítems; total count para UI. Alineado con `.cursorrules` (consultas eficientes). |
| Virtualización (ej. ventana de ~40 filas) | Opcional fase 2 | Útil si se exige scroll continuo sin paginación; más complejidad en el stack actual (vanilla JS). |
| Cargar JSON completo al navegador | **No recomendado** | 6k+ objetos + tabla = lag; solo aceptable para **import preview** por lotes, no para “listado maestro” permanente. |

### 5.2 Pantalla (piezas UI)

1. **Barra superior:** campo de búsqueda (debounce 250–400 ms), botón “Buscar”, indicador de carga y mensajes de error **no bloqueantes**.
2. **Tabla principal:** columnas Referencia | UE | Texto (opcional) | Acciones (editar). Solo filas de la **página actual**.
3. **Paginación:** anterior / siguiente o números; mostrar “Mostrando X–Y de Z”.
4. **Añadir referencia:** modal o panel con formulario; validación inline; `POST` y refresco de lista.
5. **Editar:** misma fila expandible o modal; `PATCH`.
6. **Importar Excel:**
   - Input file; parseo con **SheetJS** (ya en proyecto) **en el cliente** para validar encabezados.
   - Detección flexible: nombres de columna *Referencia* y *UE* (case-insensitive, trim), como en [Unidades_de_empaque.md](./Unidades_de_empaque.md).
   - Flujo recomendado: enviar al backend por **chunks** (p. ej. 500 filas) con barra de progreso y resumen de errores por lote — evita timeout y memoria única en una sola request.
7. **Navegación:** enlace en `nav.js` visible solo para roles con permiso (coherente con `usuarios.html` / admin).

### 5.3 Archivos y modularidad (evitar “script gigante”)

- Nuevo HTML (p. ej. `unidades_empaque.html`) + **módulo JS dedicado** (`js/unidades_empaque.js`) con funciones cortas: `loadPage`, `submitSearch`, `openImport`, `parseExcelHeaders`, `renderTable`, `handleApiError` (toast).
- Métodos en `api.js`: `getUnidadesEmpaque({ q, page, limit })`, `createProductoUe`, `updateProductoUe`, `importUnidadesEmpaqueChunked`.
- Reutilizar patrón de auth JWT existente (`localStorage` + headers).

### 5.4 Integración con validación (pistoleo “eficiente”)

1. **Al entrar** a flujo de validación (post-login o pre-carga Excel):  
   - Opción A: `GET` compacto `unidades-empaque/map` o paginado “full sync” solo si negocio lo exige (pesado).  
   - Opción B **recomendada:** mantener `masterData` como **mapa en memoria** cargado con:
     - `GET` paginado en bucle en background (solo admin operación rara), **o**
     - mejor: **endpoint `GET /productos/unidades-empaque/activas-json` con ETag / `updated_at` máximo** y caché en `sessionStorage`/`IndexedDB` para no bajar 6k filas en cada visita.
2. Al armar `orderData` en `startValidation`: resolver `ref` → `unidad_empaque` desde ese mapa; si no existe, **UE = 1** y **banner** “Referencia sin UE en catálogo” (no `alert`).
3. **Desincronización:** si el usuario editó UE en el nuevo módulo durante una validación abierta, la decisión de producto puede ser “aplica en el siguiente pedido” o recargar mapa al reanudar — documentar.

---

## 6. Import Excel (requisito 2 del doc)

- Plantilla: columnas **Referencia** y **UE** (como mínimo); filas desde la 2 en adelante.
- Validar en cliente: presencia de encabezados; en servidor: re-validar todo (no confiar en el cliente).
- Respuesta: resumen “X creadas/actualizadas, Y omitidas con error” con **detalle descargable CSV** opcional para operaciones grandes.

---

## 7. Fases de entrega (incremental, verificable)

| Fase | Entrega | Verificación (.cursorrules) |
|------|---------|-----------------------------|
| **F1** | Modelo ya existe; migración si se añaden campos (`updated_at`, `activo`). Router + servicio list + get + create + patch. Tests mínimos o `curl`/OpenAPI | Build Docker, sin secretos |
| **F2** | Import por chunks + permisos | Transacciones, límites, logs sin datos sensibles |
| **F3** | Página frontend listado + búsqueda + paginación + CRUD | Sin `alert()` en errores; accesibilidad básica |
| **F4** | Import UI + progreso | Manejo de red y timeouts |
| **F5** | Validación consume API (caché / sync) y deja de depender de Sheets para UE | Regresión pistoleo; doc actualizada |

---

## 8. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|------------|
| Timeout en import 6k filas | Chunks + transacciones por lote |
| Catálogo desactualizado en piso | `updated_at` + botón “Sincronizar catálogo” en vista validación |
| Referencias duplicadas en Excel | Upsert por `referencia`; reportar duplicados en mismo archivo |
| Operario sin permiso ve datos sensibles | Filtrar campos en DTO; solo lo necesario para pistoleo si aplica endpoint reducido |

---

## 9. Definición de hecho (por fase)

- Build y arranque en Docker OK.
- Contrato API documentado (este `docs/` o OpenAPI si ya existe).
- Listado con 6k+ registros en BD **no** degrada UI (paginación medida).
- Validación usa UE del catálogo backend con fallback explícito y mensaje en UI.
- Ningún flujo nuevo usa `alert()` para errores recuperables.

---

## 10. Decisiones pendientes (antes de codificar)

1. ¿Quién puede **editar/importar**? (solo `admin` vs `admin` + `supervisor`)
2. ¿Sincronización del mapa en validación: **al inicio de sesión**, **al cargar Excel**, o **manual**?
3. ¿Mantener Google Sheets como **respaldo** o **retirarlo** tras F5?

---

## Referencias en el repo

- Requisitos: [Unidades_de_empaque.md](./Unidades_de_empaque.md)
- Modelo: `backend/models.py` → `Producto`
- Validación multiplicador: `frontend/js/script_validacion.js` → `processScan`, `startValidation`, `app.masterData`
- Navegación roles: `frontend/js/nav.js`
