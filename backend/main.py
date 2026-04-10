from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import engine, Base
from routers import auth, usuarios, empaque, validacion, kpis, reportes
from scheduler import start_scheduler, stop_scheduler
import models  # noqa: F401 — registra todos los modelos en Base

Base.metadata.create_all(bind=engine)


@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()


app = FastAPI(
    title="BRAKEPAK API",
    description="Sistema de empaque y validación de pedidos - LOGIMAT",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Ajustar en producción con la IP del servidor
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(usuarios.router)
app.include_router(empaque.router)
app.include_router(validacion.router)
app.include_router(kpis.router)
app.include_router(reportes.router)


@app.get("/health")
def health():
    return {"status": "ok", "sistema": "BRAKEPAK"}
