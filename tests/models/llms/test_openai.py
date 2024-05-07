import uuid

import pytest
from pydantic_core import Url

from fastagency.models.llms.openai import OpenAI, OpenAIAPIKey


class TestOpenAI:
    def test_openai_model(self) -> None:
        api_key_uuid = uuid.uuid4()
        OpenAIAPIKeyRef = OpenAIAPIKey.get_reference_model()  # noqa: N806
        api_key = OpenAIAPIKeyRef(uuid=api_key_uuid)

        model = OpenAI(
            api_key=api_key,
        )
        expected = {
            "name": "",
            "model": "gpt-3.5-turbo",
            "api_key": {
                "type": "secret",
                "name": "OpenAIAPIKey",
                "uuid": api_key_uuid,
            },
            "base_url": Url("https://api.openai.com/v1"),
            "api_type": "openai",
        }

        assert model.model_dump() == expected

    def test_openai_schema(self) -> None:
        schema = OpenAI.model_json_schema()
        expected = {
            "$defs": {
                "OpenAIAPIKeyRef": {
                    "properties": {
                        "type": {
                            "const": "secret",
                            "default": "secret",
                            "description": "The name of the type of the data",
                            "enum": ["secret"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "OpenAIAPIKey",
                            "default": "OpenAIAPIKey",
                            "description": "The name of the data",
                            "enum": ["OpenAIAPIKey"],
                            "title": "Name",
                            "type": "string",
                        },
                        "uuid": {
                            "description": "The unique identifier",
                            "format": "uuid",
                            "title": "UUID",
                            "type": "string",
                        },
                    },
                    "required": ["uuid"],
                    "title": "OpenAIAPIKeyRef",
                    "type": "object",
                }
            },
            "properties": {
                "name": {
                    "default": "",
                    "description": "The name of the model",
                    "title": "Name",
                    "type": "string",
                },
                "model": {
                    "default": "gpt-3.5-turbo",
                    "description": "The model to use for the OpenAI API, e.g. 'gpt-3.5-turbo'",
                    "enum": ["gpt-4", "gpt-3.5-turbo"],
                    "title": "Model",
                    "type": "string",
                },
                "api_key": {"$ref": "#/$defs/OpenAIAPIKeyRef"},
                "base_url": {
                    "default": "https://api.openai.com/v1",
                    "description": "The base URL of the OpenAI API",
                    "format": "uri",
                    "maxLength": 2083,
                    "minLength": 1,
                    "title": "Base Url",
                    "type": "string",
                },
                "api_type": {
                    "const": "openai",
                    "default": "openai",
                    "description": "The type of the API, must be 'openai'",
                    "enum": ["openai"],
                    "title": "API Type",
                    "type": "string",
                },
            },
            "required": ["api_key"],
            "title": "OpenAI",
            "type": "object",
        }
        assert schema == expected


class TestOpenAIAPIKey:
    def test_constructor_success(self) -> None:
        api_key = OpenAIAPIKey(
            api_key="sk-sUeBP9asw6GiYHXqtg70T3BlbkFJJuLwJFco90bOpU0Ntest"  # pragma: allowlist secret
        )  # pragma: allowlist secret
        assert (
            api_key.api_key
            == "sk-sUeBP9asw6GiYHXqtg70T3BlbkFJJuLwJFco90bOpU0Ntest"  # pragma: allowlist secret
        )  # pragma: allowlist secret

    def test_constructor_failure(self) -> None:
        with pytest.raises(ValueError, match="String should match pattern"):
            OpenAIAPIKey(
                api_key="_sk-sUeBP9asw6GiYHXqtg70T3BlbkFJJuLwJFco90bOpU0Ntest"  # pragma: allowlist secret
            )  # pragma: allowlist secret
