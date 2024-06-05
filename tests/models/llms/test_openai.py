import uuid
from typing import Any, Dict

import pytest
from pydantic_core import Url

from fastagency.app import add_model
from fastagency.models.base import Model
from fastagency.models.llms.openai import OpenAI, OpenAIAPIKey


class TestOpenAI:
    def test_openai_model(self) -> None:
        api_key_uuid = uuid.uuid4()
        OpenAIAPIKeyRef = OpenAIAPIKey.get_reference_model()  # noqa: N806
        api_key = OpenAIAPIKeyRef(uuid=api_key_uuid)

        model = OpenAI(
            api_key=api_key,
            name="Hello World!",
        )
        expected = {
            "name": "Hello World!",
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
                    "description": "The name of the item",
                    "minLength": 1,
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
            "required": ["name", "api_key"],
            "title": "OpenAI",
            "type": "object",
        }
        assert schema == expected

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.parametrize("llm_model,api_key_model", [(OpenAI, OpenAIAPIKey)])  # noqa: PT006
    async def test_openai_model_create_autogen(
        self,
        llm_model: Model,
        api_key_model: Model,
        llm_config: Dict[str, Any],
        user_uuid: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        dummy_openai_api_key = "sk-sUeBP9asw6GiYHXqtg70T3BlbkFJJuLwJFco90bOpU0Ntest"  # pragma: allowlist secret

        # Add secret, llm to database
        api_key = api_key_model(  # type: ignore [operator]
            api_key=dummy_openai_api_key,
            name="api_key_model_name",
        )
        api_key_model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="secret",
            model_name=api_key_model.__name__,  # type: ignore [attr-defined]
            model_uuid=api_key_model_uuid,
            model=api_key.model_dump(),
        )

        llm = llm_model(  # type: ignore [operator]
            name="llm_model_name",
            model="gpt-3.5-turbo",
            api_key=api_key.get_reference_model()(uuid=api_key_model_uuid),
        )
        llm_model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="llm",
            model_name=llm_model.__name__,  # type: ignore [attr-defined]
            model_uuid=llm_model_uuid,
            model=llm.model_dump(),
        )

        # Monkeypatch api_key and call create_autogen
        async def my_create_autogen(cls, model_id, user_id) -> Any:  # type: ignore [no-untyped-def]
            return api_key.api_key

        monkeypatch.setattr(OpenAIAPIKey, "create_autogen", my_create_autogen)

        actual_llm_config = await OpenAI.create_autogen(
            model_id=uuid.UUID(llm_model_uuid),
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(actual_llm_config, dict)
        expected = {
            "config_list": [
                {
                    "model": "gpt-3.5-turbo",
                    "api_key": dummy_openai_api_key,
                    "base_url": "https://api.openai.com/v1",
                    "api_type": "openai",
                }
            ],
            "temperature": 0,
        }

        assert actual_llm_config == expected


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
        with pytest.raises(ValueError, match="String should match pattern"):
            OpenAIAPIKey(
                api_key="_sk-sUeBP9asw6GiYHXqtg70T3BlbkFJJuLwJFco90bOpU0Ntest",  # pragma: allowlist secret
                name="Hello World!",
            )  # pragma: allowlist secret

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.parametrize("api_key_model", [(OpenAIAPIKey)])
    async def test_openai_api_key_model_create_autogen(
        self,
        api_key_model: Model,
        llm_config: Dict[str, Any],
        user_uuid: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        dummy_openai_api_key = "sk-sUeBP9asw6GiYHXqtg70T3BlbkFJJuLwJFco90bOpU0Ntest"  # pragma: allowlist secret

        # Add secret to database
        api_key = api_key_model(  # type: ignore [operator]
            api_key=dummy_openai_api_key,
            name="api_key_model_name",
        )
        api_key_model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="secret",
            model_name=api_key_model.__name__,  # type: ignore [attr-defined]
            model_uuid=api_key_model_uuid,
            model=api_key.model_dump(),
        )

        # Call create_autogen
        actual_api_key = await OpenAIAPIKey.create_autogen(
            model_id=uuid.UUID(api_key_model_uuid),
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(actual_api_key, str)
        assert actual_api_key == api_key.api_key
