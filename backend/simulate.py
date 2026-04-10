"""
Script de simulación de datos para pruebas del dashboard.
Genera validaciones, alistamientos y empaques realistas de los últimos 30 días.

Uso:
    python simulate.py
    python simulate.py --dias 60 --pedidos-por-dia 40
"""
import argparse
import random
from datetime import datetime, timedelta, date

from database import SessionLocal, engine, Base
import models  # noqa
from models import Alistamiento, Empaque, Pedido, SecuenciaDiaria, Usuario, Validacion, Cliente, Ciudad, Departamento
from auth import hash_password

# ──────────────────────────────────────────────────────────────────────────────
# Datos de prueba
# ──────────────────────────────────────────────────────────────────────────────

AUXILIARES_DEMO = [
    {"cedula": "10001001", "nombre": "CARLOS RODRIGUEZ",    "password": "demo123"},
    {"cedula": "10001002", "nombre": "JUAN MARTINEZ",       "password": "demo123"},
    {"cedula": "10001003", "nombre": "MARIA TORRES",        "password": "demo123"},
    {"cedula": "10001004", "nombre": "PEDRO GARCIA",        "password": "demo123"},
    {"cedula": "10001005", "nombre": "ANDREA LOPEZ",        "password": "demo123"},
    {"cedula": "10001006", "nombre": "LUIS HERNANDEZ",      "password": "demo123"},
    {"cedula": "10001007", "nombre": "SOFIA RAMIREZ",       "password": "demo123"},
    {"cedula": "10001008", "nombre": "CAMILO VARGAS",       "password": "demo123"},
]

CLIENTES_DEMO = [
    ("FARMATODO S.A.", "CRA 15 #85-32", "BOGOTÁ D.C.", "BOGOTÁ D.C."),
    ("SUPERTIENDAS OLÍMPICA", "CLL 72 #45-10", "MEDELLÍN", "ANTIOQUIA"),
    ("DROGAS LA REBAJA", "AV 6N #23-45", "CALI", "VALLE DEL CAUCA"),
    ("ÉXITO BARRANQUILLA", "CRA 54 #68-15", "BARRANQUILLA", "ATLÁNTICO"),
    ("MAKRO CARTAGENA", "ZI MAMONAL BQ 5", "CARTAGENA", "BOLIVAR"),
    ("CENCOSUD COLOMBIA", "CLL 170 #68-35", "BOGOTÁ D.C.", "BOGOTÁ D.C."),
    ("ALKOSTO TUNJA", "AV ORIENTAL #25-12", "TUNJA", "BOYACÁ"),
    ("COMERCIAL NUTRESA", "CRA 44 #1-70 SUR", "MEDELLÍN", "ANTIOQUIA"),
]

CAUSAS_CORRECCION = [
    "PISTOLEO DE MAS",
    "ALISTAMIENTO DE MENOS",
    "ALISTAMIENTO DE MAS",
    "TOMO EL QR MAS NO EL CODEBAR",
]

# Perfiles de desempeño por auxiliar (afectan sus métricas simuladas)
PERFILES = {
    0: {"min_min": 4,  "max_min": 9,  "tasa_ok": 0.97},  # Estrella
    1: {"min_min": 5,  "max_min": 12, "tasa_ok": 0.93},
    2: {"min_min": 6,  "max_min": 15, "tasa_ok": 0.90},
    3: {"min_min": 8,  "max_min": 18, "tasa_ok": 0.85},
    4: {"min_min": 7,  "max_min": 14, "tasa_ok": 0.88},
    5: {"min_min": 10, "max_min": 22, "tasa_ok": 0.82},
    6: {"min_min": 5,  "max_min": 11, "tasa_ok": 0.95},
    7: {"min_min": 12, "max_min": 28, "tasa_ok": 0.75},  # Más lento
}

HORA_INICIO_TURNO = 6   # 6am
HORA_FIN_TURNO    = 17  # 5pm


def rand_time_in_day(d: date, hora_base: int = None) -> datetime:
    hora = hora_base if hora_base else random.randint(HORA_INICIO_TURNO, HORA_FIN_TURNO - 1)
    minuto = random.randint(0, 59)
    segundo = random.randint(0, 59)
    return datetime(d.year, d.month, d.day, hora, minuto, segundo)


