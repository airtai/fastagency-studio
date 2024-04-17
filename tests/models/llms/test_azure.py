import uuid

from pydantic_core import Url

from fastagency.models.llms._azure import AzureOAI


class TestAzureOAI:
    def test_constructor(self) -> None:
        llm_uuid = uuid.uuid4()
        model = AzureOAI(
            api_key="sk-1234567890abcdef1234567890abcdef",  # pragma: allowlist secret
            uuid=llm_uuid,
            base_url="https://my-model.openai.azure.com/",
        )
        expected = {
            "model": "gpt-3.5-turbo",
            "api_key": "sk-1234567890abcdef1234567890abcdef",  # pragma: allowlist secret
            "base_url": Url("https://my-model.openai.azure.com/"),
            "api_type": "azure",
            "api_version": "latest",  # "latest" is the default value for "api_version
            "uuid": llm_uuid,
        }
        assert model.model_dump() == expected

    def test_openai_model_schema(self) -> None:
        schema = AzureOAI.model_json_schema()
        expected = {
            "properties": {
                "uuid": {
                    "description": "The unique identifier",
                    "format": "uuid",
                    "title": "UUID",
                    "type": "string",
                },
                "model": {
                    "default": "gpt-3.5-turbo",
                    "description": "The model to use for the Azure OpenAI API, e.g. 'gpt-3.5-turbo'",
                    "title": "Model",
                    "type": "string",
                },
                "api_key": {
                    "description": "The API key for the Azure OpenAI API, e.g. 'sk-1234567890abcdef1234567890abcdef'",
                    "title": "API Key",
                    "type": "string",
                },
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
                    "default": "latest",
                    "description": "The version of the Azure OpenAI API, e.g. '2024-02-15-preview' or 'latest",
                    "enum": ["2024-02-15-preview", "latest"],
                    "title": "Api Version",
                    "type": "string",
                },
            },
            "required": ["uuid", "api_key"],
            "title": "AzureOAI",
            "type": "object",
        }
        assert schema == expected
