import contextlib
import os
import random
import socket
import threading
import time
import uuid
from platform import system
from typing import (
    Annotated,
    Any,
    AsyncIterator,
    Callable,
    Dict,
    Iterator,
    Optional,
    TypeVar,
)

import openai
import pytest
import pytest_asyncio
import uvicorn
from fastapi import FastAPI, Path
from pydantic import BaseModel

from fastagency.db.helpers import (
    get_db_connection,
    get_wasp_db_url,
)
from fastagency.helpers import create_model_ref
from fastagency.models.agents.assistant import AssistantAgent
from fastagency.models.base import ObjectReference
from fastagency.models.llms.anthropic import Anthropic, AnthropicAPIKey
from fastagency.models.llms.azure import AzureOAI, AzureOAIAPIKey
from fastagency.models.llms.openai import OpenAI, OpenAIAPIKey
from fastagency.models.llms.together import TogetherAI, TogetherAIAPIKey
from fastagency.models.toolboxes.toolbox import OpenAPIAuth, Toolbox

from .helpers import add_random_sufix, fixture, fixtures, parametrized_fixture

F = TypeVar("F", bound=Callable[..., Any])


@pytest_asyncio.fixture(scope="session")  # type: ignore[misc]
async def user_uuid() -> AsyncIterator[str]:
    try:
        random_id = random.randint(1, 1_000_000)
        generated_uuid = str(uuid.uuid4())
        wasp_db_url = await get_wasp_db_url()
        async with get_db_connection(db_url=wasp_db_url) as db:
            insert_query = (
                'INSERT INTO "User" (email, username, uuid) VALUES ('
                + f"'user{random_id}@airt.ai', 'user{random_id}', '{generated_uuid}')"
            )
            await db.execute_raw(insert_query)

            select_query = 'SELECT * FROM "User" WHERE uuid=' + f"'{generated_uuid}'"
            user = await db.query_first(select_query)

        yield user["uuid"]
    finally:
        pass


################################################################################
###
###                           Fixtures for LLMs
###
################################################################################


def azure_model_llm_config(model_env_name: str) -> Dict[str, Any]:
    api_key = os.getenv("AZURE_OPENAI_API_KEY", default="*" * 64)
    api_base = os.getenv(
        "AZURE_API_ENDPOINT", default="https://my-deployment.openai.azure.com"
    )
    gpt_3_5_model_name = os.getenv(model_env_name, default="gpt-35-turbo-16k")

    openai.api_type = "azure"
    openai.api_version = os.getenv("AZURE_API_VERSION", default="2024-02-01")

    config_list = [
        {
            "model": gpt_3_5_model_name,
            "api_key": api_key,
            "base_url": api_base,
            "api_type": openai.api_type,
            "api_version": openai.api_version,
        }
    ]

    llm_config = {
        "config_list": config_list,
        "temperature": 0.8,
    }

    return llm_config


@fixture("llm_config")
def azure_gpt35_turbo_16k_llm_config() -> Dict[str, Any]:
    return azure_model_llm_config("AZURE_GPT35_MODEL")


def openai_llm_config(model: str) -> Dict[str, Any]:
    stars = "*" * 20
    api_key = os.getenv("OPENAI_API_KEY", default=f"sk-{stars}T3BlbkFJ{stars}")

    config_list = [
        {
            "model": model,
            "api_key": api_key,
        }
    ]

    llm_config = {
        "config_list": config_list,
        "temperature": 0.8,
    }

    return llm_config


@fixture("llm_config")
def openai_gpt35_turbo_16k_llm_config() -> Dict[str, Any]:
    return openai_llm_config("gpt-3.5-turbo")


@fixture("llm_key")
async def azure_oai_key_ref(
    user_uuid: str, azure_gpt35_turbo_16k_llm_config: Dict[str, Any]
) -> ObjectReference:
    api_key = azure_gpt35_turbo_16k_llm_config["config_list"][0]["api_key"]
    return await create_model_ref(
        AzureOAIAPIKey,
        "secret",
        user_uuid=user_uuid,
        name=add_random_sufix("azure_oai_key"),
        api_key=api_key,
    )