def simulate(dias: int = 30, pedidos_por_dia: int = 25):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        print(f"\n{'='*60}")
        print(f"  SIMULACIÓN: {dias} días · ~{pedidos_por_dia} pedidos/día")
        print(f"{'='*60}\n")

        # ── 1. Crear auxiliares demo ───────────────────────────────────────────
        auxiliares = []
        for data in AUXILIARES_DEMO:
            u = db.query(Usuario).filter(Usuario.cedula == data["cedula"]).first()
            if not u:
                u = Usuario(
                    cedula=data["cedula"],
                    nombre=data["nombre"],
                    password_hash=hash_password(data["password"]),
                    rol="operario",
                )
                db.add(u)
                db.flush()
                print(f"  ✓ Auxiliar creado: {data['nombre']}")
            auxiliares.append(u)
        db.commit()

        # ── 2. Crear depto/ciudad/clientes demo ───────────────────────────────
        clientes_obj = []
        for nombre, dir_, ciudad_n, depto_n in CLIENTES_DEMO:
            depto = db.query(Departamento).filter(Departamento.nombre == depto_n).first()
            if not depto:
                depto = Departamento(nombre=depto_n)
                db.add(depto)
                db.flush()

            ciudad = db.query(Ciudad).filter(Ciudad.nombre == ciudad_n).first()
            if not ciudad:
                ciudad = Ciudad(nombre=ciudad_n, id_departamento=depto.id)
                db.add(ciudad)
                db.flush()

            cl = db.query(Cliente).filter(Cliente.nombre == nombre).first()
            if not cl:
                cl = Cliente(nombre=nombre, direccion=dir_, id_ciudad=ciudad.id)
                db.add(cl)
                db.flush()
            clientes_obj.append(cl)
        db.commit()

        # ── 3. Generar validaciones día a día ─────────────────────────────────
        hoy = date.today()
        total_val = 0
        seq_global = 1

        for offset in range(dias, 0, -1):
            dia = hoy - timedelta(days=offset)
            # Saltar fines de semana
            if dia.weekday() >= 5:
                continue

            n_pedidos = random.randint(
                int(pedidos_por_dia * 0.7),
                int(pedidos_por_dia * 1.3)
            )

            hora_cursor = HORA_INICIO_TURNO  # Las validaciones avanzan en el día

            for _ in range(n_pedidos):
                # Seleccionar auxiliar y perfil
                aux_idx = random.randint(0, len(auxiliares) - 1)
                aux = auxiliares[aux_idx]
                perfil = PERFILES[aux_idx]

                # Número de pedido único
                num_pedido = f"{random.randint(40000000, 49999999)}"
                pedido = db.query(Pedido).filter(Pedido.numero_pedido == num_pedido).first()
                if not pedido:
                    cliente = random.choice(clientes_obj)
                    pedido = Pedido(
                        numero_pedido=num_pedido,
                        id_cliente=cliente.id,
                        fecha_pedido=rand_time_in_day(dia),
                        estado="PENDIENTE",
                    )
                    db.add(pedido)
                    db.flush()

                # Alistamiento
                h_alis_inicio = rand_time_in_day(dia, hora_cursor % 24)
                dur_alis = random.randint(perfil["min_min"], perfil["max_min"])
                h_alis_fin = h_alis_inicio + timedelta(minutes=dur_alis)

                alistamiento = Alistamiento(
                    id_pedido=pedido.id,
                    id_alistador=aux.id,
                    hora_inicio=h_alis_inicio,
                    hora_fin=h_alis_fin,
                    estado="COMPLETADO",
                )
                db.add(alistamiento)
                db.flush()

                # Validación (empieza cuando termina alistamiento + pausa)
                pausa = random.randint(1, 5)
                h_val_inicio = h_alis_fin + timedelta(minutes=pausa)
                dur_val = random.randint(perfil["min_min"], perfil["max_min"])
                h_val_fin = h_val_inicio + timedelta(minutes=dur_val)

                es_ok = random.random() < perfil["tasa_ok"]
                estado_val = "OK" if es_ok else "CON_NOVEDADES"

                val = Validacion(
                    id_pedido=pedido.id,
                    id_validador=aux.id,
                    id_alistador=aux.id,
                    id_alistamiento=alistamiento.id,
                    hora_inicio=h_val_inicio,
                    hora_fin=h_val_fin,
                    total_unidades=random.randint(10, 120),
                    estado=estado_val,
                    cerrado_con_novedades=not es_ok,
                )
                db.add(val)
                db.flush()

                # Empaque
                prefijo = f"{str(dia.year)[-2:]}{str(dia.month).zfill(2)}{str(dia.day).zfill(2)}"
                seq = db.query(SecuenciaDiaria).filter(SecuenciaDiaria.prefijo_fecha == prefijo).first()
                if not seq:
                    seq = SecuenciaDiaria(prefijo_fecha=prefijo, ultimo_numero=0)
                    db.add(seq)
                    db.flush()
                seq.ultimo_numero += 1
                codigo_empaque = prefijo + str(seq.ultimo_numero).zfill(2)

                cliente_obj = db.query(Cliente).filter(Cliente.id == pedido.id_cliente).first()
                emp = Empaque(
                    codigo_empaque=codigo_empaque,
                    id_usuario=aux.id,
                    tipo_empaque=random.choice(["CAJA", "CAJA", "CAJA", "ESTIBA"]),
                    numero_caja=1,
                    total_cajas=random.randint(1, 4),
                    pedidos_asociados=num_pedido,
                    cliente=cliente_obj.nombre if cliente_obj else "DEMO",
                    direccion=cliente_obj.direccion if cliente_obj else "",
                    ciudad="BOGOTÁ D.C.",
                    departamento="BOGOTÁ D.C.",
                    fecha_hora=h_val_fin,
                )
                db.add(emp)

                pedido.estado = "VALIDADO" if es_ok else "EN_PROCESO"
                hora_cursor += random.randint(0, 1)
                total_val += 1

            db.commit()
            print(f"  ✓ {dia.strftime('%Y-%m-%d')} ({dia.strftime('%A')[:3]}) — {n_pedidos} pedidos generados")

        print(f"\n{'='*60}")
        print(f"  TOTAL: {total_val} validaciones generadas en {dias} días")
        print(f"  Contraseña de auxiliares demo: 'demo123'")
        print(f"{'='*60}\n")

    finally:
        db.close()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Simulador de datos BRAKEPAK")
    parser.add_argument("--dias",           type=int, default=30,  help="Días a simular (default: 30)")
    parser.add_argument("--pedidos-por-dia",type=int, default=25,  help="Pedidos promedio por día (default: 25)")
    args = parser.parse_args()
    simulate(args.dias, args.pedidos_por_dia)
