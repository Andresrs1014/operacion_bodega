"""Serialización y límites de borradores de validación."""
import json
from datetime import datetime
from typing import Any

MAX_PAYLOAD_BYTES = 400_000


def payload_to_json(payload: dict[str, Any]) -> str:
    raw = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
    if len(raw.encode("utf-8")) > MAX_PAYLOAD_BYTES:
        raise ValueError("El borrador excede el tamaño máximo permitido.")
    return raw


def json_to_payload(raw: str) -> dict[str, Any]:
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as e:
        raise ValueError("Payload de borrador inválido.") from e
    if not isinstance(data, dict):
        raise ValueError("El borrador debe ser un objeto JSON.")
    return data


def utcnow() -> datetime:
    return datetime.utcnow()
