# Documentación de Funciones del Sistema BRAKEPAK

## Comentarios del Código y Flujos de Datos

---

## 📁 Archivos del Proyecto

| Archivo                      | Descripción                  | Líneas |
| ---------------------------- | ---------------------------- | ------ |
| `index_estructura.html`      | UI del Sistema de Empaque    | 142    |
| `validacion_estructura.html` | UI del Sistema de Validación | 285    |
| `js/script_index.js`         | Lógica de empaque            | 553    |
| `js/script_validacion.js`    | Lógica de validación         | 2001   |
| `css/style_index.css`        | Estilos de empaque           | 209    |
| `css/style_validacion.css`   | Estilos de validación        | 133    |

---

## 🔧 SCRIPT_INDEX.JS - Sistema de Empaque

### Constantes y Variables Globales

```javascript
// PIN de acceso para proteger el sistema
const ACCESS_PIN = "2025";

// Base de datos en memoria de pedidos cargados desde Excel
let db = [];

// Objeto de sesión que almacena información del cliente actual
let session = {
  client: null, // Nombre del cliente
  addr: null, // Dirección de entrega
  city: null, // Ciudad
  depto: null, // Departamento
  phone: null, // Teléfono de contacto
  orders: [], // Array de IDs de pedidos asociados
};

// Registro histórico del día almacenado en localStorage
let dailyLog = JSON.parse(localStorage.getItem("bp_log_v22") || "[]");

// GEO_DB: Mapeo de ciudades a departamentos
const GEO_DB = {
  /* ~40 ciudades principales */
};
```

### Funciones Principales

#### `checkPin()`

```
Propósito: Valida el PIN de acceso ingresado
Flujo de datos: input#pinInput → ACCESS_PIN → Mostrar/Ocultar loginOverlay
Base de datos: Podría usar tabla 'configuracion' para almacenar el PIN
```

#### `handleFile(input)`

```
Propósito: Procesa el archivo Excel cargado por el usuario
Flujo de datos:
  1. Archivo Excel → FileReader → ArrayBuffer
  2. ArrayBuffer → XLSX.read() → Workbook
  3. Workbook → sheet_to_json() → Array de datos
  4. Array → loadDB() → Variable db[]

Estructura del Excel esperada:
  - Columna B (índice 1): Número de Pedido
  - Columna C (índice 2): Cliente/Destinatario
  - Columna D (índice 3): Dirección
  - Columna E (índice 4): Ciudad
  - Columna G (índice 6): Departamento (opcional)
  - Columna J (índice 9): Teléfono
```

#### `loadDB(json, alertUser)`

```
Propósito: Carga los datos del Excel en memoria
Flujo de datos:
  1. Array de filas → Filtrar encabezados
  2. Por cada fila válida → Extraer campos
  3. Crear objeto {id, client, addr, city, depto, tel}
  4. Push a db[]

Mapeo a BD:
  - row[1] → pedidos.numero_pedido
  - row[2] → clientes.nombre
  - row[3] → clientes.direccion
  - row[4] → ciudades.nombre
  - row[6] o GEO_DB → departamentos.nombre
  - row[9] → clientes.telefono
```

#### `scanOrder(code)`

```
Propósito: Procesa el código de pedido escaneado
Validaciones:
  1. ¿Existe en db[]?
  2. ¿Mismo cliente que pedidos anteriores?
  3. ¿No es duplicado?

Flujo de datos:
  - Si primer pedido: Inicializa session con datos del cliente
  - Agrega pedido a session.orders[]
  - Actualiza UI con renderList() y updateUI()

Mapeo a BD:
  - db[].client → clientes.nombre
  - db[].addr → clientes.direccion
  - db[].city → ciudades.nombre
  - session.orders → empaques.pedidos_asociados
```

#### `updatePackMode()`

```
Propósito: Cambia entre modo CAJA y ESTIBA
Flujo de datos:
  - input[name="packType"] → tipo de empaque
  - Si ESTIBA: Genera inputs dinámicos por cada estiba
  - Actualiza labels y preview

Mapeo a BD:
  - tipo → empaques.tipo_empaque ('CAJA' o 'ESTIBA')
```

#### `getNextID()`

