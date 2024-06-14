import uuid
from typing import Any, Dict

import pytest
from fastapi import BackgroundTasks
from pydantic_core import Url

from fastagency.app import add_model
from fastagency.models.base import Model
from fastagency.models.llms.together import TogetherAI, TogetherAIAPIKey


class TestTogetherAI:
    def test_togetherai_model(self) -> None:
        api_key_uuid = uuid.uuid4()
        OpenAIAPIKeyRef = TogetherAIAPIKey.get_reference_model()  # noqa: N806
        api_key = OpenAIAPIKeyRef(uuid=api_key_uuid)

        model = TogetherAI(
            api_key=api_key,
            name="Hello Together!",
        )
        expected = {
            "name": "Hello Together!",
            "model": "Meta Llama 3 70B Chat",
            "api_key": {
                "type": "secret",
                "name": "TogetherAIAPIKey",
                "uuid": api_key_uuid,
            },
            "base_url": Url("https://api.together.xyz/v1"),
            "api_type": "togetherai",
            "temperature": 0.8,
        }
        assert model.model_dump() == expected

    def test_togetherai_schema(self) -> None:
        schema = TogetherAI.model_json_schema()
        expected = {
            "$defs": {
                "TogetherAIAPIKeyRef": {
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
                            "const": "TogetherAIAPIKey",
                            "default": "TogetherAIAPIKey",
                            "description": "The name of the data",
                            "enum": ["TogetherAIAPIKey"],
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
                    "title": "TogetherAIAPIKeyRef",
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
                    "default": "Meta Llama 3 70B Chat",
                    "description": "The model to use for the Together API",
                    #     "enum": [
                    #         "Meta Llama 3 70B Chat",
                    #         ...
                    #     ],
                    "title": "Model",
                    "type": "string",
                },
                "api_key": {"$ref": "#/$defs/TogetherAIAPIKeyRef"},
                "base_url": {
                    "default": "https://api.together.xyz/v1",
                    "description": "The base URL of the OpenAI API",
                    "format": "uri",
                    "maxLength": 2083,
                    "minLength": 1,
                    "title": "Base Url",
                    "type": "string",
                },
                "api_type": {
                    "const": "togetherai",
                    "default": "togetherai",
                    "description": "The type of the API, must be 'togetherai'",
                    "enum": ["togetherai"],
                    "title": "API Type",
                    "type": "string",
                },
                "temperature": {
                    "default": 0.8,
                    "description": "The temperature to use for the model, must be between 0 and 2",
                    "maximum": 2.0,
                    "minimum": 0.0,
                    "title": "Temperature",
                    "type": "number",
                },
            },
            "required": ["name", "api_key"],
            "title": "TogetherAI",
            "type": "object",
        }
        assert "Meta Llama 3 70B Chat" in schema["properties"]["model"]["enum"]
        schema["properties"]["model"].pop("enum")
        assert schema == expected

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.parametrize(
        ("llm_model", "api_key_model"), [(TogetherAI, TogetherAIAPIKey)]
    )
    async def test_togetherai_model_create_autogen(
        self,
        llm_model: Model,
        api_key_model: Model,
        llm_config: Dict[str, Any],
        user_uuid: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        dummy_togetherai_api_key = "*" * 64  # pragma: allowlist secret

        # Add secret, llm to database
        api_key = api_key_model(  # type: ignore [operator]
            api_key=dummy_togetherai_api_key,
            name="api_key_model_name",
        )
        api_key_model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="secret",
            model_name=api_key_model.__name__,  # type: ignore [attr-defined]
            model_uuid=api_key_model_uuid,
            model=api_key.model_dump(),
            background_tasks=BackgroundTasks(),
        )

        llm = llm_model(  # type: ignore [operator]
            name="llm_model_name",
            model="Meta Llama 3 70B Chat",
            api_key=api_key.get_reference_model()(uuid=api_key_model_uuid),
        )
        llm_model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="llm",
            model_name=llm_model.__name__,  # type: ignore [attr-defined]
            model_uuid=llm_model_uuid,
            model=llm.model_dump(),
            background_tasks=BackgroundTasks(),
        )

        # Monkeypatch api_key and call create_autogen
        async def my_create_autogen(cls, model_id, user_id) -> Any:  # type: ignore [no-untyped-def]
            return api_key.api_key

        monkeypatch.setattr(TogetherAIAPIKey, "create_autogen", my_create_autogen)

        actual_llm_config = await TogetherAI.create_autogen(
            model_id=uuid.UUID(llm_model_uuid),
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(actual_llm_config, dict)
        expected = {
            "config_list": [
                {
                    "model": "meta-llama/Llama-3-70b-chat-hf",
                    "api_key": dummy_togetherai_api_key,
                    "base_url": "https://api.together.xyz/v1",
                    "api_type": "togetherai",
                }
            ],
            "temperature": 0.8,
        }
        assert actual_llm_config == expected


class TestTogetherAIAPIKey:
    def test_constructor_success(self) -> None:
        api_key = TogetherAIAPIKey(
            api_key="*" * 64,  # pragma: allowlist secret
            name="Hello World!",
        )  # pragma: allowlist secret
        assert (
            api_key.api_key == "*" * 64  # pragma: allowlist secret
        )  # pragma: allowlist secret

    def test_constructor_failure(self) -> None:
        with pytest.raises(
            ValueError, match="String should have at least 64 characters"
        ):
            TogetherAIAPIKey(
                api_key="not a proper key",  # pragma: allowlist secret
                name="Hello World!",
            )  # pragma: allowlist secret

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.parametrize("api_key_model", [(TogetherAIAPIKey)])
    async def test_togetherai_api_key_model_create_autogen(
        self,
        api_key_model: Model,
        llm_config: Dict[str, Any],
        user_uuid: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        dummy_togetherai_api_key = "*" * 64  # pragma: allowlist secret

        # Add secret to database
        api_key = api_key_model(  # type: ignore [operator]
            api_key=dummy_togetherai_api_key,
            name="api_key_model_name",
        )
        api_key_model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="secret",
            model_name=api_key_model.__name__,  # type: ignore [attr-defined]
            model_uuid=api_key_model_uuid,
            model=api_key.model_dump(),
            background_tasks=BackgroundTasks(),
        )

        # Call create_autogen
        actual_api_key = await TogetherAIAPIKey.create_autogen(
            model_id=uuid.UUID(api_key_model_uuid),
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(actual_api_key, str)
        assert actual_api_key == api_key.api_key
