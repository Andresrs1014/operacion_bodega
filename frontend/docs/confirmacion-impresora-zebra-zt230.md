# Confirmación: impresora Zebra ZT-230 en el proyecto

**Modelo físico:** [Zebra ZT230](https://www.zebra.com/us/en/support-downloads/printer/desktop/zt230.html) — impresora de etiquetas térmica (direct thermal / thermal transfer según configuración), uso industrial/línea habitual en bodega.

**Lo que implementa el repo hoy:**

- Hoja **`frontend/css/print-zebra-zt230.css`**, enlazada desde `validacion_estructura.html` e `index_estructura.html` (empaque).
- **Tamaño lógico de página:** `4" × 6"` aproximado como **102 mm × 152 mm** (`@page` + variables CSS `--zebra-page-w` / `--zebra-page-h`).
- **Referencia DPI en comentario del CSS:** **203 dpi** — resolución estándar muy común en impresoras Zebra de escritorio; el ZT230 suele pedirse en 203 o 300 dpi según pedido; **si el equipo es 300 dpi**, el layout en mm sigue siendo válido; solo podría requerir ajuste fino de fuentes/bordes en prueba real.
- **Dos modos de impresión desde el navegador:**
  1. **Empaque:** `body` **sin** clase `print-validation-active` → solo visible `#finalPrintQueue` y `.print-page` / `.label-container`.
  2. **Validación (constancia):** antes de `window.print()` se añade `print-validation-active` al `body` → solo `#print-area` y su contenido (p. ej. `.label-card`).

**Qué no hace el código:**

- No genera **ZPL** ni envía por USB/Ethernet directo desde el backend; el flujo es **imprimir desde el navegador** hacia el driver de Windows que controla la Zebra. Eso implica que el **driver y el tamaño de etiqueta** configurados en Windows deben coincidir o ser compatibles con 4×6 (o el tamaño real del rollo).

**Riesgos conocidos (no son bugs del repo solos):**

- El navegador puede aplicar márgenes propios; conviene “márgenes mínimos” y una prueba física.
- Si el driver escala a “ajustar al área imprimible”, puede distorsionar; revisar preferencias de la impresora ZT-230.

**Conclusión:** Sí, el diseño actual está **orientado explícitamente a etiqueta tipo 4×6"** compatible con uso típico de **Zebra ZT-230**. La confirmación definitiva siempre es **una impresión de prueba** en el equipo y rollo que usan en planta.

Ver también: `docs/validacion-borrador-y-zebra-zt230.md` en la raíz del repositorio (resumen funcional borrador + Zebra).
