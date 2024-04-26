from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ValidationError

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
        raise HTTPException(status_code=422, detail=e.json()) from e


# new routes by Harish

all_models: Dict[int, List[Optional[Dict[str, Any]]]] = {}


def find_model(user_id: int, uuid: str) -> Dict[str, Any]:
    if user_id not in all_models:
        raise HTTPException(status_code=404, detail="User not found")
    for model in all_models[user_id]:
        if model and model["uuid"] == uuid:
            return model
    raise HTTPException(status_code=404, detail="Model not found")


class User(BaseModel):
    user_id: int


@app.post("/user/models")
def models(user: User) -> List[Optional[Dict[str, Any]]]:
    return all_models.get(user.user_id, [])


class Model(BaseModel):
    uuid: str
    user_id: int
    model: str
    base_url: str
    api_type: str
    api_version: Optional[str] = None


@app.post("/user/models/add")
def models_add(model: Model) -> List[Optional[Dict[str, Any]]]:
    models = all_models.setdefault(model.user_id, [])
    model_dict = model.model_dump()
    models.append(model_dict)
    return models


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
    all_models[model_update.user_id].remove(model)
    all_models[model_update.user_id].append(updated_model)
    return updated_model


class ModelDelete(BaseModel):
    user_id: int
    uuid: str


@app.delete("/user/models/delete")
def models_delete(model_delete: ModelDelete) -> Dict[str, str]:
    model = find_model(model_delete.user_id, model_delete.uuid)
    all_models[model_delete.user_id].remove(model)
    return {"detail": "Model deleted successfully"}