```
Propósito: Genera el siguiente ID de empaque
Formato: AAMMDD## (ej: 26020101)
Almacenamiento: localStorage['bp_seq_' + prefijo]

Mapeo a BD:
  - prefijo → secuencias_diarias.prefijo_fecha
  - seq → secuencias_diarias.ultimo_numero
  - ID completo → empaques.codigo_empaque
```

#### `printLabels()`

```
Propósito: Genera e imprime etiquetas de empaque
Flujo de datos:
  1. Por cada caja/estiba:
     - Genera ID único
     - Crea HTML de etiqueta
     - Genera código de barras (JsBarcode)
     - Registra en dailyLog[]
  2. Guarda secuencia en localStorage
  3. Guarda log en localStorage
  4. Ejecuta window.print()
  5. Limpia sesión

Mapeo a BD:
  - Cada entrada de dailyLog → INSERT en empaques
```

#### `downloadDailyLog()`

```
Propósito: Exporta el registro diario como CSV
Formato CSV:
  - NUMERO EMPAQUE → codigo_empaque
  - FECHA Y HORA → fecha_hora
  - PEDIDO → pedidos_asociados
  - CLIENTE → cliente
  - TIPO → tipo_empaque
  - DETALLE → numero_caja/total_cajas
```

---

## 🔧 SCRIPT_VALIDACION.JS - Sistema de Validación

### Constantes y Variables Globales

```javascript
// PIN de acceso al sistema
const PIN_CODE = "2025";

// Supervisores autorizados: código => nombre
const SUPERVISORS = {
  "*197501": "JUVENAL GALINDO",
  "*197502": "LAURA PELAEZ",
};

// Email para reportes
const REPORT_EMAIL = "laura.pelaez@logimat.com.co";

// URL de Google Sheets con datos maestros de productos
const GOOGLE_SHEET_URL = "https://docs.google.com/spreadsheets/...";

// CITIES_RAW_DATA: ~1100 ciudades de Colombia (texto tabulado)
// Formato: "CIUDAD\tDEPARTAMENTO\n..."

// EMPLOYEES_DEFAULT: Lista de 28 empleados
// Formato: [{name, id}, ...]

// app: Objeto principal del estado de la aplicación
let app = {
  role: null, // 'picking' o 'validator'
  user: null, // Usuario actual {name, id}
  picker: null, // Nombre del alistador
  pickingTime: null, // Tiempo de alistamiento
  orderId: null, // Número del pedido
  clientInfo: {
    // Información del cliente
    name: "",
    address: "",
    city: "",
    dept: "",
  },
  startTime: null, // Inicio de validación
  endTime: null, // Fin de validación
  masterData: {}, // Referencias y unidades de empaque
  cityDeptMap: {}, // Mapa ciudad → departamento
  orderData: [], // Items del pedido
  fullExcel: null, // Datos del Excel cargado
  corrections: [], // Historial de correcciones
  pendingDeleteRef: null, // Referencia pendiente de corrección
  observations: "", // Observaciones del validador
  supervisorMode: null, // 'correction' o 'closure'
  supervisorAuthorized: false, // Sesión de supervisor activa
};
```

### Funciones de Inicialización

#### `initEvents()`

```
Propósito: Configura event listeners
Eventos:
  - Enter en scan-input → processScan()
  - Click en documento → Focus en scan-input
```

#### `initCityDeptData()`

```
Propósito: Parsea CITIES_RAW_DATA y crea cityDeptMap
Flujo: Texto tabulado → Split líneas → Split tabs → Mapa

Mapeo a BD:
  - Cada línea → INSERT en ciudades y departamentos
```

### Funciones de Autenticación

#### `selectRole(role)`

```
Propósito: Selecciona rol de usuario
Roles: 'picking' (alistamiento) o 'validator' (validación)
```

#### `attemptLogin()`

```
Propósito: Autentica al usuario validador
Flujo:
  1. Obtener cédula del input
  2. Buscar en localStorage['brakepak_employees']
  3. Si existe → setear app.user y mostrar dashboard

Mapeo a BD:
  - Buscar en usuarios WHERE cedula = input
```

### Funciones de Carga de Datos

#### `fetchMasterData()`

