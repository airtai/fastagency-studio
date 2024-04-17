import uuid

from pydantic_core import Url

from fastagency.models.llms._openai import OpenAI


class TestOpenAI:
    def test_openai_model(self) -> None:
        llm_uuid = uuid.uuid4()
        model = OpenAI(
            api_key="sk-1234567890abcdef1234567890abcdef",  # pragma: allowlist secret
            uuid=llm_uuid,
        )
        expected = {
            "model": "gpt-3.5-turbo",
            "api_key": "sk-1234567890abcdef1234567890abcdef",  # pragma: allowlist secret
            "base_url": Url("https://api.openai.com/v1"),
            "api_type": "openai",
            "uuid": llm_uuid,
        }
        assert model.model_dump() == expected

    def test_openai_model_schema(self) -> None:
        schema = OpenAI.model_json_schema()
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
                    "description": "The model to use for the OpenAI API, e.g. 'gpt-3.5-turbo'",
                    "enum": ["gpt-4", "gpt-3.5-turbo"],
                    "title": "Model",
                    "type": "string",
                },
                "api_key": {
                    "description": "The API key for the OpenAI API, e.g. 'sk-1234567890abcdef1234567890abcdef'",
                    "title": "API Key",
                    "type": "string",
                },
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
            "required": ["uuid", "api_key"],
            "title": "OpenAI",
            "type": "object",
        }
        assert schema == expected
