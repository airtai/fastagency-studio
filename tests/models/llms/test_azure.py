import uuid

from pydantic_core import Url

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
            base_url="https://my-model.openai.azure.com/",
        )

        expected = {
            "name": "",
            "model": "gpt-3.5-turbo",
            "api_key": {
                "type": "secret",
                "name": "AzureOAIAPIKey",
                "uuid": api_key_uuid,
            },
            "base_url": Url("https://my-model.openai.azure.com/"),
            "api_type": "azure",
            "api_version": "latest",
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
                    "default": "",
                    "description": "The name of the model",
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
                    "default": "latest",
                    "description": "The version of the Azure OpenAI API, e.g. '2024-02-15-preview' or 'latest",
                    "enum": ["2024-02-15-preview", "latest"],
                    "title": "Api Version",
                    "type": "string",
                },
            },
            "required": ["api_key"],
            "title": "AzureOAI",
            "type": "object",
        }
        assert schema == expected
