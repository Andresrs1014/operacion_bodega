# BRAKEPAK — Sistema de Bodega LOGIMAT

Sistema de empaque, validación de pedidos y control de KPIs para auxiliares de bodega.

---

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML + CSS + JavaScript vanilla |
| Backend | Python 3.12 · FastAPI · SQLAlchemy |
| Base de datos | PostgreSQL 16 |
| Servidor web | Nginx (proxy + archivos estáticos) |
| Contenedores | Docker + Docker Compose |
| Auth | JWT (8 horas) · bcrypt |
| Reportes | Gmail SMTP · APScheduler |

---

## Estructura del proyecto

```
operacion_bodega/
├── backend/
│   ├── main.py               # FastAPI app + lifespan
│   ├── config.py             # Settings desde .env
│   ├── database.py           # SQLAlchemy engine + session
│   ├── models.py             # Todas las tablas
│   ├── schemas.py            # Pydantic request/response
│   ├── auth.py               # bcrypt + JWT
│   ├── dependencies.py       # Guards por rol
│   ├── email_service.py      # Builder HTML + envío SMTP
│   ├── scheduler.py          # APScheduler quincenal/mensual
│   ├── seed.py               # Datos iniciales (admin + supervisores)
│   ├── simulate.py           # Generador de datos de prueba
│   ├── requirements.txt
│   ├── Dockerfile
│   └── routers/
│       ├── auth.py           # POST /auth/login · GET /auth/me
│       ├── usuarios.py       # CRUD usuarios
│       ├── empaque.py        # Empaques + secuencias
│       ├── validacion.py     # Validaciones + alistamientos
│       ├── kpis.py           # Dashboard KPIs
│       └── reportes.py       # Envío manual de reportes
├── frontend/
│   ├── login.html            # Pantalla de acceso (cédula + contraseña)
│   ├── menu.html             # Selección de módulo (operarios)
│   ├── dashboard.html        # Panel KPIs (supervisores + admin)
│   ├── index_estructura.html # Módulo de empaque
│   ├── validacion_estructura.html # Módulo de validación
│   ├── js/
│   │   ├── api.js            # Cliente HTTP + manejo JWT
│   │   ├── script_index.js   # Lógica empaque
│   │   └── script_validacion.js # Lógica validación
│   ├── css/
│   ├── nginx.conf
│   └── Dockerfile
├── nginx/
│   └── nginx.conf
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Roles y permisos

| Rol | Acceso |
|-----|--------|
| `admin` | Todo. Crear/editar/desactivar usuarios |
| `supervisor` | Dashboard KPIs, ver usuarios, enviar reportes |
| `operario` | Módulo empaque + módulo validación |

---

## Módulos

### Empaque (`/index_estructura.html`)
- Carga Excel con pedidos del día
- Escaneo de pedidos por número
- Generación de etiquetas con código de barras (CODE128)
- Soporte cajas y estibas
- Secuencia diaria sincronizada con backend (sin colisiones)

### Validación (`/validacion_estructura.html`)
- Alistamiento y validación de referencias por pedido
- Escaneo de códigos de barras
- Correcciones autorizadas por supervisor
- Sincronización de datos maestros desde Google Sheets
- Registro de tiempos por pedido

### Dashboard (`/dashboard.html`)
- KPIs en tiempo real (día / semana / mes)
- Ranking de auxiliares con score compuesto
- Monitor de actividad en vivo (actualiza cada 30s)
- Gráfica de actividad por hora del día
- Gráfica de exactitud por auxiliar

---

## Despliegue en Ubuntu Server

### 1. Requisitos previos

```bash
# Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Clonar y configurar

```bash
git clone <repo-url> operacion_bodega
cd operacion_bodega

cp .env.example .env
nano .env   # Completar POSTGRES_PASSWORD, SECRET_KEY, SMTP_PASSWORD
```

### 3. Levantar todo

```bash
docker compose up -d --build
```

### 4. Seed inicial (primera vez)

```bash
docker compose exec backend python seed.py
```

