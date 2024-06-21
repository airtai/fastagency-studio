import os
import uuid
from typing import Any, Dict

import pytest
from fastapi import BackgroundTasks

from fastagency.app import add_model
from fastagency.helpers import get_model_by_ref
from fastagency.models.base import Model, ObjectReference
from fastagency.models.llms.azure import AzureOAI, AzureOAIAPIKey


class TestAzureOAI:
    @pytest.mark.db()
    @pytest.mark.asyncio()
    async def test_azure_constructor(self, azure_oai_ref: ObjectReference) -> None:
        # create data
        model = await get_model_by_ref(azure_oai_ref)

        # dynamically created data
        name = model.name
        api_key_uuid = model.api_key.uuid  # type: ignore [attr-defined]
        base_url = model.base_url  # type: ignore [attr-defined]

        expected = {
            "name": name,
            "model": "gpt-35-turbo-16k",
            "api_key": {
                "type": "secret",
                "name": "AzureOAIAPIKey",
                "uuid": api_key_uuid,
            },
            "base_url": base_url,
            "api_type": "azure",
            "api_version": "2024-02-01",
            "temperature": 0.8,
        }
        assert model.model_dump() == expected

    def test_azure_model_schema(self) -> None:
        schema = AzureOAI.model_json_schema()
        expected = {
            "$defs": {
                "AzureOAIAPIKeyRef": {
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
                            "const": "AzureOAIAPIKey",
                            "default": "AzureOAIAPIKey",
                            "description": "The name of the data",
                            "enum": ["AzureOAIAPIKey"],
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
                    "title": "AzureOAIAPIKeyRef",
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
                    "description": "The model to use for the Azure OpenAI API, e.g. 'gpt-3.5-turbo'",
                    "title": "Model",
                    "type": "string",
                },
                "api_key": {"$ref": "#/$defs/AzureOAIAPIKeyRef"},
                "base_url": {
                    "default": "https://api.openai.com/v1",
                    "description": "The base URL of the Azure OpenAI API",
                    "format": "uri",
                    "maxLength": 2083,
                    "minLength": 1,
                    "title": "Base Url",
                    "type": "string",
                },
                "api_type": {
                    "const": "azure",
                    "default": "azure",
                    "description": "The type of the API, must be 'azure'",
                    "enum": ["azure"],
                    "title": "API type",
                    "type": "string",
                },
                "api_version": {
                    "default": "2024-02-01",
                    "description": "The version of the Azure OpenAI API, e.g. '2024-02-01'",
                    "enum": [
                        "2023-05-15",
                        "2023-06-01-preview",
                        "2023-10-01-preview",
                        "2024-02-15-preview",
                        "2024-03-01-preview",
                        "2024-04-01-preview",
                        "2024-05-01-preview",
                        "2024-02-01",
                    ],
                    "title": "Api Version",
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
            "title": "AzureOAI",
            "type": "object",
        }
        assert schema == expected

    @pytest.mark.asyncio()
    @pytest.mark.db()
    async def test_azure_model_create_autogen(
        self,
        user_uuid: str,
        azure_oai_ref: ObjectReference,
        azure_gpt35_turbo_16k_llm_config: Dict[str, Any],
    ) -> None:
        actual_llm_config = await AzureOAI.create_autogen(
            model_id=azure_oai_ref.uuid,
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(actual_llm_config, dict)
        assert actual_llm_config == azure_gpt35_turbo_16k_llm_config

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.parametrize("llm_model,api_key_model", [(AzureOAI, AzureOAIAPIKey)])  # noqa: PT006
    async def test_azure_model_create_autogen_old(
        self,
        llm_model: Model,
        api_key_model: Model,
        azure_gpt35_turbo_16k_llm_config: Dict[str, Any],
        user_uuid: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        # Add secret, llm to database
        api_key = api_key_model(  # type: ignore [operator]
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
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
            model=os.getenv("AZURE_GPT35_MODEL"),
            api_key=api_key.get_reference_model()(uuid=api_key_model_uuid),
            base_url=os.getenv("AZURE_API_ENDPOINT"),
            api_version=os.getenv("AZURE_API_VERSION"),
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

        async def my_create_autogen(cls, model_id, user_id) -> Any:  # type: ignore [no-untyped-def]
            return api_key.api_key

        # Monkeypatch api_key and call create_autogen
        monkeypatch.setattr(AzureOAIAPIKey, "create_autogen", my_create_autogen)

        actual_llm_config = await AzureOAI.create_autogen(
            model_id=uuid.UUID(llm_model_uuid),
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(actual_llm_config, dict)
        assert actual_llm_config == azure_gpt35_turbo_16k_llm_config


class TestAzureOAIAPIKey:
    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.parametrize("api_key_model", [(AzureOAIAPIKey)])
    async def test_azure_api_key_model_create_autogen(
        self,
        api_key_model: Model,
        azure_gpt35_turbo_16k_llm_config: Dict[str, Any],
        user_uuid: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        # Add secret to database
        api_key = api_key_model(  # type: ignore [operator]
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
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
        actual_api_key = await AzureOAIAPIKey.create_autogen(
            model_id=uuid.UUID(api_key_model_uuid),
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(actual_api_key, str)
        assert actual_api_key == api_key.api_key
