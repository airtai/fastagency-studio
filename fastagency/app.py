import json
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from pydantic import ValidationError

# from .constants import REGISTRED_MODEL_TYPES
from .models.registry import Registry, Schemas

app = FastAPI()


@app.get("/models/schemas")
async def get_models_schemas() -> Schemas:
    schemas = Registry.get_default().get_schemas()
    return schemas


# todo: replace str with Literal[REGISTRED_MODEL_TYPES]
@app.post("/models/validate")
async def validate_model(model_json: Dict[str, Any]) -> None:
    try:
        Registry.get_default().validate(model_json)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=json.loads(e.json())) from e
