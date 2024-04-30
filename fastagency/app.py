import json
from typing import Any, Dict, List, Optional, Union

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
        raise HTTPException(status_code=422, detail=json.loads(e.json())) from e


# new routes by Harish

all_models: Dict[int, Dict[str, List[Optional[Dict[str, Any]]]]] = {}


def find_model(user_id: int, property_type: str, uuid: str) -> Dict[str, Any]:
    if user_id not in all_models or property_type not in all_models[user_id]:
        raise HTTPException(status_code=404, detail="User or property type not found")
    for model in all_models[user_id][property_type]:
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
    api_key: Union[str, Dict[str, Union[Union[Optional[str], None], int]]]
    property_type: str
    property_name: str
    user_id: int
    base_url: Optional[str] = None
    model: Optional[str] = None
    api_type: Optional[str] = None
    api_version: Optional[str] = None


@app.post("/user/models/add")
def models_add(model: Model) -> Dict[str, Any]:
    user_models = all_models.setdefault(model.user_id, {})
    model_dict = model.model_dump()
    user_models.setdefault(model.property_type, []).append(model_dict)
    return user_models


@app.put("/user/models/update")
def models_update(model_update: Model) -> Dict[str, Any]:
    model = find_model(
        model_update.user_id, model_update.property_type, model_update.uuid
    )
    updated_model = model_update.model_dump()
    updated_model["uuid"] = model["uuid"]
    all_models[model_update.user_id][model_update.property_type].remove(model)  # type: ignore
    all_models[model_update.user_id][model_update.property_type].append(updated_model)  # type: ignore
    return updated_model


class ModelDelete(BaseModel):
    user_id: int
    uuid: str
    property_type: str


@app.delete("/user/models/delete")
def models_delete(model_delete: ModelDelete) -> Dict[str, str]:
    model = find_model(
        model_delete.user_id, model_delete.property_type, model_delete.uuid
    )
    all_models[model_delete.user_id][model_delete.property_type].remove(model)  # type: ignore
    return {"detail": "Model deleted successfully"}
