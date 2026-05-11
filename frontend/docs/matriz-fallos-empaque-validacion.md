# Matriz de fallos posibles: empaque y validación

**Uso:** checklist para hardening, pruebas y correcciones futuras. **No es un manual de usuario.**

---

## 1. Autenticación y sesión

| # | Escenario | Síntoma típico | Capa |
|---|-----------|----------------|------|
| 1.1 | Token JWT expirado durante flujo largo | 401 en API, datos no guardan | Frontend + API |
| 1.2 | Token corrupto / `localStorage` borrado | Redirección o errores genéricos | Frontend |
| 1.3 | Usuario desactivado (`activo=false`) con token viejo | 403 inconsistencias | Backend |
| 1.4 | Rol incorrecto para ruta (operario en dashboard admin) | 403 o salto de UI | Frontend `nav.js` + backend deps |

---

## 2. Red, CORS y disponibilidad

| # | Escenario | Síntoma | Notas |
|---|-----------|---------|-------|
| 2.1 | API caída o timeout | Toasts/console, borrador puede no sincronizar | Validar reintentos y mensaje claro |
| 2.2 | CORS mal configurado en prod | Navegador bloquea `fetch` | `.cursorrules`: sin `*` en prod |
| 2.3 | URL base API incorrecta (env distinto) | 404/network | Centralizar `api.js` |

---

## 3. Empaque — datos y lógica

| # | Escenario | Síntoma | Dónde revisar |
|---|-----------|---------|---------------|
| 3.1 | Referencia de producto inexistente o CSV/Sheets desactualizado | Etiquetas vacías, cantidades incorrectas | Sincronización hoja/Google, parsing |
| 3.2 | Estado de pedido incompatible con imprimir cerrar pedido | Error API o etiqueta ilegal | Router pedidos / reglas negocio |
| 3.3 | Cola `#finalPrintQueue` vacía o DOM no montado antes de `print()` | Hoja en blanco al imprimir | `script`/index flujo impresión |
| 3.4 | Duplicación de clic “imprimir” | etiquetas repetidas | Debounce / idempotencia UI |
| 3.5 | Sesión de usuario `app.user` nula tras cancelar alistamiento | Historial picker roto hasta re-login | `cancelPicking` vs flujo esperado |

---

## 4. Impresión física (Zebra y navegador)

| # | Escenario | Síntoma |
|---|-----------|---------|
| 4.1 | Driver/OS ignora `@page size` mm | Escalado o recorte; probar desde Chrome/Edge |
| 4.2 | Márgenes del navegador no en “mínimo” | Contenido cortado |
| 4.3 | Variación 203 dpi vs configuración de rollo | Ligeras diferencias de escala | Ajuste en plantilla o ZPL futuro |
| 4.4 | Impresión “background graphics” desactivada | Sin bordes/colores si se usan |

*(Detalle del modelo Zebra en `confirmacion-impresora-zebra-zt230.md`.)*

---

## 5. Validación — Excel y carga

| # | Escenario | Síntoma |
|---|-----------|---------|
| 5.1 | Archivo no es xlsx válido o columnas distintas | Parse error, tabla vacía |
| 5.2 | Pedido ya validado por otro / estado bloqueado | 409 o mensaje negocio |
| 5.3 | Número de pedido inconsistente con backend | No inicia validación |

---

## 6. Validación — escaneo y tabla

| # | Escenario | Síntoma |
|---|-----------|---------|
| 6.1 | Código duplicado o formato no esperado | Fila incorrecta/no match |
| 6.2 | Corrección UX: clic en elemento sin `data-correction-ref` | Sin acción |
| 6.3 | Supervisor PIN → nombre sin match en BD | Corrección no persiste | Alinear `SUPERVISORS`/seed/API |
| 6.4 | `id_alistador` no resuelto por nombre | Inconsistencia KPI alistamiento |

---

## 7. Borrador y concurrencia

| # | Escenario | Síntoma |
|---|-----------|---------|
| 7.1 | Payload borrador > límite backend | 413/400 | `validacion_borrador` servicio |
| 7.2 | Dos pestañas mismo usuario | última escritura gana (esperado con 1 borrador/usuario) |
| 7.3 | Borrador obsoleto tras cierre en otra sesión | UI “continuar” con datos viejos | TTL o revisión servidor |

---

## 8. Propiedad y permisos (validación)

| # | Escenario | Resultado esperado |
|---|-----------|---------------------|
| 8.1 | Usuario distinto intenta cerrar validación ajena | 403 |
| 8.2 | Supervisor corrige sin `id_supervisor` válido activo | 400/403 |
| 8.3 | Corrección con validación ya cerrada | Rechazo |

---

## 9. Alistamiento

| # | Escenario |
|---|-----------|
| 9.1 | Doble finalización mismo `alistamientoId` |
| 9.2 | Cancelar sin `alistamientoId` local pero existe en servidor |
| 9.3 | Horas `hora_fin` < `hora_inicio` (validación backend) |

---

## 10. Datos maestros y KPIs

| # | Escenario |
|---|-----------|
| 10.1 | Nombres normalizados (mayúsculas, tildes) distintos entre JS y BD |
| 10.2 | Reportes/dashboard asumen estados que cambiaron (p. ej. `CON_NOVEDADES` → pedido `EN_PROCESO`) |

---

## Priorización sugerida para correcciones

1. **Consistencia supervisores** (BD ↔ frontend ↔ PIN).  
2. **Impresión** (flujo DOM + prueba en hardware real).  
3. **Token expirado** (refresh o mensaje + re-login).  
4. **Borrador** (límite tamaño UX + manejo de error).

---

## Referencias en código (orientativas)

- API validación / borrador: `backend/routers/validacion.py`, `backend/services/validacion_borrador.py`, `validation_access.py`.
- API usuarios: `backend/routers/usuarios.py`.
- Frontend validación: `frontend/js/script_validacion.js`, `frontend/js/validacion_aux.js`, `frontend/js/api.js`.
- Impresión: `frontend/css/print-zebra-zt230.css`, páginas `index_estructura.html`, `validacion_estructura.html`.