@fixture("llm")
async def azure_oai_ref(
    user_uuid: str,
    azure_gpt35_turbo_16k_llm_config: Dict[str, Any],
    azure_oai_key_ref: ObjectReference,
) -> ObjectReference:
    kwargs = azure_gpt35_turbo_16k_llm_config["config_list"][0].copy()
    kwargs.pop("api_key")
    temperature = azure_gpt35_turbo_16k_llm_config["temperature"]
    return await create_model_ref(
        AzureOAI,
        "llm",
        user_uuid=user_uuid,
        name=add_random_sufix("azure_oai"),
        api_key=azure_oai_key_ref,
        temperature=temperature,
        **kwargs,
    )


@fixture("llm_key")
async def openai_oai_key_ref(
    user_uuid: str, openai_gpt35_turbo_16k_llm_config: Dict[str, Any]
) -> ObjectReference:
    api_key = openai_gpt35_turbo_16k_llm_config["config_list"][0]["api_key"]
    return await create_model_ref(
        OpenAIAPIKey,
        "secret",
        user_uuid=user_uuid,
        name=add_random_sufix("openai_oai_key"),
        api_key=api_key,
    )


@fixture("llm")
async def openai_oai_ref(
    user_uuid: str,
    openai_gpt35_turbo_16k_llm_config: Dict[str, Any],
    openai_oai_key_ref: ObjectReference,
) -> ObjectReference:
    kwargs = openai_gpt35_turbo_16k_llm_config["config_list"][0].copy()
    kwargs.pop("api_key")
    temperature = openai_gpt35_turbo_16k_llm_config["temperature"]
    return await create_model_ref(
        OpenAI,
        "llm",
        user_uuid=user_uuid,
        name=add_random_sufix("azure_oai"),
        api_key=openai_oai_key_ref,
        temperature=temperature,
        **kwargs,
    )


@fixture("llm_key")
async def anthropic_key_ref(user_uuid: str) -> ObjectReference:
    api_key = os.getenv(
        "ANTHROPIC_API_KEY",
        default="sk-ant-api03-" + "_" * 95,
    )

    return await create_model_ref(
        AnthropicAPIKey,
        "secret",
        user_uuid=user_uuid,
        name=add_random_sufix("anthropic_api_key"),
        api_key=api_key,
    )


@fixture("llm")
async def anthropic_ref(
    user_uuid: str,
    anthropic_key_ref: ObjectReference,
) -> ObjectReference:
    return await create_model_ref(
        Anthropic,
        "llm",
        user_uuid=user_uuid,
        name=add_random_sufix("anthropic_api"),
        api_key=anthropic_key_ref,
    )


@fixture("llm_key")
async def together_ai_key_ref(user_uuid: str) -> ObjectReference:
    api_key = os.getenv(
        "TOGETHER_API_KEY",
        default="*" * 64,
    )

    return await create_model_ref(
        TogetherAIAPIKey,
        "secret",
        user_uuid=user_uuid,
        name=add_random_sufix("togetherai_api_key"),
        api_key=api_key,
    )


@fixture("llm")
async def togetherai_ref(
    user_uuid: str,
    together_ai_key_ref: ObjectReference,
) -> ObjectReference:
    return await create_model_ref(
        TogetherAI,
        "llm",
        user_uuid=user_uuid,
        name=add_random_sufix("togetherai"),
        api_key=together_ai_key_ref,
    )


################################################################################
###
###                           Fixtures for Agents
###
################################################################################


@parametrized_fixture(target_type_name="assistant", src_types=fixtures["llm"])
async def assistant_ref(
    user_uuid: str,
    placeholder: ObjectReference,
) -> ObjectReference:
    return await create_model_ref(
        AssistantAgent,
        "agent",
        user_uuid=user_uuid,
        name=add_random_sufix("assistant_agent_azure_oai"),
        api_key=placeholder,
    )