```
Propósito: Sincroniza datos maestros desde Google Sheets
Flujo:
  1. Intentar conexión con proxy 1 (allorigins.win)
  2. Si falla, intentar proxy 2 (corsproxy.io)
  3. Parsear CSV con PapaParse
  4. Extraer REFERENCIA y UNIDAD DE EMPAQUE
  5. Guardar en app.masterData{}

Estructura de masterData:
  {
    "REF001": { unit: 12, unitLabel: "CAJA X 12" },
    "REF002": { unit: 1, unitLabel: "1" }
  }

Mapeo a BD:
  - Cada entrada → productos.referencia, unidad_empaque, texto_unidad_empaque
```

#### `handleExcelUpload(input)`

```
Propósito: Carga el Excel de pedidos del día
Flujo:
  1. Leer archivo como binario
  2. Buscar hoja "DATA_DIARIA"
  3. Convertir a JSON
  4. Guardar en app.fullExcel

Estructura del Excel:
  - PEDIDO: Número de pedido
  - REFERENCIA/MATERIAL: Código del producto
  - DESCRIPCION: Descripción del producto
  - CANTIDAD: Cantidad solicitada
  - DESTINATARIO: Nombre del cliente
  - DIRECCION: Dirección de entrega
  - CIUDAD/MUNICIPIO: Ciudad
```

### Funciones de Validación

#### `startValidation(orderId)`

```
Propósito: Inicia la validación de un pedido
Flujo:
  1. Filtrar filas del Excel por orderId
  2. Extraer info del cliente (nombre, dirección, ciudad, departamento)
  3. Crear app.orderData[] con items a validar
  4. Por cada item: buscar unidad de empaque en masterData

Estructura de orderData[]:
  {
    ref: "ABC123",           // Referencia
    desc: "Descripción",     // Descripción
    unit: 12,                // Unidad de empaque (multiplicador)
    unitLabel: "CAJA X 12",  // Texto a mostrar
    expected: 24,            // Cantidad solicitada
    scanned: 0,              // Cantidad escaneada
    status: 'pending'        // Estado
  }

Mapeo a BD:
  - Cada item → INSERT en items_pedido
  - Info cliente → SELECT o INSERT en clientes
  - Validación → INSERT en validaciones
```

#### `processScan(code)`

```
Propósito: Procesa cada código escaneado
Flujo:
  1. Buscar referencia en orderData[]
  2. Si existe:
     - Incrementar scanned por unit (unidad de empaque)
     - Sonido OK (600Hz) o advertencia (200Hz si sobrepasa)
  3. Si no existe:
     - Agregar como item extra con isExtra=true
     - Sonido ERROR (100Hz)
  4. Actualizar tabla

Mapeo a BD:
  - UPDATE items_pedido SET cantidad_validada = scanned
  - Si isExtra → estado = 'NO_SOLICITADO'
```

#### `renderTable()`

```
Propósito: Renderiza la tabla de validación
Cálculos:
  - missing: items con scanned < expected
  - errors: items con scanned > expected o isExtra
  - progress: (totalScanned / totalExpected) * 100

Estados visuales:
  - Verde: scanned == expected (OK)
  - Amarillo: scanned > expected (SOBRANTE)
  - Rojo: isExtra (NO PEDIDO)
  - Gris: scanned < expected (FALTANTE)
```

#### `tryFinishValidation()`

```
Propósito: Intenta finalizar la validación
Flujo:
  - Si hay errores → Requiere autorización de supervisor
  - Si no hay errores → finishValidation(false)
```

#### `finishValidation(hasNews)`

```
Propósito: Finaliza la validación y genera constancia
Flujo:
  1. Registrar hora de fin
  2. Generar HTML de etiqueta con generateLabelHTML()
  3. Mostrar vista de etiqueta para imprimir

Datos de la constancia:
  - Número de pedido
  - Cliente
  - Alistador y validador
  - Tiempos de inicio y fin
  - Total de unidades
  - Estado (OK o CON NOVEDADES)
  - Observaciones
  - Historial de correcciones

Mapeo a BD:
  - UPDATE validaciones SET hora_fin, total_unidades, estado, observaciones
```

### Funciones de Supervisor

#### `openSupervisor(mode, ref)`

