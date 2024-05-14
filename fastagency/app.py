import json
from typing import Any, Dict, List, Optional, Union

from fastapi import FastAPI, HTTPException
from prisma.models import Model
from pydantic import TypeAdapter, ValidationError

from .db.helpers import get_db_connection, get_wasp_db_url
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


async def get_user(user_uuid: Union[int, str]) -> Any:
    wasp_db_url = await get_wasp_db_url()
    async with get_db_connection(db_url=wasp_db_url) as db:
        select_query = 'SELECT * from "User" where uuid=' + f"'{user_uuid}'"  # nosec: [B608]
        user = await db.query_first(
            select_query  # nosec: [B608]
        )
    if not user:
        raise HTTPException(status_code=404, detail=f"user_uuid {user_uuid} not found")
    return user


async def find_model_using_raw(model_uuid: str, user_uuid: str) -> Dict[str, Any]:
    async with get_db_connection() as db:
        model: Optional[Dict[str, Any]] = await db.query_first(
            'SELECT * from "Model" where uuid='  # nosec: [B608]
            + f"'{model_uuid}' and user_uuid='{user_uuid}'"
        )

    if not model:
        raise HTTPException(
            status_code=404,
            detail=f"model_uuid {model_uuid} and user_uuid {user_uuid} not found",
        )
    return model


@app.get("/user/{user_uuid}/models")
async def get_all_models(
    user_uuid: str,
    type_name: Optional[str] = None,
) -> List[Any]:
    filters: Dict[str, Any] = {"user_uuid": user_uuid}
    if type_name:
        filters["type_name"] = type_name

    async with get_db_connection() as db:
        models = await db.model.find_many(where=filters)  # type: ignore[arg-type]

    ta = TypeAdapter(List[Model])
    ret_val = ta.dump_python(models, serialize_as_any=True)  # type: ignore[call-arg]
    return ret_val  # type: ignore[no-any-return]


@app.post("/user/{user_uuid}/models/{type_name}/{model_name}/{model_uuid}")
async def add_model(
    user_uuid: str,
    type_name: str,
    model_name: str,
    model_uuid: str,
    model: Dict[str, Any],
) -> Dict[str, Any]:
    registry = Registry.get_default()
    validated_model = registry.validate(type_name, model_name, model)

    await get_user(user_uuid=user_uuid)
    async with get_db_connection() as db:
        await db.model.create(
            data={
                "uuid": model_uuid,
                "user_uuid": user_uuid,
                "type_name": type_name,
                "model_name": model_name,
                "json_str": validated_model.model_dump_json(),  # type: ignore[typeddict-item]
            }
        )
    return validated_model.model_dump()


@app.put("/user/{user_uuid}/models/{type_name}/{model_name}/{model_uuid}")
async def update_model(
    user_uuid: str,
    type_name: str,
    model_name: str,
    model_uuid: str,
    model: Dict[str, Any],
) -> Dict[str, Any]:
    registry = Registry.get_default()
    validated_model = registry.validate(type_name, model_name, model)

    async with get_db_connection() as db:
        found_model = await find_model_using_raw(
            model_uuid=model_uuid, user_uuid=user_uuid
        )

        await db.model.update(
            where={"uuid": found_model["uuid"]},  # type: ignore[arg-type]
            data={  # type: ignore[typeddict-unknown-key]
                "type_name": type_name,
                "model_name": model_name,
                "json_str": validated_model.model_dump_json(),  # type: ignore[typeddict-item]
                "user_uuid": user_uuid,
            },
        )

    return validated_model.model_dump()


@app.delete("/user/{user_uuid}/models/{type_name}/{model_uuid}")
async def models_delete(
    user_uuid: str, type_name: str, model_uuid: str
) -> Dict[str, Any]:
    async with get_db_connection() as db:
        found_model = await find_model_using_raw(
            model_uuid=model_uuid, user_uuid=user_uuid
        )
        model = await db.model.delete(
            where={"uuid": found_model["uuid"]}  # type: ignore[arg-type]
        )

    return model.json_str  # type: ignore


@app.post("/user/{user_uuid}/chat/{model_name}/{model_uuid}")
async def openai_chat() -> Dict[str, Any]:
    # return {
    #     "content": "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.",
    #     "smart_suggestions": {"suggestions": [""], "type": "oneOf"},
    #     "team_status": None,
    #     "team_name": None,
    #     "team_id": None,
    # }
    return {
        "team_status": "inprogress",
        "team_name": "team_name",
        "team_id": 1,
        "customer_brief": "customer_brief",
        "conversation_name": "conversation_name",
    }
