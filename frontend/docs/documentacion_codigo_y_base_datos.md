# Documentación del Sistema BRAKEPAK - LOGIMAT

## Estructuración de Base de Datos MySQL/PostgreSQL

---

## 📋 Resumen del Sistema

El sistema BRAKEPAK de LOGIMAT consta de **dos módulos principales**:

1. **Sistema de Empaque** (`index_estructura.html` + `script_index.js`) - Genera etiquetas de empaque para cajas/estibas
2. **Sistema de Validación** (`validacion_estructura.html` + `script_validacion.js`) - Valida el alistamiento de pedidos

---

## 🗄️ Diagrama Entidad-Relación

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  DEPARTAMENTOS  │     │    CIUDADES     │     │    USUARIOS     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id_departamento │◄────│ id_departamento │     │ id_usuario      │
│ nombre          │     │ id_ciudad       │     │ cedula          │
└─────────────────┘     │ nombre          │     │ nombre          │
                        └────────┬────────┘     │ es_supervisor   │
                                 │              │ codigo_supervisor│
                                 ▼              └────────┬────────┘
┌─────────────────┐     ┌─────────────────┐              │
│    PRODUCTOS    │     │    CLIENTES     │              │
├─────────────────┤     ├─────────────────┤              │
│ id_producto     │     │ id_cliente      │              │
│ referencia      │     │ nombre          │              │
│ descripcion     │     │ direccion       │              │
│ unidad_empaque  │     │ id_ciudad       │◄─────────────┘
│ texto_unidad    │     │ telefono        │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  ITEMS_PEDIDO   │     │     PEDIDOS     │
├─────────────────┤     ├─────────────────┤
│ id_item         │     │ id_pedido       │
│ id_pedido       │◄────│ numero_pedido   │
│ id_producto     │     │ id_cliente      │
│ cantidad_solic  │     │ fecha_pedido    │
│ cantidad_valid  │     │ estado          │
│ estado          │     └────────┬────────┘
└─────────────────┘              │
                                 ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  ALISTAMIENTOS  │     │  VALIDACIONES   │     │  CORRECCIONES   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id_alistamiento │     │ id_validacion   │◄────│ id_validacion   │
