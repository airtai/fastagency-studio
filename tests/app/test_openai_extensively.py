import json
import uuid
from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient

from fastagency.app import app
from fastagency.models.llms.openai import OpenAI, OpenAIAPIKey
from fastagency.models.registry import Schemas

client = TestClient(app)


# we will do this for OpenAI only, the rest should be the same
class TestValidateOpenAI:
    @pytest.fixture()
    def model_dict(self) -> Dict[str, Any]:
        key_uuid = uuid.uuid4()
        OpenAIAPIKeyRef = OpenAIAPIKey.get_reference_model()  # noqa: N806
        api_key = OpenAIAPIKeyRef(uuid=key_uuid)

        model = OpenAI(api_key=api_key)

        return json.loads(model.model_dump_json())  # type: ignore[no-any-return]

    def test_get_openai_schema(self) -> None:
        response = client.get("/models/schemas")
        assert response.status_code == 200

        schemas = Schemas(**response.json())
        llm_schema = next(
            schemas for schemas in schemas.list_of_schemas if schemas.name == "llm"
        )

        openai_schema = next(
            schema for schema in llm_schema.schemas if schema.name == OpenAI.__name__
        )

        assert len(openai_schema.json_schema) > 0

    def test_validate_success(self, model_dict: Dict[str, Any]) -> None:
        response = client.post(
            "/models/llm/OpenAI/validate",
            json=model_dict,
        )
        assert response.status_code == 200

    def test_validate_missing_key(self, model_dict: Dict[str, Any]) -> None:
        model_dict.pop("api_key")

        response = client.post(
            "/models/llm/OpenAI/validate",
            json=model_dict,
        )
        assert response.status_code == 422
        msg_dict = response.json()["detail"][0]
        msg_dict.pop("input")
        msg_dict.pop("url")
        expected = {
            "type": "missing",
            "loc": ["api_key"],
            "msg": "Field required",
        }
        assert msg_dict == expected

    def test_validate_incorrect_model(self, model_dict: Dict[str, Any]) -> None:
        model_dict["model"] = model_dict["model"] + "_turbo_diezel"

        response = client.post(
            "/models/llm/OpenAI/validate",
            json=model_dict,
        )
        assert response.status_code == 422
        msg_dict = response.json()["detail"][0]
        msg_dict.pop("input")
        msg_dict.pop("url")
        expected = {
            "type": "literal_error",
            "loc": ["model"],
            "msg": "Input should be 'gpt-4' or 'gpt-3.5-turbo'",
            "ctx": {"expected": "'gpt-4' or 'gpt-3.5-turbo'"},
        }
        assert msg_dict == expected

    def test_validate_incorrect_base_url(self, model_dict: Dict[str, Any]) -> None:
        model_dict["base_url"] = "mailto://api.openai.com/v1"

        response = client.post(
            "/models/llm/OpenAI/validate",
            json=model_dict,
        )
        assert response.status_code == 422
        msg_dict = response.json()["detail"][0]
        msg_dict.pop("input")
        msg_dict.pop("url")
        expected = {
            "ctx": {"expected_schemes": "'http' or 'https'"},
            "loc": ["base_url"],
            "msg": "URL scheme should be 'http' or 'https'",
            "type": "url_scheme",
        }
        assert msg_dict == expected


def test_get_schemas() -> None:
    response = client.get("/models/schemas")
    assert response.status_code == 200

    schemas = Schemas(**response.json())
    assert len(schemas.list_of_schemas) >= 2
