import os
import random
import socket
import time
import uuid
from multiprocessing import Process
from typing import Any, AsyncIterator, Dict, Iterator, Optional

import httpx
import openai
import pytest
import pytest_asyncio
import uvicorn
from fastapi import FastAPI
from pydantic import BaseModel

from fastagency.db.helpers import get_db_connection, get_wasp_db_url


@pytest_asyncio.fixture  # type: ignore
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


@pytest.fixture()
def llm_config() -> Dict[str, Any]:
    api_key = os.getenv("AZURE_OPENAI_API_KEY")  # use France or Canada
    api_base = os.getenv("AZURE_API_ENDPOINT")
    gpt_3_5_model_name = os.getenv("AZURE_GPT35_MODEL")  # "gpt-35-turbo-16k"

    openai.api_type = "azure"
    openai.api_version = os.getenv("AZURE_API_VERSION")  # "2024-02-15-preview"

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
        "temperature": 0,
    }

    return llm_config


@pytest.mark.azure_oai()
def test_llm_config_fixture(llm_config: Dict[str, Any]) -> None:
    assert set(llm_config.keys()) == {"config_list", "temperature"}
    assert isinstance(llm_config["config_list"], list)
    assert llm_config["temperature"] == 0

    for k in ["model", "api_key", "base_url", "api_type", "api_version"]:
        assert len(llm_config["config_list"][0][k]) > 3


# FastAPI app for testing


def create_fastapi_app() -> FastAPI:
    app = FastAPI()

    class Item(BaseModel):
        name: str
        description: Optional[str] = None
        price: float
        tax: Optional[float] = None

    @app.get("/")
    def read_root() -> Dict[str, str]:
        return {"Hello": "World"}

    @app.get("/items/{item_id}")
    def read_item(item_id: int, q: Optional[str] = None) -> Dict[str, Any]:
        return {"item_id": item_id, "q": q}

    @app.post("/items/")
    async def create_item(item: Item) -> Item:
        return item

    return app


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]  # type: ignore [no-any-return]


def test_find_free_port() -> None:
    port = find_free_port()
    assert isinstance(port, int)
    assert 1024 <= port <= 65535


def run_server(app: FastAPI, host: str = "127.0.0.1", port: int = 8000) -> None:
    uvicorn.run(app, host=host, port=port)


@pytest.fixture(scope="session")
def fastapi_openapi_url() -> Iterator[str]:
    host = "127.0.0.1"
    port = find_free_port()
    app = create_fastapi_app()
    openapi_url = f"http://{host}:{port}/openapi.json"

    p = Process(target=run_server, args=(app, host, port))
    p.start()
    time.sleep(1)  # let the server start

    yield openapi_url

    p.terminate()
    p.join()


def test_fastapi_openapi(fastapi_openapi_url: str) -> None:
    assert isinstance(fastapi_openapi_url, str)

    resp = httpx.get(fastapi_openapi_url)
    assert resp.status_code == 200
    assert "openapi" in resp.json()
    assert resp.json()["info"]["title"] == "FastAPI"
