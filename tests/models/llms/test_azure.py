import uuid
from typing import Any, Dict

import pytest

from fastagency.helpers import get_model_by_ref
from fastagency.models.base import ObjectReference
from fastagency.models.llms.azure import AzureOAI, AzureOAIAPIKey

from .test_end2end import end2end_simple_chat_with_two_agents


def test_import(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("AZURE_OAI_API_KEY", raising=False)

    from fastagency.models.llms.azure import AzureOAI, AzureOAIAPIKey

    assert AzureOAI is not None
    assert AzureOAIAPIKey is not None


class TestAzureOAIAPIKey:
    @pytest.mark.asyncio()
    @pytest.mark.db()
    async def test_azure_api_key_model_create_autogen(
        self,
        azure_oai_key_ref: ObjectReference,
        user_uuid: str,
    ) -> None:
        model = await get_model_by_ref(azure_oai_key_ref)
        assert isinstance(model, AzureOAIAPIKey)

        # Call create_autogen
        actual_api_key = await AzureOAIAPIKey.create_autogen(
            model_id=azure_oai_key_ref.uuid,
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(actual_api_key, str)


class TestAzureOAI:
    @pytest.mark.db()
    @pytest.mark.asyncio()
    async def test_azure_constructor(self, azure_oai_ref: ObjectReference) -> None:
        # create data
        model = await get_model_by_ref(azure_oai_ref)
        assert isinstance(model, AzureOAI)

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
        assert (
            actual_llm_config["config_list"][0]
            == azure_gpt35_turbo_16k_llm_config["config_list"][0]
        )
        assert actual_llm_config == azure_gpt35_turbo_16k_llm_config

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.azure_oai()
    async def test_end2end(
        self,
        user_uuid: str,
        azure_oai_ref: ObjectReference,
    ) -> None:
        await end2end_simple_chat_with_two_agents(
            llm_ref=azure_oai_ref, user_uuid=user_uuid
        )
