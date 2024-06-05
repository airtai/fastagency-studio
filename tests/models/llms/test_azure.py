import os
import uuid
from typing import Any, Dict

import pytest

from fastagency.app import add_model
from fastagency.models.base import Model
from fastagency.models.llms.azure import AzureOAI, AzureOAIAPIKey


class TestAzureOAI:
    def test_azure_constructor(self) -> None:
        # create reference to key
        api_key_uuid = uuid.uuid4()

        AzureOAIAPIKeyRef = AzureOAIAPIKey.get_reference_model()  # noqa: N806
        api_key_ref = AzureOAIAPIKeyRef(uuid=api_key_uuid)

        # create data
        model = AzureOAI(
            api_key=api_key_ref,
            base_url="https://my-model.openai.azure.com",
            name="who cares?",
        )

        expected = {
            "name": "who cares?",
            "model": "gpt-3.5-turbo",
            "api_key": {
                "type": "secret",
                "name": "AzureOAIAPIKey",
                "uuid": api_key_uuid,
            },
            "base_url": "https://my-model.openai.azure.com",
            "api_type": "azure",
            "api_version": "2024-02-15-preview",
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
                    "const": "2024-02-15-preview",
                    "default": "2024-02-15-preview",
                    "description": "The version of the Azure OpenAI API, e.g. '2024-02-15-preview'",
                    "enum": ["2024-02-15-preview"],
                    "title": "Api Version",
                    "type": "string",
                },
            },
            "required": ["name", "api_key"],
            "title": "AzureOAI",
            "type": "object",
        }
        assert schema == expected

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.parametrize("llm_model,api_key_model", [(AzureOAI, AzureOAIAPIKey)])  # noqa: PT006
    async def test_azure_model_create_autogen(
        self,
        llm_model: Model,
        api_key_model: Model,
        llm_config: Dict[str, Any],
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
        assert actual_llm_config == llm_config


class TestAzureOAIAPIKey:
    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.parametrize("api_key_model", [(AzureOAIAPIKey)])
    async def test_azure_api_key_model_create_autogen(
        self,
        api_key_model: Model,
        llm_config: Dict[str, Any],
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
        )

        # Call create_autogen
        actual_api_key = await AzureOAIAPIKey.create_autogen(
            model_id=uuid.UUID(api_key_model_uuid),
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(actual_api_key, str)
        assert actual_api_key == api_key.api_key
