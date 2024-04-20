import json
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from pydantic import ValidationError

from .constants import REGISTRED_MODEL_TYPES
from .models import Registry, Schemas

app = FastAPI()


@app.get("/models/schemas")
async def get_models_schemas() -> Schemas:
    schemas = Registry.get_default().get_schemas()
    return schemas


@app.post("/models/{type}s/{model_name}/validate")
async def validate_model(
    type: REGISTRED_MODEL_TYPES, model_name: str, model: Dict[str, Any]
) -> None:
    try:
        Registry.get_default().validate(type, model, model_name)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=json.loads(e.json())) from e
    except ValueError as e:
        raise HTTPException(
            status_code=422,
            detail={"error": f"{model_name} is not a valid model name."},
        ) from e
