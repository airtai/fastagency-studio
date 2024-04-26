from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ValidationError

# from .constants import REGISTRED_MODEL_TYPES
# from .models.base import ObjectWrapper
from .models.registry import Registry, Schemas

app = FastAPI()


@app.get("/models/schemas")
async def get_models_schemas() -> Schemas:
    schemas = Registry.get_default().get_schemas()
    return schemas


@app.post("/models/{type}/{name}/validate")
async def validate_model(type: str, name: str, model: Dict[str, Any]) -> None:
    try:
        registry = Registry.get_default()
        model_type = registry.get_model_type(type=type, name=name)
        model_type.model_validate(model)
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=e.errors()) from e


# new routes by Harish

all_models: Dict[int, Dict[str, List[Optional[Dict[str, Any]]]]] = {}


def find_model(user_id: int, uuid: str) -> Dict[str, Any]:
    if user_id not in all_models:
        raise HTTPException(status_code=404, detail="User not found")
    for model in all_models[user_id]:
        if model and model["uuid"] == uuid:  # type: ignore
            return model  # type: ignore
    raise HTTPException(status_code=404, detail="Model not found")


class User(BaseModel):
    user_id: int
    property_type: str


@app.post("/user/models")
def models(user: User) -> List[Optional[Dict[str, Any]]]:
    user_models = all_models.get(user.user_id, {})
    return user_models.get(user.property_type, [])


class Model(BaseModel):
    uuid: str
    api_key: str
    property_type: str
    property_name: str
    user_id: int


@app.post("/user/models/add")
def models_add(model: Model) -> Dict[str, Any]:
    user_models = all_models.setdefault(model.user_id, {})
    model_dict = model.model_dump()
    user_models.setdefault(model.property_type, []).append(model_dict)
    return user_models


class ModelUpdate(BaseModel):
    user_id: int
    uuid: str
    model: Optional[str]
    base_url: Optional[str]
    api_type: Optional[str]
    api_version: Optional[str] = None


@app.put("/user/models/update")
def models_update(model_update: ModelUpdate) -> Dict[str, Any]:
    model = find_model(model_update.user_id, model_update.uuid)
    updated_model = model_update.model_dump()
    updated_model["uuid"] = model["uuid"]
    all_models[model_update.user_id].remove(model)  # type: ignore
    all_models[model_update.user_id].append(updated_model)  # type: ignore
    return updated_model


class ModelDelete(BaseModel):
    user_id: int
    uuid: str


@app.delete("/user/models/delete")
def models_delete(model_delete: ModelDelete) -> Dict[str, str]:
    model = find_model(model_delete.user_id, model_delete.uuid)
    all_models[model_delete.user_id].remove(model)  # type: ignore
    return {"detail": "Model deleted successfully"}