│ id_pedido       │     │ id_pedido       │     │ id_supervisor   │
│ id_alistador    │     │ id_validador    │     │ referencia      │
│ hora_inicio     │     │ id_alistador    │     │ cantidad        │
│ hora_fin        │     │ hora_inicio     │     │ causa           │
│ estado          │     │ hora_fin        │     │ fecha_hora      │
└─────────────────┘     │ observaciones   │     └─────────────────┘
                        │ estado          │
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│    EMPAQUES     │     │ SECUENCIAS_DIA  │
├─────────────────┤     ├─────────────────┤
│ id_empaque      │     │ prefijo_fecha   │
│ codigo_empaque  │     │ ultimo_numero   │
│ tipo_empaque    │     └─────────────────┘
│ pedidos_asoc    │
│ cliente         │
│ direccion       │
│ ciudad/depto    │
│ fecha_hora      │
└─────────────────┘
```

---

## 📊 Scripts SQL para Crear las Tablas

### TABLA: DEPARTAMENTOS

```sql
-- Almacena los departamentos de Colombia
-- Datos fuente: CITIES_RAW_DATA en script_validacion.js
CREATE TABLE departamentos (
    id_departamento INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    INDEX idx_nombre (nombre)
);
```

### TABLA: CIUDADES

```sql
-- Almacena las ciudades con referencia a departamentos
-- Datos fuente: CITIES_RAW_DATA en script_validacion.js (~1100 ciudades)
CREATE TABLE ciudades (
    id_ciudad INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    id_departamento INT NOT NULL,
    FOREIGN KEY (id_departamento) REFERENCES departamentos(id_departamento),
    INDEX idx_nombre (nombre),
    UNIQUE KEY uk_ciudad_depto (nombre, id_departamento)
);
```

### TABLA: USUARIOS

```sql
-- Almacena empleados (alistadores, validadores, supervisores)
-- Datos fuente: localStorage['brakepak_employees'] / EMPLOYEES_DEFAULT
CREATE TABLE usuarios (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    cedula VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    es_supervisor BOOLEAN DEFAULT FALSE,
    codigo_supervisor VARCHAR(20),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    INDEX idx_cedula (cedula),
    INDEX idx_nombre (nombre)
);
```

### TABLA: CLIENTES

```sql
-- Almacena información de clientes/destinatarios
-- Datos fuente: Excel DATA_DIARIA (columnas: DESTINATARIO, DIRECCION, CIUDAD, TEL)
CREATE TABLE clientes (
    id_cliente INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(200) NOT NULL,
    direccion VARCHAR(500),
    id_ciudad INT,
    telefono VARCHAR(50),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_ciudad) REFERENCES ciudades(id_ciudad),
    INDEX idx_nombre (nombre)
);
```

### TABLA: PRODUCTOS

```sql
-- Almacena referencias y sus unidades de empaque
-- Datos fuente: Google Sheets (REFERENCIA, UNIDAD DE EMPAQUE)
CREATE TABLE productos (
    id_producto INT PRIMARY KEY AUTO_INCREMENT,
    referencia VARCHAR(50) NOT NULL UNIQUE,
    descripcion VARCHAR(300),
    unidad_empaque INT DEFAULT 1,         -- Multiplicador numérico
    texto_unidad_empaque VARCHAR(50),     -- Texto para mostrar (ej: "CAJA X 12")
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_referencia (referencia)
);
```

### TABLA: PEDIDOS

```sql
-- Almacena los pedidos principales
-- Datos fuente: Excel DATA_DIARIA (columna PEDIDO)
CREATE TABLE pedidos (
    id_pedido INT PRIMARY KEY AUTO_INCREMENT,
    numero_pedido VARCHAR(50) NOT NULL UNIQUE,
    id_cliente INT,
    fecha_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('PENDIENTE', 'EN_PROCESO', 'VALIDADO', 'DESPACHADO') DEFAULT 'PENDIENTE',
    FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
    INDEX idx_numero (numero_pedido),
    INDEX idx_fecha (fecha_pedido)
);
```

### TABLA: ITEMS_PEDIDO

```sql
-- Almacena los productos de cada pedido
-- Datos fuente: Excel DATA_DIARIA (REFERENCIA, DESCRIPCION, CANTIDAD)
CREATE TABLE items_pedido (
    id_item INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    id_producto INT,
    referencia VARCHAR(50) NOT NULL,           -- Respaldo si no existe en productos
    descripcion VARCHAR(300),
    cantidad_solicitada INT NOT NULL,
    cantidad_validada INT DEFAULT 0,
    estado ENUM('PENDIENTE', 'OK', 'FALTANTE', 'SOBRANTE', 'NO_SOLICITADO') DEFAULT 'PENDIENTE',
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES productos(id_producto),
    INDEX idx_pedido (id_pedido),
    INDEX idx_referencia (referencia)
);
```

### TABLA: ALISTAMIENTOS

```sql
-- Registra el proceso de alistamiento de pedidos
-- Datos fuente: localStorage['brakepak_picking_history']
CREATE TABLE alistamientos (
    id_alistamiento INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    id_alistador INT NOT NULL,
    hora_inicio DATETIME NOT NULL,
    hora_fin DATETIME,
    estado ENUM('EN_PROCESO', 'COMPLETADO', 'CANCELADO') DEFAULT 'EN_PROCESO',
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_alistador) REFERENCES usuarios(id_usuario),
    INDEX idx_pedido (id_pedido),
    INDEX idx_alistador (id_alistador),
    INDEX idx_fecha (hora_inicio)
);
```

### TABLA: VALIDACIONES

```sql
-- Registra cada proceso de validación de pedidos
-- Datos fuente: Proceso de validación en script_validacion.js
CREATE TABLE validaciones (
    id_validacion INT PRIMARY KEY AUTO_INCREMENT,
    id_pedido INT NOT NULL,
    id_validador INT NOT NULL,
    id_alistador INT,
    hora_inicio DATETIME NOT NULL,
    hora_fin DATETIME,
    total_unidades INT DEFAULT 0,
    estado ENUM('EN_PROCESO', 'OK', 'CON_NOVEDADES') DEFAULT 'EN_PROCESO',
    observaciones TEXT,
    cerrado_con_novedades BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (id_pedido) REFERENCES pedidos(id_pedido),
    FOREIGN KEY (id_validador) REFERENCES usuarios(id_usuario),
    FOREIGN KEY (id_alistador) REFERENCES usuarios(id_usuario),
    INDEX idx_pedido (id_pedido),
    INDEX idx_validador (id_validador),
    INDEX idx_fecha (hora_inicio)
);
```

### TABLA: CORRECCIONES

```sql
-- Registra las correcciones autorizadas por supervisores
-- Datos fuente: app.corrections[] en script_validacion.js
CREATE TABLE correcciones (
    id_correccion INT PRIMARY KEY AUTO_INCREMENT,
    id_validacion INT NOT NULL,
    id_supervisor INT,
    referencia_afectada VARCHAR(50),
    cantidad_corregida INT,
    causa ENUM(
        'PISTOLEO DE MAS',
        'TOMO EL QR MAS NO EL CODEBAR',
        'ALISTAMIENTO DE MAS',
        'ALISTAMIENTO DE MENOS',
        'ALISTAMIENTO DE REF NO SOLICITADA',
        'ERROR DE ETIQUETA ORIGINAL',
        'OTRO'
    ),
    descripcion_causa TEXT,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_validacion) REFERENCES validaciones(id_validacion) ON DELETE CASCADE,
    FOREIGN KEY (id_supervisor) REFERENCES usuarios(id_usuario),
    INDEX idx_validacion (id_validacion)
);
```

### TABLA: EMPAQUES

```sql
-- Registra las etiquetas de empaque generadas
-- Datos fuente: dailyLog[] / localStorage['bp_log_v22']
CREATE TABLE empaques (
    id_empaque INT PRIMARY KEY AUTO_INCREMENT,
    codigo_empaque VARCHAR(20) NOT NULL UNIQUE,    -- Formato: AAMMDD## (ej: 26012801)
    id_usuario INT,
    tipo_empaque ENUM('CAJA', 'ESTIBA') NOT NULL,
    numero_caja INT NOT NULL,                       -- Ej: 1 de 3
    total_cajas INT NOT NULL,                       -- Ej: 3
    cajas_internas INT,                             -- Solo para estibas
    pedidos_asociados TEXT,                         -- Lista de pedidos separados por coma
    cliente VARCHAR(200),
    direccion VARCHAR(500),
    ciudad VARCHAR(100),
    departamento VARCHAR(100),
    telefono VARCHAR(50),
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
    INDEX idx_codigo (codigo_empaque),
    INDEX idx_fecha (fecha_hora),
    INDEX idx_cliente (cliente)
);
```

### TABLA: SECUENCIAS_DIARIAS

```sql
-- Controla la secuencia de códigos de empaque por día
-- Datos fuente: localStorage['bp_seq_' + prefijo]
CREATE TABLE secuencias_diarias (
    id_secuencia INT PRIMARY KEY AUTO_INCREMENT,
    prefijo_fecha VARCHAR(6) NOT NULL UNIQUE,      -- Formato: AAMMDD
    ultimo_numero INT DEFAULT 0,
    INDEX idx_prefijo (prefijo_fecha)
);
```

---

## 📂 Mapeo de Datos: Variables JavaScript → Tablas BD

### Sistema de Empaque (`script_index.js`)

| Variable JS        | Tabla BD                     | Campo                     |
| ------------------ | ---------------------------- | ------------------------- |
| `session.client`   | `clientes` / `empaques`      | `nombre` / `cliente`      |
| `session.addr`     | `clientes` / `empaques`      | `direccion`               |
| `session.city`     | `ciudades` / `empaques`      | `nombre` / `ciudad`       |
| `session.depto`    | `departamentos` / `empaques` | `nombre` / `departamento` |
| `session.phone`    | `clientes` / `empaques`      | `telefono`                |
| `session.orders[]` | `empaques`                   | `pedidos_asociados`       |
| `dailyLog[]`       | `empaques`                   | Todos los campos          |
| `db[]`             | `pedidos` + `clientes`       | Datos temporales de Excel |

### Sistema de Validación (`script_validacion.js`)

| Variable JS                | Tabla BD                     | Campo                          |
| -------------------------- | ---------------------------- | ------------------------------ |
| `app.user`                 | `usuarios`                   | Usuario validador              |
| `app.picker`               | `usuarios` + `alistamientos` | Alistador del pedido           |
| `app.orderId`              | `pedidos`                    | `numero_pedido`                |
| `app.clientInfo.name`      | `clientes`                   | `nombre`                       |
| `app.clientInfo.address`   | `clientes`                   | `direccion`                    |
| `app.clientInfo.city`      | `ciudades`                   | `nombre`                       |
| `app.clientInfo.dept`      | `departamentos`              | `nombre`                       |
| `app.startTime`            | `validaciones`               | `hora_inicio`                  |
| `app.endTime`              | `validaciones`               | `hora_fin`                     |
| `app.masterData{}`         | `productos`                  | `referencia`, `unidad_empaque` |
| `app.orderData[]`          | `items_pedido`               | Items del pedido               |
| `app.corrections[]`        | `correcciones`               | Correcciones autorizadas       |
| `app.observations`         | `validaciones`               | `observaciones`                |
| `EMPLOYEES_DEFAULT[]`      | `usuarios`                   | Lista de empleados             |
| `SUPERVISORS{}`            | `usuarios`                   | Supervisores (con código)      |
| `brakepak_picking_history` | `alistamientos`              | Historial de picking           |

### Estructura de `app.orderData[]` → `items_pedido`

```javascript
{
    ref: "ABC123",           // → items_pedido.referencia
    desc: "Descripción",     // → items_pedido.descripcion
    unit: 12,                // → productos.unidad_empaque
    unitLabel: "CAJA X 12",  // → productos.texto_unidad_empaque
    expected: 24,            // → items_pedido.cantidad_solicitada
    scanned: 24,             // → items_pedido.cantidad_validada
    status: 'ok',            // → items_pedido.estado
    isExtra: false           // → estado = 'NO_SOLICITADO' si true
}
```

### Estructura de `dailyLog[]` → `empaques`

```javascript
{
    id: "26012801",              // → empaques.codigo_empaque
    fecha_hora: "28/01/2026...", // → empaques.fecha_hora
    pedido: "43140, 43141",      // → empaques.pedidos_asociados
    cliente: "NOMBRE CLIENTE",   // → empaques.cliente
    tipo_empaque: "CAJA",        // → empaques.tipo_empaque
    detalle_cajas: "1/3"         // → numero_caja / total_cajas
}
```

---

## 🔐 Datos Iniciales de Seguridad

### Supervisores

```sql
INSERT INTO usuarios (cedula, nombre, es_supervisor, codigo_supervisor) VALUES
('79714232', 'JUVENAL GALINDO', TRUE, '*197501'),
('1013678677', 'LAURA PELAEZ', TRUE, '*197502');
```

### PIN del Sistema

```sql
CREATE TABLE configuracion (
    clave VARCHAR(50) PRIMARY KEY,
    valor VARCHAR(200)
);
INSERT INTO configuracion VALUES ('PIN_ACCESO', '2025');
```

---

## 📝 Notas de Migración

### Datos a Migrar desde localStorage:

| localStorage Key           | Tabla Destino        |
| -------------------------- | -------------------- |
| `brakepak_employees`       | `usuarios`           |
| `brakepak_picking_history` | `alistamientos`      |
| `bp_log_v22`               | `empaques`           |
| `bp_seq_AAMMDD`            | `secuencias_diarias` |

### Datos Externos:

- **Google Sheets**: Sincronizar `productos` desde la hoja de cálculo
- **CITIES_RAW_DATA**: Cargar ~1100 ciudades en `ciudades` y `departamentos`
- **EMPLOYEES_DEFAULT**: Cargar 28 empleados iniciales en `usuarios`
