from typing import Any, Dict

import httpx
import pytest

from fastagency.models.base import ObjectReference

from .conftest import find_free_port


def test_llm_config_fixture(azure_llm_config: Dict[str, Any]) -> None:
    assert set(azure_llm_config.keys()) == {"config_list", "temperature"}
    assert isinstance(azure_llm_config["config_list"], list)
    assert azure_llm_config["temperature"] == 0.8

    for k in ["model", "api_key", "base_url", "api_type", "api_version"]:
        assert len(azure_llm_config["config_list"][0][k]) > 3


def test_find_free_port() -> None:
    port = find_free_port()
    assert isinstance(port, int)
    assert 1024 <= port <= 65535


def test_fastapi_openapi(fastapi_openapi_url: str) -> None:
    assert isinstance(fastapi_openapi_url, str)

    resp = httpx.get(fastapi_openapi_url)
    assert resp.status_code == 200
    resp_json = resp.json()
    assert "openapi" in resp_json
    assert "servers" in resp_json
    assert len(resp_json["servers"]) == 1
    assert resp_json["info"]["title"] == "FastAPI"


def test_weather_fastapi_openapi(weather_fastapi_openapi_url: str) -> None:
    assert isinstance(weather_fastapi_openapi_url, str)

    resp = httpx.get(weather_fastapi_openapi_url)
    assert resp.status_code == 200
    resp_json = resp.json()
    assert "openapi" in resp_json
    assert "servers" in resp_json
    assert len(resp_json["servers"]) == 1
    assert resp_json["info"]["title"] == "Weather"


@pytest.mark.db()
@pytest.mark.asyncio()
async def test_weather_toolbox_ref(weather_toolbox_ref: ObjectReference) -> None:
    assert isinstance(weather_toolbox_ref, ObjectReference)