```
Propósito: Abre modal de autorización de supervisor
Modos:
  - 'correction': Para corregir un item específico
  - 'closure': Para cerrar con novedades

Single Sign-On:
  - Si supervisorAuthorized == true, no pide código otra vez
```

#### `checkSupervisorCode()`

```
Propósito: Valida el código de supervisor
Flujo:
  1. Verificar que se seleccionó una causa
  2. Si ya está autorizado → processSupervisorAction()
  3. Si no, validar código en SUPERVISORS{}
  4. Si válido → activar sesión y processSupervisorAction()

Mapeo a BD:
  - SELECT FROM usuarios WHERE codigo_supervisor = input
```

#### `processSupervisorAction(reason, supervisorName)`

```
Propósito: Ejecuta la acción autorizada
Acciones:
  - correction: Reduce scanned del item y registra corrección
  - closure: Registra cierre forzado y finaliza validación

Mapeo a BD:
  - INSERT en correcciones (referencia, cantidad, causa, supervisor)
```

### Funciones de Alistamiento

#### `startPickingTimer()`

```
Propósito: Inicia el temporizador de alistamiento
Datos registrados:
  - ID del alistador
  - Número de pedido
  - Hora de inicio
```

#### `endPickingTimer()`

```
Propósito: Finaliza el alistamiento y guarda en historial
Flujo:
  1. Crear registro con order, picker, start, end
  2. Push a brakepak_picking_history (localStorage)

Mapeo a BD:
  - INSERT en alistamientos (id_pedido, id_alistador, hora_inicio, hora_fin)
```

### Funciones Auxiliares

#### `playTone(f, t)`

```
Propósito: Genera sonido de feedback
Parámetros:
  - f: Frecuencia en Hz
  - t: Tipo de onda ('sine', 'sawtooth', 'square')
```

#### `sendReportEmail(service)`

```
Propósito: Envía reporte de validación por email
Servicios:
  - 'gmail': Abre Gmail web
  - otros: Usa cliente de correo local (mailto:)

Contenido del email:
  - Datos del pedido y cliente
  - Alistador y validador
  - Tiempos y estado
  - Observaciones y correcciones
```

---

## 🔄 Flujos de Datos Principales

### Flujo 1: Generación de Etiquetas de Empaque

```
1. Usuario carga Excel de pedidos
   └── handleFile() → loadDB() → db[]

2. Usuario escanea códigos de pedido
   └── scanOrder() → session.orders[]

3. Usuario configura tipo de empaque
   └── updatePackMode() → tipo CAJA/ESTIBA

4. Usuario imprime etiquetas
   └── printLabels():
       ├── Genera código AAMMDD##
       ├── Crea HTML con JsBarcode
       ├── Registra en dailyLog[]
       └── window.print()

5. Usuario descarga reporte (opcional)
   └── downloadDailyLog() → CSV
```

### Flujo 2: Proceso de Validación

```
1. Validador se autentica
   └── attemptLogin() → app.user

2. Sistema sincroniza datos maestros
   └── fetchMasterData() → app.masterData{}

3. Validador carga Excel del día
   └── handleExcelUpload() → app.fullExcel

4. Validador ingresa número de pedido
   └── checkPickerAndStart() → Busca alistador

5. Sistema prepara datos del pedido
   └── startValidation():
       ├── Extrae info cliente
       └── Crea orderData[]

6. Validador escanea referencias
   └── processScan():
       ├── Incrementa scanned (× unidad empaque)
       └── renderTable()

7. Validador finaliza
   └── tryFinishValidation():
       ├── Si OK → finishValidation(false)
       └── Si errores → openSupervisor()

8. Genera constancia imprimible
   └── generateLabelHTML()

9. Envía reporte (opcional)
   └── sendReportEmail()
```

---

## 📊 Resumen de localStorage

| Key                        | Descripción                | Migrar a             |
| -------------------------- | -------------------------- | -------------------- |
| `brakepak_employees`       | Lista de empleados         | `usuarios`           |
| `brakepak_picking_history` | Historial de alistamientos | `alistamientos`      |
| `bp_log_v22`               | Log de etiquetas del día   | `empaques`           |
| `bp_seq_AAMMDD`            | Secuencia del día          | `secuencias_diarias` |
