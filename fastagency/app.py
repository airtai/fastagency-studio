import json
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, TypeAdapter, ValidationError

from .models.registry import Registry, Schemas

app = FastAPI()


@app.get("/models/schemas")
async def get_models_schemas() -> Schemas:
    schemas = Registry.get_default().get_schemas()
    return schemas


@app.post("/models/{type}/{name}/validate")
async def validate_model(type: str, name: str, model: Dict[str, Any]) -> None:
    try:
        Registry.get_default().validate(type, name, model)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=json.loads(e.json())) from e


# new routes by Harish


# all_models: Dict[int, Dict[str, List[Optional[Dict[str, BaseModel]]]]] = {}
class ModelResponse(BaseModel):
    uuid: str
    model: BaseModel
    type_name: str
    model_name: str
    user_id: int


all_models: List[ModelResponse] = []


def find_model(user_id: int, uuid: str) -> ModelResponse:
    return [  # noqa: RUF015
        model for model in all_models if model.user_id == user_id and model.uuid == uuid
    ][0]


@app.get("/user/{user_id}/models")
def get_all_models(
    user_id: int,
    type_name: Optional[str] = None,
) -> List[Any]:
    models = [
        model
        for model in all_models
        if model.user_id == user_id
        and [model.type_name == type_name or type_name is None]
    ]
    ta = TypeAdapter(List[ModelResponse])
    ret_val = ta.dump_python(models, serialize_as_any=True)  # type: ignore[call-arg]
    return ret_val  # type: ignore[no-any-return]


@app.post("/user/{user_id}/models/{type_name}/{model_name}/{uuid}")
def add_model(
    user_id: int, type_name: str, model_name: str, uuid: str, model: Dict[str, Any]
) -> Dict[str, Any]:
    registry = Registry.get_default()
    validated_model = registry.validate(type_name, model_name, model)
    all_models.append(
        ModelResponse(
            uuid=uuid,
            model=validated_model,
            type_name=type_name,
            model_name=model_name,
            user_id=user_id,
        )
    )
    return validated_model.model_dump()


@app.put("/user/{user_id}/models/{type_name}/{model_name}/{uuid}")
def update_model(
    user_id: int, type_name: str, model_name: str, uuid: str, model: Dict[str, Any]
) -> Dict[str, Any]:
    registry = Registry.get_default()
    validated_model = registry.validate(type_name, model_name, model)

    ix = [i for i, model in enumerate(all_models) if model.uuid == uuid]
    if ix == []:
        raise HTTPException(status_code=404, detail="Model not found")
    i = ix[0]
    all_models[i] = ModelResponse(
        uuid=uuid,
        model=validated_model,
        type_name=type_name,
        model_name=model_name,
        user_id=user_id,
    )

    return validated_model.model_dump()


@app.delete("/user/{user_id}/models/{type_name}/{uuid}")
def models_delete(user_id: int, type_name: str, uuid: str) -> Dict[str, Any]:
    ix = [i for i, model in enumerate(all_models) if model.uuid == uuid]
    if ix == []:
        raise HTTPException(status_code=404, detail="Model not found")
    i = ix[0]
    response = all_models[i]
    del all_models[i]
    return response.model.model_dump()
