import uuid

import pytest
from fastagency.helpers import get_model_by_ref
from fastagency.models.base import ObjectReference
from fastagency.models.llms.openai import OpenAI, OpenAIAPIKey

from tests.helpers import get_by_tag, parametrize_fixtures


def test_import(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)

    from fastagency.models.llms.openai import OpenAI, OpenAIAPIKey

    assert OpenAI is not None
    assert OpenAIAPIKey is not None


class TestOpenAIAPIKey:
    def test_constructor_success(self) -> None:
        api_key = OpenAIAPIKey(
            api_key="sk-sUeBP9asw6GiYHXqtg70T3BlbkFJJuLwJFco90bOpU0Ntest",  # pragma: allowlist secret
            name="Hello World!",
        )  # pragma: allowlist secret
        assert (
            api_key.api_key
            == "sk-sUeBP9asw6GiYHXqtg70T3BlbkFJJuLwJFco90bOpU0Ntest"  # pragma: allowlist secret
        )  # pragma: allowlist secret

    def test_constructor_failure(self) -> None:
        with pytest.raises(ValueError, match="Invalid OpenAI API Key"):
            OpenAIAPIKey(
                api_key="_sk-sUeBP9asw6GiYHXqtg70T3BlbkFJJuLwJFco90bOpU0Ntest",  # pragma: allowlist secret
                name="Hello World!",
            )  # pragma: allowlist secret


class TestOpenAI:
    @pytest.mark.db()
    @pytest.mark.asyncio()
    @parametrize_fixtures("openai_oai_ref", get_by_tag("openai-llm"))
    async def test_openai_constructor(self, openai_oai_ref: ObjectReference) -> None:
        # create data
        model = await get_model_by_ref(openai_oai_ref)
        assert isinstance(model, OpenAI)

        # dynamically created data
        name = model.name
        api_key_uuid = model.api_key.uuid  # type: ignore [attr-defined]

        expected = {
            "name": name,
            "model": model.model,
            "api_key": {
                "type": "secret",
                "name": "OpenAIAPIKey",
                "uuid": api_key_uuid,
            },
            "base_url": "https://api.openai.com/v1",
            "api_type": "openai",
            "temperature": 0.8,
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
                    "description": "The name of the item",
                    "minLength": 1,
                    "title": "Name",
                    "type": "string",
                },
                "model": {
                    "default": "gpt-3.5-turbo",
                    "description": "The model to use for the OpenAI API, e.g. 'gpt-3.5-turbo'",
                    "enum": [
                        "gpt-4o",
                        "gpt-4-turbo",
                        "gpt-4",
                        "gpt-3.5-turbo",
                        "gpt-4o-2024-05-13",
                        "gpt-4-32k",
                        "gpt-4-turbo-2024-04-09",
                        "gpt-4-turbo-preview",
                        "gpt-4-0125-preview",
                        "gpt-4-1106-preview",
                        "gpt-4-vision-preview",
                        "gpt-4-1106-vision-preview",
                        "gpt-4-0613",
                        "gpt-4-32k-0613",
                        "gpt-3.5-turbo-0125",
                        "gpt-3.5-turbo-1106",
                    ],
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
                "temperature": {
                    "default": 0.8,
                    "description": "The temperature to use for the model, must be between 0 and 2",
                    "minimum": 0.0,
                    "maximum": 2.0,
                    "title": "Temperature",
                    "type": "number",
                },
            },
            "required": ["name", "api_key"],
            "title": "OpenAI",
            "type": "object",
        }
        assert schema == expected

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @parametrize_fixtures("openai_oai_ref", get_by_tag("openai-llm"))
    async def test_openai_model_create_autogen(
        self,
        user_uuid: str,
        openai_oai_ref: ObjectReference,
    ) -> None:
        actual_llm_config = await OpenAI.create_autogen(
            model_id=openai_oai_ref.uuid,
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(actual_llm_config, dict)
        api_key = actual_llm_config["config_list"][0]["api_key"]
        model = actual_llm_config["config_list"][0]["model"]
        expected = {
            "config_list": [
                {
                    "model": model,
                    "api_key": api_key,
                    "base_url": "https://api.openai.com/v1",
                    "api_type": "openai",
                }
            ],
            "temperature": 0.8,
        }

        assert actual_llm_config == expected