### 5. Verificar

```bash
docker compose ps
curl http://localhost/api/health
```

Abrir en el navegador: `http://IP_DEL_SERVIDOR`

---

## Desarrollo local

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate        # Linux/Mac
# .venv\Scripts\activate         # Windows
pip install -r requirements.txt

cp .env.example .env             # Completar variables
python seed.py                   # Crear tablas + usuarios iniciales
uvicorn main:app --reload

# Frontend
# Abrir los HTML directamente o usar Live Server en VSCode
# Cambiar en js/api.js: API_BASE = "http://localhost:8000"
```

---

## Datos de prueba

```bash
# Genera 30 días de validaciones con 8 auxiliares demo
docker compose exec backend python simulate.py

# Personalizado
docker compose exec backend python simulate.py --dias 60 --pedidos-por-dia 40
```

Contraseña de auxiliares demo: `demo123`

---

## Reportes automáticos por correo

| Tipo | Cuándo | Hora |
|------|--------|------|
| Quincenal | Día 15 y último día del mes | 18:00 (Bogotá) |
| Mensual | Último día del mes | 19:00 (Bogotá) |

**Destinatarios configurados en `.env`:**
- coordinador.operaciones2@logimat.com.co
- coordinador.operacionesb2@logimat.com.co

**Disparo manual desde el dashboard** o via API:
```
POST /api/reportes/enviar/quincenal
POST /api/reportes/enviar/mensual
```

**Configurar Gmail:**
1. Ir a myaccount.google.com → Seguridad → Contraseñas de aplicaciones
2. Crear una contraseña para "BRAKEPAK"
3. Pegar el código en `SMTP_PASSWORD` del `.env`

---

## API — Endpoints principales

```
POST   /api/auth/login                      Login (cédula + contraseña)
GET    /api/auth/me                         Usuario actual

GET    /api/usuarios/                       Lista usuarios (supervisor+)
POST   /api/usuarios/                       Crear usuario (admin)
PATCH  /api/usuarios/{id}                   Editar usuario (admin)
DELETE /api/usuarios/{id}                   Desactivar usuario (admin)

GET    /api/empaque/secuencia               Siguiente código del día
POST   /api/empaque/                        Registrar empaques
GET    /api/empaque/turno                   Empaques del turno actual

GET    /api/validacion/empleados            Lista operarios
POST   /api/validacion/alistamiento         Iniciar alistamiento
PATCH  /api/validacion/alistamiento/{id}/cerrar
POST   /api/validacion/                     Iniciar validación
PATCH  /api/validacion/{id}/cerrar
POST   /api/validacion/{id}/correccion

GET    /api/kpis/resumen?periodo=dia        Resumen general
GET    /api/kpis/ranking?periodo=semana     Ranking auxiliares
GET    /api/kpis/auxiliar/{id}             Detalle auxiliar
GET    /api/kpis/activos                   En proceso ahora
GET    /api/kpis/tendencia-hoy             Actividad por hora

POST   /api/reportes/enviar/{tipo}         Enviar reporte manual
```

Documentación interactiva: `http://IP_SERVIDOR/api/docs`

---

## Comandos útiles

```bash
# Ver logs del backend
docker compose logs -f backend

# Reiniciar solo el backend
docker compose restart backend

# Acceder a la BD
docker compose exec db psql -U brakepak -d brakepak

# Backup de la BD
docker compose exec db pg_dump -U brakepak brakepak > backup_$(date +%Y%m%d).sql

# Restaurar backup
cat backup_20260101.sql | docker compose exec -T db psql -U brakepak -d brakepak
```

---

## Pendiente (Roadmap)

- [ ] Panel de administración de usuarios (frontend HTML)
- [ ] Exportar reportes en PDF desde el dashboard
- [ ] Integración SAP via SAProuter + PyRFC
- [ ] PWA / manifest.json para instalación en móvil
- [ ] Historial de reportes enviados
- [ ] Tabla de causas de corrección más frecuentes en dashboard
