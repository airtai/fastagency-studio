import uuid

import pytest
from pydantic import ValidationError

from fastagency.models.agents.assistant import AssistantAgent
from fastagency.models.agents.web_surfer import WebSurferAgent
from fastagency.models.base import Model
from fastagency.models.llms.azure import AzureOAI
from fastagency.models.llms.openai import OpenAI
from fastagency.models.teams.multi_agent_team import MultiAgentTeam


class TestMultiAgentTeam:
    @pytest.mark.parametrize("llm_model", [OpenAI, AzureOAI])
    def test_multi_agent_constructor(self, llm_model: Model) -> None:
        llm_uuid = uuid.uuid4()
        llm = llm_model.get_reference_model()(uuid=llm_uuid)

        summarizer_llm_uuid = uuid.uuid4()
        summarizer_llm = llm_model.get_reference_model()(uuid=summarizer_llm_uuid)

        assistant_1 = AssistantAgent(
            llm=llm, name="Assistant", system_message="test system message"
        )
        assistant_2 = AssistantAgent(
            llm=llm, name="Assistant", system_message="test system message"
        )
        web_surfer = WebSurferAgent(
            name="WebSurfer", llm=llm, summarizer_llm=summarizer_llm
        )

        assistant_1_uuid = uuid.uuid4()
        assistant_1_ref = assistant_1.get_reference_model()(uuid=assistant_1_uuid)
        assistant_2_uuid = uuid.uuid4()
        assistant_2_ref = assistant_2.get_reference_model()(uuid=assistant_2_uuid)
        web_surfer_uuid = uuid.uuid4()
        web_surfer_ref = web_surfer.get_reference_model()(uuid=web_surfer_uuid)

        try:
            team = MultiAgentTeam(
                name="MultiAgentTeam",
                agent_1=assistant_1_ref,
                agent_2=assistant_2_ref,
                web_surfer_ref=web_surfer_ref,
            )
        except ValidationError:
            # print(f"{e.errors()=}")
            raise

        assert team

    def test_multi_agent_model_schema(self) -> None:
        schema = MultiAgentTeam.model_json_schema()
        expected = {
            "$defs": {
                "AssistantAgentRef": {
                    "properties": {
                        "type": {
                            "const": "agent",
                            "default": "agent",
                            "description": "The name of the type of the data",
                            "enum": ["agent"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "AssistantAgent",
                            "default": "AssistantAgent",
                            "description": "The name of the data",
                            "enum": ["AssistantAgent"],
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
                    "title": "AssistantAgentRef",
                    "type": "object",
                },
                "WebSurferAgentRef": {
                    "properties": {
                        "type": {
                            "const": "agent",
                            "default": "agent",
                            "description": "The name of the type of the data",
                            "enum": ["agent"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "WebSurferAgent",
                            "default": "WebSurferAgent",
                            "description": "The name of the data",
                            "enum": ["WebSurferAgent"],
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
                    "title": "WebSurferAgentRef",
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
                "termination_message_regex": {
                    "default": "^TERMINATE$",
                    "description": "Whether the message is a termination message or not. If it is a termination message, the agent will not respond to it.",
                    "title": "Termination Message Regex",
                    "type": "string",
                },
                "human_input_mode": {
                    "default": "ALWAYS",
                    "description": "Mode for human input",
                    "enum": ["ALWAYS", "TERMINATE", "NEVER"],
                    "title": "Human input mode",
                    "type": "string",
                },
                "agent_1": {
                    "anyOf": [
                        {"$ref": "#/$defs/AssistantAgentRef"},
                        {"$ref": "#/$defs/WebSurferAgentRef"},
                    ],
                    "description": "An agent in the team",
                    "title": "Agents",
                },
                "agent_2": {
                    "anyOf": [
                        {"$ref": "#/$defs/AssistantAgentRef"},
                        {"$ref": "#/$defs/WebSurferAgentRef"},
                    ],
                    "description": "An agent in the team",
                    "title": "Agents",
                },
                "agent_3": {
                    "anyOf": [
                        {"$ref": "#/$defs/AssistantAgentRef"},
                        {"$ref": "#/$defs/WebSurferAgentRef"},
                        {"type": "null"},
                    ],
                    "default": None,
                    "description": "An agent in the team",
                    "title": "Agents",
                },
                "agent_4": {
                    "anyOf": [
                        {"$ref": "#/$defs/AssistantAgentRef"},
                        {"$ref": "#/$defs/WebSurferAgentRef"},
                        {"type": "null"},
                    ],
                    "default": None,
                    "description": "An agent in the team",
                    "title": "Agents",
                },
                "agent_5": {
                    "anyOf": [
                        {"$ref": "#/$defs/AssistantAgentRef"},
                        {"$ref": "#/$defs/WebSurferAgentRef"},
                        {"type": "null"},
                    ],
                    "default": None,
                    "description": "An agent in the team",
                    "title": "Agents",
                },
            },
            "required": ["name", "agent_1", "agent_2"],
            "title": "MultiAgentTeam",
            "type": "object",
        }
        # print(f"{schema=}")
        assert schema == expected

    @pytest.mark.parametrize("llm_model", [OpenAI, AzureOAI])
    def test_multi_agent_model_validation(self, llm_model: Model) -> None:
        llm_uuid = uuid.uuid4()
        llm = llm_model.get_reference_model()(uuid=llm_uuid)

        summarizer_llm_uuid = uuid.uuid4()
        summarizer_llm = llm_model.get_reference_model()(uuid=summarizer_llm_uuid)

        assistant_1 = AssistantAgent(
            llm=llm, name="Assistant", system_message="test system message"
        )
        assistant_2 = AssistantAgent(
            llm=llm, name="Assistant", system_message="test system message"
        )
        web_surfer = WebSurferAgent(
            name="WebSurfer", llm=llm, summarizer_llm=summarizer_llm
        )

        assistant_1_uuid = uuid.uuid4()
        assistant_1_ref = assistant_1.get_reference_model()(uuid=assistant_1_uuid)
        assistant_2_uuid = uuid.uuid4()
        assistant_2_ref = assistant_2.get_reference_model()(uuid=assistant_2_uuid)
        web_surfer_uuid = uuid.uuid4()
        web_surfer_ref = web_surfer.get_reference_model()(uuid=web_surfer_uuid)

        team = MultiAgentTeam(
            name="MultiAgentTeam",
            agent_1=assistant_1_ref,
            agent_2=assistant_2_ref,
            web_surfer_ref=web_surfer_ref,
        )

        team_json = team.model_dump_json()
        assert team_json is not None

        validated_team = MultiAgentTeam.model_validate_json(team_json)
        assert validated_team is not None
        assert validated_team == team
