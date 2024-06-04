import os
import uuid
from typing import Any, Dict

import autogen
import pytest
from pydantic import ValidationError

from fastagency.app import add_model
from fastagency.models.agents.assistant import AssistantAgent
from fastagency.models.base import Model
from fastagency.models.llms.azure import AzureOAI, AzureOAIAPIKey
from fastagency.models.llms.openai import OpenAI
from fastagency.models.toolboxes.toolbox import OpenAPIAuth, Toolbox


class TestAssistantAgent:
    @pytest.mark.parametrize("llm_model", [OpenAI, AzureOAI])
    def test_assistant_constructor(self, llm_model: Model) -> None:
        llm_uuid = uuid.uuid4()
        llm = llm_model.get_reference_model()(uuid=llm_uuid)

        try:
            agent = AssistantAgent(
                llm=llm,
                system_message="test system message",
                name="Hello World!",
            )
        except ValidationError:
            # print(f"{e.errors()=}")
            raise

        assert agent.system_message == "test system message"

    def test_assistant_model_schema(self) -> None:
        schema = AssistantAgent.model_json_schema()
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
                "system_message": {
                    "description": "The system message of the agent. This message is used to inform the agent about his role in the conversation",
                    "title": "System Message",
                    "type": "string",
                },
            },
            "required": ["name", "llm", "system_message"],
            "title": "AssistantAgent",
            "type": "object",
        }
        assert schema == expected

    @pytest.mark.parametrize("llm_model", [OpenAI, AzureOAI])
    def test_assistant_model_validation(self, llm_model: Model) -> None:
        llm_uuid = uuid.uuid4()
        llm = llm_model.get_reference_model()(uuid=llm_uuid)

        agent = AssistantAgent(
            llm=llm,
            name="My Assistant",
            system_message="test system message",
        )

        agent_json = agent.model_dump_json()
        # print(f"{agent_json=}")
        assert agent_json is not None

        validated_agent = AssistantAgent.model_validate_json(agent_json)
        # print(f"{validated_agent=}")
        assert validated_agent is not None
        assert validated_agent == agent

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.parametrize("llm_model,api_key_model", [(AzureOAI, AzureOAIAPIKey)])  # noqa: PT006
    async def test_assistant_model_create_autogen(
        self,
        llm_model: Model,
        api_key_model: Model,
        llm_config: Dict[str, Any],
        user_uuid: str,
        fastapi_openapi_url: str,
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

        # add toolbox to database
        openapi_auth = OpenAPIAuth(
            name="openapi_auth_secret",
            username="test",
            password="password",  # pragma: allowlist secret
        )
        openapi_auth_model_uuid = str(uuid.uuid4())

        await add_model(
            user_uuid=user_uuid,
            type_name="secret",
            model_name=OpenAPIAuth.__name__,  # type: ignore [attr-defined]
            model_uuid=openapi_auth_model_uuid,
            model=openapi_auth.model_dump(),
        )

        toolbox_uuid = str(uuid.uuid4())
        toolbox = Toolbox(
            name="test_toolbox_constructor",
            openapi_url=fastapi_openapi_url,
            openapi_auth=openapi_auth.get_reference_model()(
                uuid=openapi_auth_model_uuid
            ),
        )

        await add_model(
            user_uuid=user_uuid,
            type_name="toolbox",
            model_name=Toolbox.__name__,  # type: ignore [attr-defined]
            model_uuid=toolbox_uuid,
            model=toolbox.model_dump(),
        )

        # add agent to database
        weatherman_assistant_model = AssistantAgent(
            llm=llm.get_reference_model()(uuid=llm_model_uuid),
            name="Assistant",
            system_message="test system message",
            toolbox_1=toolbox.get_reference_model()(uuid=toolbox_uuid),
        )
        weatherman_assistant_model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="agent",
            model_name=AssistantAgent.__name__,
            model_uuid=weatherman_assistant_model_uuid,
            model=weatherman_assistant_model.model_dump(),
        )

        async def my_create_autogen(cls, model_id, user_id) -> Dict[str, Any]:  # type: ignore [no-untyped-def]
            return llm_config

        # Monkeypatch llm and call create_autogen
        monkeypatch.setattr(AzureOAI, "create_autogen", my_create_autogen)

        agent, functions = await AssistantAgent.create_autogen(
            model_id=uuid.UUID(weatherman_assistant_model_uuid),
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(agent, autogen.agentchat.AssistantAgent)
        assert isinstance(functions, list)
        assert len(functions) == 3
