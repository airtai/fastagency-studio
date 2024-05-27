import json
import logging
from os import environ
from typing import Any, Dict, List, Optional, Union
from uuid import UUID

from fastapi import FastAPI, HTTPException
from openai import AsyncAzureOpenAI
from prisma.models import Model
from pydantic import BaseModel, TypeAdapter, ValidationError

from .db.helpers import find_model_using_raw, get_db_connection, get_wasp_db_url
from .models.registry import Registry, Schemas

logging.basicConfig(level=logging.INFO)

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


@app.post("/user/{user_uuid}/models/secret/{name}/{model_uuid}/validate")
async def validate_secret_model(
    user_uuid: UUID, name: str, model_uuid: UUID, model: Dict[str, Any]
) -> None:
    type: str = "secret"

    found_model = await find_model_using_raw(model_uuid=model_uuid, user_uuid=user_uuid)
    model["api_key"] = found_model["json_str"]["api_key"]
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


async def mask(value: str) -> str:
    if len(value):
        return (
            value[:3] + "..." + value[-4:]
            if len(value) > 9
            else value[0] + "." * (len(value) - 2) + value[-1]
        )
    else:
        return value


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
    ret_val_without_mask = ta.dump_python(models, serialize_as_any=True)  # type: ignore[call-arg]

    ret_val = []
    for model in ret_val_without_mask:
        if model["type_name"] == "secret":
            model["json_str"]["api_key"] = await mask(model["json_str"]["api_key"])
        ret_val.append(model)

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


# Load environment variable
AZURE_GPT35_MODEL = environ.get("AZURE_GPT35_MODEL")
AZURE_OPENAI_API_KEY = environ.get("AZURE_OPENAI_API_KEY")
AZURE_API_ENDPOINT = environ.get("AZURE_API_ENDPOINT")
AZURE_API_VERSION = environ.get("AZURE_API_VERSION")

# Setting up Azure OpenAI instance
aclient = AsyncAzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    azure_endpoint=AZURE_API_ENDPOINT,  # type: ignore
    api_version=AZURE_API_VERSION,
)

SYSTEM_PROMPT = """I am developing a chat application where users specify a task for the application to accomplish.
Generate a concise, professional name for the chat that directly reflects the essence of the task.
The name should consist of 2-3 words and be no more than 25 characters in total.
It should be immediately recognizable, meaningful, and sound natural to users, making it easy to identify the chat's
purpose at a glance. Please provide only the chat name in your response, with no additional text or explanation.
The name should use clear, user-friendly terminology that precisely captures the task's intent.

Note:
- I will tip you $1000 every time you generate a chat name that is 1-3 words long and up to 25 characters.
- Your chat name MUST be pertinent to the given task and avoids generic words such as "Forge" and "Hub".

Task Name:
{task_name}

Chat Name:
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "generate_chat_name",
            "description": "Use this tool to generate a chat name based on the task description.",
            "parameters": {
                "type": "object",
                "properties": {
                    "chat_name": {
                        "type": "string",
                        "description": "The name of the chat",
                    },
                },
                "required": ["chat_name"],
            },
        },
    },
]


async def generate_chat_name(
    team_name: str,
    chat_id: int,
    chat_name: str,
) -> Dict[str, Union[Optional[str], int]]:
    return {
        "team_status": "inprogress",
        "team_name": team_name,
        "team_id": chat_id,
        "customer_brief": "Some customer brief",
        "conversation_name": chat_name,
    }


class ChatRequest(BaseModel):
    chat_id: int
    message: List[Dict[str, str]]
    user_id: int


@app.post("/user/{user_uuid}/chat/{model_name}/{model_uuid}")
async def chat(request: ChatRequest) -> Dict[str, Any]:
    message = request.message[0]["content"]
    chat_id = request.chat_id
    user_id = request.user_id
    team_name = f"{user_id}_{chat_id}"

    try:
        messages = [
            {"role": "system", "content": SYSTEM_PROMPT.format(task_name=message)}
        ]
        completion = await aclient.chat.completions.create(
            model=AZURE_GPT35_MODEL,
            messages=messages,
            tools=TOOLS,
            tool_choice={
                "type": "function",
                "function": {"name": "generate_chat_name"},
            },
        )  # type: ignore

        response_message = completion.choices[0].message
        tool_calls = response_message.tool_calls
        if tool_calls:
            for tool_call in tool_calls:
                function_name = tool_call.function.name
                function_args = json.loads(tool_call.function.arguments)
                if function_name == "generate_chat_name":
                    return await generate_chat_name(  # type: ignore[return-value]
                        team_name=team_name,
                        chat_id=chat_id,
                        **function_args,
                    )

    except Exception:
        logging.error("Unable to generate chat name: ", exc_info=True)

    default_response = {
        "team_status": "inprogress",
        "team_name": team_name,
        "team_id": chat_id,
        "customer_brief": "Some customer brief",
        "conversation_name": message,
    }

    return default_response
