import uuid

import pytest
from pydantic import ValidationError

from fastagency.models.agents.assistant import AssistantAgent
from fastagency.models.base import Model
from fastagency.models.llms.azure import AzureOAI
from fastagency.models.llms.openai import OpenAI


class TestAssistantAgent:
    def test_assistant_constructor(self) -> None:
        llm_uuid = uuid.uuid4()
        llm = OpenAI.get_reference_model()(uuid=llm_uuid)

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
            },
            "properties": {
                "name": {
                    "description": "The name of the model",
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
