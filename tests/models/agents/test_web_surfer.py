import os
import uuid
from typing import Any, Dict

import autogen.agentchat.contrib.web_surfer
import pytest
from pydantic import ValidationError

from fastagency.app import add_model
from fastagency.models.agents.web_surfer import BingAPIKey, WebSurferAgent
from fastagency.models.base import Model
from fastagency.models.llms.azure import AzureOAI, AzureOAIAPIKey
from fastagency.models.llms.openai import OpenAI


class TestWebSurferAgent:
    @pytest.mark.parametrize("llm_model", [OpenAI, AzureOAI])
    def test_assistant_constructor(self, llm_model: Model) -> None:
        llm_uuid = uuid.uuid4()
        llm = llm_model.get_reference_model()(uuid=llm_uuid)

        summarizer_llm_uuid = uuid.uuid4()
        summarizer_llm = llm_model.get_reference_model()(uuid=summarizer_llm_uuid)

        try:
            web_surfer = WebSurferAgent(
                name="WebSurferAgent",
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
                "ToolboxRef": {
                    "properties": {
                        "type": {
                            "const": "toolbox",
                            "default": "toolbox",
                            "description": "The name of the type of the data",
                            "enum": ["toolbox"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "Toolbox",
                            "default": "Toolbox",
                            "description": "The name of the data",
                            "enum": ["Toolbox"],
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
                    "title": "ToolboxRef",
                    "type": "object",
                },
            },
            "properties": {
                "name": {
                    "description": "The name of the item",
                    "minLength": 1,
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
                "toolbox_1": {
                    "anyOf": [{"$ref": "#/$defs/ToolboxRef"}, {"type": "null"}],
                    "default": None,
                    "description": "Toolbox used by the agent for producing responses",
                    "title": "Toolbox",
                },
                "toolbox_2": {
                    "anyOf": [{"$ref": "#/$defs/ToolboxRef"}, {"type": "null"}],
                    "default": None,
                    "description": "Toolbox used by the agent for producing responses",
                    "title": "Toolbox",
                },
                "toolbox_3": {
                    "anyOf": [{"$ref": "#/$defs/ToolboxRef"}, {"type": "null"}],
                    "default": None,
                    "description": "Toolbox used by the agent for producing responses",
                    "title": "Toolbox",
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
            "required": ["name", "llm", "summarizer_llm"],
            "title": "WebSurferAgent",
            "type": "object",
        }
        assert schema == expected

    @pytest.mark.parametrize("llm_model", [OpenAI, AzureOAI])
    def test_websurfer_model_validation(self, llm_model: Model) -> None:
        llm_uuid = uuid.uuid4()
        llm = llm_model.get_reference_model()(uuid=llm_uuid)

        summarizer_llm_uuid = uuid.uuid4()
        summarizer_llm = llm_model.get_reference_model()(uuid=summarizer_llm_uuid)

        web_surfer = WebSurferAgent(
            name="WebSurferAgent",
            llm=llm,
            summarizer_llm=summarizer_llm,
        )

        web_surfer_json = web_surfer.model_dump_json()
        # print(f"{agent_json=}")
        assert web_surfer_json is not None

        validated_agent = WebSurferAgent.model_validate_json(web_surfer_json)
        # print(f"{validated_agent=}")
        assert validated_agent is not None
        assert validated_agent == web_surfer

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.parametrize("llm_model,api_key_model", [(AzureOAI, AzureOAIAPIKey)])  # noqa: PT006
    async def test_web_surfer_model_create_autogen(
        self,
        llm_model: Model,
        api_key_model: Model,
        llm_config: Dict[str, Any],
        user_uuid: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        # Add secret, llm, agent to database
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

        web_surfer_model = WebSurferAgent(
            name="WebSurferAgent",
            llm=llm.get_reference_model()(uuid=llm_model_uuid),
            summarizer_llm=llm.get_reference_model()(uuid=llm_model_uuid),
        )
        web_surfer_model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="agent",
            model_name=WebSurferAgent.__name__,
            model_uuid=web_surfer_model_uuid,
            model=web_surfer_model.model_dump(),
        )

        async def my_create_autogen(cls, model_id, user_id) -> Dict[str, Any]:  # type: ignore [no-untyped-def]
            return llm_config

        # Monkeypatch llm and call create_autogen
        monkeypatch.setattr(AzureOAI, "create_autogen", my_create_autogen)

        agent, functions = await WebSurferAgent.create_autogen(
            model_id=uuid.UUID(web_surfer_model_uuid),
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(agent, autogen.agentchat.contrib.web_surfer.WebSurferAgent)
        assert functions == []


class TestBingAPIKey:
    @pytest.mark.asyncio()
    @pytest.mark.db()
    async def test_bing_api_key_model_create_autogen(
        self,
        llm_config: Dict[str, Any],
        user_uuid: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        # Add secret to database
        api_key = BingAPIKey(  # type: ignore [operator]
            api_key="dummy_bing_api_key",  # pragma: allowlist secret
            name="api_key_model_name",
        )
        api_key_model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="secret",
            model_name=BingAPIKey.__name__,  # type: ignore [attr-defined]
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
