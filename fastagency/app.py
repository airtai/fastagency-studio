import json
import logging
from os import environ
from typing import Any, Dict, List, Optional, Tuple, Union
from uuid import UUID, uuid4

import httpx
import yaml
from fastapi import BackgroundTasks, FastAPI, HTTPException
from openai import AsyncAzureOpenAI
from prisma.models import Model
from pydantic import BaseModel, TypeAdapter, ValidationError

from fastagency.saas_app_generator import CreateGHRepoError, SaasAppGenerator

from .db.helpers import (
    find_model_using_raw,
    get_db_connection,
    get_wasp_db_url,
)
from .models.registry import Registry, Schemas
from .models.toolboxes.toolbox import Toolbox

logging.basicConfig(level=logging.INFO)

app = FastAPI()


@app.get("/models/schemas")
async def get_models_schemas() -> Schemas:
    schemas = Registry.get_default().get_schemas()
    return schemas


async def validate_toolbox(toolbox: Toolbox) -> None:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(toolbox.openapi_url)  # type: ignore[arg-type]
    except Exception as e:
        raise HTTPException(status_code=422, detail="OpenAPI URL is invalid") from e

    if not (resp.status_code >= 200 and resp.status_code < 400):
        raise HTTPException(
            status_code=422, detail=f"OpenAPI URL returns error code {resp.status_code}"
        )

    try:
        if "yaml" in toolbox.openapi_url or "yml" in toolbox.openapi_url:  # type: ignore [operator]
            openapi_spec = yaml.safe_load(resp.text)
        else:
            openapi_spec = resp.json()

        if "openapi" not in openapi_spec:
            raise HTTPException(
                status_code=422,
                detail="OpenAPI URL does not contain a valid OpenAPI spec",
            )
    except Exception as e:
        raise HTTPException(
            status_code=422, detail="OpenAPI URL does not contain a valid OpenAPI spec"
        ) from e


@app.post("/models/{type}/{name}/validate")
async def validate_model(type: str, name: str, model: Dict[str, Any]) -> Dict[str, Any]:
    try:
        validated_model = Registry.get_default().validate(type, name, model)
        if isinstance(validated_model, Toolbox):
            await validate_toolbox(validated_model)
        return validated_model.model_dump()
    except ValidationError as e:
        raise HTTPException(status_code=422, detail=json.loads(e.json())) from e


@app.post("/user/{user_uuid}/models/secret/{name}/{model_uuid}/validate")
async def validate_secret_model(
    user_uuid: UUID, name: str, model_uuid: UUID, model: Dict[str, Any]
) -> Dict[str, Any]:
    type: str = "secret"

    found_model = await find_model_using_raw(model_uuid=model_uuid)
    if "api_key" in found_model["json_str"]:
        model["api_key"] = found_model["json_str"]["api_key"]
    try:
        validated_model = Registry.get_default().validate(type, name, model)
        return validated_model.model_dump()
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
    return value[:3] + "*" * (len(value) - 7) + value[-4:]


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
            for k in ["api_key", "gh_token", "fly_token"]:
                if k in model["json_str"]:
                    model["json_str"][k] = await mask(model["json_str"][k])
        ret_val.append(model)

    return ret_val  # type: ignore[no-any-return]


async def _create_gh_repo(
    model: Dict[str, Any],
    model_uuid: str,
) -> SaasAppGenerator:
    async with get_db_connection():
        found_gh_token = await find_model_using_raw(
            model_uuid=model["gh_token"]["uuid"]
        )
        found_fly_token = await find_model_using_raw(
            model_uuid=model["fly_token"]["uuid"]
        )

    found_gh_token_uuid = found_gh_token["json_str"]["gh_token"]
    found_fly_token_uuid = found_fly_token["json_str"]["fly_token"]

    saas_app = SaasAppGenerator(
        fly_api_token=found_fly_token_uuid,
        github_token=found_gh_token_uuid,
        app_name=model["name"],
        fastagency_application_uuid=model_uuid,
    )
    saas_app.create_new_repository()
    return saas_app


async def _deploy_saas_app(
    saas_app: SaasAppGenerator,
    user_uuid: str,
    model_uuid: str,
    type_name: str,
    model_name: str,
) -> None:
    flyio_app_url = saas_app.execute()

    async with get_db_connection() as db:
        found_model = await find_model_using_raw(model_uuid=model_uuid)
        found_model["json_str"]["flyio_app_url"] = flyio_app_url
        found_model["json_str"]["app_deploy_status"] = "completed"

        await db.model.update(
            where={"uuid": found_model["uuid"]},  # type: ignore[arg-type]
            data={  # type: ignore[typeddict-unknown-key]
                "type_name": type_name,
                "model_name": model_name,
                "json_str": json.dumps(found_model["json_str"]),  # type: ignore[typeddict-item]
                "user_uuid": user_uuid,
            },
        )


