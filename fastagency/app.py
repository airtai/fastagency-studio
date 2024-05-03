import json
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, HTTPException
from prisma.models import UserModel
from pydantic import TypeAdapter, ValidationError

from .helpers import get_db_connection
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


# class ModelResponse(BaseModel):
#     uuid: str
#     model: BaseModel
#     type_name: str
#     model_name: str
#     user_id: int


# all_models: List[ModelResponse] = []


# def find_model(user_id: int, uuid: str) -> ModelResponse:
#     return [
#         model for model in all_models if model.user_id == user_id and model.uuid == uuid
#     ][0]


@app.get("/user/{user_id}/models")
async def get_all_models(
    user_id: int,
    type_name: Optional[str] = None,
) -> List[Any]:
    filters: Dict[str, Any] = {"userId": user_id}
    if type_name:
        filters["type_name"] = type_name

    async with get_db_connection() as db:
        user_models = await db.usermodel.find_many(where=filters)  # type: ignore[arg-type]

    ta = TypeAdapter(List[UserModel])
    ret_val = ta.dump_python(user_models, serialize_as_any=True)  # type: ignore[call-arg]
    return ret_val  # type: ignore[no-any-return]


@app.post("/user/{user_id}/models/{type_name}/{model_name}/{uuid}")
async def add_model(
    user_id: int, type_name: str, model_name: str, uuid: str, model: Dict[str, Any]
) -> Dict[str, Any]:
    registry = Registry.get_default()
    validated_model = registry.validate(type_name, model_name, model)
    async with get_db_connection() as db:
        await db.usermodel.create(
            data={
                "userId": user_id,
                "type_name": type_name,
                "model_name": model_name,
                "model_uuid": uuid,
                "json_string": validated_model.model_dump_json(),  # type: ignore[typeddict-item]
            }
        )
    return validated_model.model_dump()


@app.put("/user/{user_id}/models/{type_name}/{model_name}/{uuid}")
async def update_model(
    user_id: int, type_name: str, model_name: str, uuid: str, model: Dict[str, Any]
) -> Dict[str, Any]:
    registry = Registry.get_default()
    validated_model = registry.validate(type_name, model_name, model)

    async with get_db_connection() as db:
        await db.usermodel.update(
            where={"model_uuid": uuid, "userId": user_id},  # type: ignore[arg-type]
            data={  # type: ignore[typeddict-unknown-key]
                "model_uuid": uuid,
                "type_name": type_name,
                "model_name": model_name,
                "json_string": validated_model.model_dump_json(),  # type: ignore[typeddict-item]
                "userId": user_id,
            },
        )

    return validated_model.model_dump()


@app.delete("/user/{user_id}/models/{type_name}/{uuid}")
async def models_delete(user_id: int, type_name: str, uuid: str) -> Dict[str, Any]:
    async with get_db_connection() as db:
        user_model = await db.usermodel.delete(
            where={"model_uuid": uuid, "userId": user_id}  # type: ignore[arg-type]
        )

    return user_model.json_string  # type: ignore