# FastAPI app for testing

################################################################################
###
###                        Fixtures for application
###
################################################################################


class Item(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    tax: Optional[float] = None


def create_fastapi_app(host: str, port: int) -> FastAPI:
    app = FastAPI(
        servers=[
            {"url": f"http://{host}:{port}", "description": "Local development server"}
        ]
    )

    @app.get("/")
    def read_root() -> Dict[str, str]:
        return {"Hello": "World"}

    @app.get("/items/{item_id}")
    def read_item(item_id: int, q: Optional[str] = None) -> Dict[str, Any]:
        return {"item_id": item_id, "q": q}

    @app.post("/items")
    async def create_item(item: Item) -> Item:
        return item

    return app


def create_weather_fastapi_app(host: str, port: int) -> FastAPI:
    app = FastAPI(
        title="Weather",
        servers=[
            {"url": f"http://{host}:{port}", "description": "Local development server"}
        ],
    )

    @app.get("/forecast/{city}", description="Get the weather forecast for a city")
    def forecast(
        city: Annotated[str, Path(description="name of the city")],
    ) -> str:
        return f"Weather in {city} is sunny"

    return app


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]  # type: ignore [no-any-return]


def run_server(app: FastAPI, host: str = "127.0.0.1", port: int = 8000) -> None:
    uvicorn.run(app, host=host, port=port)


class Server(uvicorn.Server):  # type: ignore [misc]
    def install_signal_handlers(self) -> None:
        pass

    @contextlib.contextmanager
    def run_in_thread(self) -> Iterator[None]:
        thread = threading.Thread(target=self.run)
        thread.start()
        try:
            while not self.started:
                time.sleep(1e-3)
            yield
        finally:
            self.should_exit = True
            thread.join()


@pytest.fixture(scope="session")
def fastapi_openapi_url() -> Iterator[str]:
    host = "127.0.0.1"
    port = find_free_port()
    app = create_fastapi_app(host, port)
    openapi_url = f"http://{host}:{port}/openapi.json"

    config = uvicorn.Config(app, host=host, port=port, log_level="info")
    server = Server(config=config)
    with server.run_in_thread():
        time.sleep(1 if system() != "Windows" else 5)  # let the server start

        yield openapi_url


@pytest.fixture(scope="session")
def weather_fastapi_openapi_url() -> Iterator[str]:
    host = "127.0.0.1"
    port = find_free_port()
    app = create_weather_fastapi_app(host, port)
    openapi_url = f"http://{host}:{port}/openapi.json"

    config = uvicorn.Config(app, host=host, port=port, log_level="info")
    server = Server(config=config)
    with server.run_in_thread():
        time.sleep(1 if system() != "Windows" else 5)  # let the server start

        yield openapi_url


@pytest_asyncio.fixture()  # type: ignore[misc]
async def toolbox_ref(user_uuid: str, fastapi_openapi_url: str) -> ObjectReference:
    openapi_auth = await create_model_ref(
        OpenAPIAuth,
        "secret",
        user_uuid,
        name="openapi_auth_secret",
        username="test",
        password="password",  # pragma: allowlist secret
    )

    toolbox = await create_model_ref(
        Toolbox,
        "toolbox",
        user_uuid,
        name="test_toolbox",
        openapi_url=fastapi_openapi_url,
        openapi_auth=openapi_auth,
    )

    return toolbox


@pytest_asyncio.fixture()  # type: ignore[misc]
async def weather_toolbox_ref(
    user_uuid: str, weather_fastapi_openapi_url: str
) -> ObjectReference:
    openapi_auth = await create_model_ref(
        OpenAPIAuth,
        "secret",
        user_uuid,
        name="openapi_auth_secret",
        username="test",
        password="password",  # pragma: allowlist secret
    )

    toolbox = await create_model_ref(
        Toolbox,
        "toolbox",
        user_uuid,
        name="test_toolbox",
        openapi_url=weather_fastapi_openapi_url,
        openapi_auth=openapi_auth,
    )

    return toolbox