@app.post("/user/{user_uuid}/models/{type_name}/{model_name}/{model_uuid}")
async def add_model(
    user_uuid: str,
    type_name: str,
    model_name: str,
    model_uuid: str,
    model: Dict[str, Any],
    background_tasks: BackgroundTasks,
) -> Dict[str, Any]:
    try:
        registry = Registry.get_default()
        validated_model = registry.validate(type_name, model_name, model)

        validated_model_dict = validated_model.model_dump()
        validated_model_json = validated_model.model_dump_json()
        saas_app = None

        if type_name == "application":
            saas_app = await _create_gh_repo(validated_model_dict, model_uuid)

            validated_model_dict["app_deploy_status"] = "inprogress"
            validated_model_dict["gh_repo_url"] = saas_app.gh_repo_url

            updated_validated_model_dict = json.loads(validated_model_json)
            updated_validated_model_dict["app_deploy_status"] = "inprogress"
            updated_validated_model_dict["gh_repo_url"] = saas_app.gh_repo_url
            validated_model_json = json.dumps(updated_validated_model_dict)

        await get_user(user_uuid=user_uuid)
        async with get_db_connection() as db:
            await db.model.create(
                data={
                    "uuid": model_uuid,
                    "user_uuid": user_uuid,
                    "type_name": type_name,
                    "model_name": model_name,
                    "json_str": validated_model_json,  # type: ignore[typeddict-item]
                }
            )

        if saas_app is not None:
            background_tasks.add_task(
                _deploy_saas_app,
                saas_app,
                user_uuid,
                model_uuid,
                type_name,
                model_name,
            )

        return validated_model_dict

    except CreateGHRepoError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e

    except Exception as e:
        msg = "Oops! Something went wrong. Please try again later."
        raise HTTPException(status_code=422, detail=msg) from e


@app.get("/user/{user_uuid}/setup")
async def setup_user(user_uuid: str) -> Dict[str, Any]:
    """Setup user after creating.

    This function is called after the user is created.
    Currently it sets up weather toolbox for the user.
    """
    await get_user(user_uuid=user_uuid)
    model_uuid = str(uuid4())
    model_name = "WeatherToolbox"

    domain = environ.get("DOMAIN", "localhost")
    if "staging" in domain or "localhost" in domain:
        toolbox_openapi_url = "https://weather.tools.staging.fastagency.ai/openapi.json"
    else:
        toolbox_openapi_url = "https://weather.tools.fastagency.ai/openapi.json"
    toolbox = Toolbox(
        name=model_name, openapi_url=toolbox_openapi_url, openapi_auth=None
    )

    # Check if default weather toolbox already exists
    filters: Dict[str, Any] = {"user_uuid": user_uuid, "type_name": "toolbox"}
    async with get_db_connection() as db:
        models = await db.model.find_many(where=filters)  # type: ignore[arg-type]
    for model in models:
        if model.json_str == toolbox.model_dump():  # type: ignore[comparison-overlap]
            raise HTTPException(
                status_code=400, detail="Weather toolbox already exists"
            )

    result = await add_model(
        user_uuid=user_uuid,
        type_name="toolbox",
        model_name=Toolbox.__name__,
        model_uuid=model_uuid,
        model=toolbox.model_dump(),
        background_tasks=BackgroundTasks(),
    )
    return result


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
        found_model = await find_model_using_raw(model_uuid=model_uuid)

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
        found_model = await find_model_using_raw(model_uuid=model_uuid)
        model = await db.model.delete(
            where={"uuid": found_model["uuid"]}  # type: ignore[arg-type]
        )

    return model.json_str  # type: ignore


def get_azure_llm_client() -> Tuple[AsyncAzureOpenAI, str]:
    azure_gpt35_model = environ["AZURE_GPT35_MODEL"]
    api_key = environ["AZURE_OPENAI_API_KEY"]
    azure_endpoint = environ["AZURE_API_ENDPOINT"]
    api_version = environ["AZURE_API_VERSION"]

    aclient = AsyncAzureOpenAI(
        api_key=api_key,
        azure_endpoint=azure_endpoint,  # type: ignore
        api_version=api_version,
    )

    return aclient, azure_gpt35_model


# todo: fix monkeypatching in testing and remove global variables
try:
    aclient, azure_gpt35_model = get_azure_llm_client()
except Exception:
    aclient = None  # type: ignore[assignment]
    azure_gpt35_model = None  # type: ignore[assignment]

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
            model=azure_gpt35_model,
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


@app.post("/application/{application_uuid}/chat")
async def application_chat(application_uuid: str) -> Dict[str, Any]:
    found_model = await find_model_using_raw(model_uuid=application_uuid)
    team_name = found_model["json_str"]["name"]
    team_uuid = found_model["json_str"]["team"]["uuid"]

    return {
        "team_status": "inprogress",
        "team_name": team_name,
        "team_uuid": team_uuid,
        "conversation_name": "New Chat",
    }
