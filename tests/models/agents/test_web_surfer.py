import uuid

from pydantic import ValidationError

from fastagency.models.agents.web_surfer import WebSurferAgent
from fastagency.models.llms.openai import OpenAI


class TestWebSurferAgent:
    def test_assistant_constructor(self) -> None:
        llm_uuid = uuid.uuid4()
        llm = OpenAI.get_reference_model()(uuid=llm_uuid)

        summarizer_llm_uuid = uuid.uuid4()
        summarizer_llm = OpenAI.get_reference_model()(uuid=summarizer_llm_uuid)

        try:
            web_surfer = WebSurferAgent(
                name="",
                llm=llm,
                summarizer_llm=summarizer_llm,
            )
        except ValidationError:
            raise

        assert web_surfer

    def test_web_surfer_model_schema(self) -> None:
        schema = WebSurferAgent.model_json_schema()
        expected = {
            "$defs": {
                "AzureOAIRef": {
                    "properties": {
                        "type": {
                            "const": "llm",
                            "default": "llm",
                            "description": "The name of the type of the data",
                            "enum": ["llm"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "AzureOAI",
                            "default": "AzureOAI",
                            "description": "The name of the data",
                            "enum": ["AzureOAI"],
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
                    "title": "AzureOAIRef",
                    "type": "object",
                },
                "BingAPIKeyRef": {
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
                            "const": "BingAPIKey",
                            "default": "BingAPIKey",
                            "description": "The name of the data",
                            "enum": ["BingAPIKey"],
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
                    "title": "BingAPIKeyRef",
                    "type": "object",
                },
                "OpenAIRef": {
                    "properties": {
                        "type": {
                            "const": "llm",
                            "default": "llm",
                            "description": "The name of the type of the data",
                            "enum": ["llm"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "OpenAI",
                            "default": "OpenAI",
                            "description": "The name of the data",
                            "enum": ["OpenAI"],
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
                    "title": "OpenAIRef",
                    "type": "object",
                },
            },
            "properties": {
                "name": {
                    "default": "",
                    "description": "The name of the model",
                    "title": "Name",
                    "type": "string",
                },
                "llm": {
                    "anyOf": [
                        {"$ref": "#/$defs/AzureOAIRef"},
                        {"$ref": "#/$defs/OpenAIRef"},
                    ],
                    "description": "LLM used by the agent for producing responses",
                    "title": "LLM",
                },
                "summarizer_llm": {
                    "anyOf": [
                        {"$ref": "#/$defs/AzureOAIRef"},
                        {"$ref": "#/$defs/OpenAIRef"},
                    ],
                    "description": "This LLM will be used to generated summary of all pages visited",
                    "title": "Summarizer LLM",
                },
                "viewport_size": {
                    "default": 1080,
                    "description": "The viewport size of the browser",
                    "title": "Viewport Size",
                    "type": "integer",
                },
                "bing_api_key": {
                    "anyOf": [{"$ref": "#/$defs/BingAPIKeyRef"}, {"type": "null"}],
                    "default": None,
                    "description": "The Bing API key for the browser",
                },
            },
            "required": ["llm", "summarizer_llm"],
            "title": "WebSurferAgent",
            "type": "object",
        }
        assert schema == expected
