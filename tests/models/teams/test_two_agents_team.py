import os
import uuid

import pytest
from pydantic import ValidationError

from fastagency.models.agents.assistant import AssistantAgent
from fastagency.models.agents.web_surfer import WebSurferAgent
from fastagency.models.base import Model
from fastagency.models.llms.azure import AzureOAI, AzureOAIAPIKey
from fastagency.models.llms.openai import OpenAI, OpenAIAPIKey
from fastagency.models.teams.two_agent_teams import TwoAgentTeam
from fastagency.app import add_model


class TestTwoAgentTeam:
    @pytest.mark.parametrize("llm_model", [OpenAI, AzureOAI])
    def test_two_agent_constructor(self, llm_model: Model) -> None:
        llm_uuid = uuid.uuid4()
        llm = llm_model.get_reference_model()(uuid=llm_uuid)

        summarizer_llm_uuid = uuid.uuid4()
        summarizer_llm = llm_model.get_reference_model()(uuid=summarizer_llm_uuid)

        assistant = AssistantAgent(
            llm=llm, name="Assistant", system_message="test system message"
        )
        web_surfer = WebSurferAgent(
            name="WebSurfer", llm=llm, summarizer_llm=summarizer_llm
        )

        assistant_uuid = uuid.uuid4()
        assistant_ref = assistant.get_reference_model()(uuid=assistant_uuid)
        web_surfer_uuid = uuid.uuid4()
        web_surfer_ref = web_surfer.get_reference_model()(uuid=web_surfer_uuid)

        try:
            team = TwoAgentTeam(
                name="TwoAgentTeam",
                initial_agent=assistant_ref,
                secondary_agent=web_surfer_ref,
            )
        except ValidationError:
            # print(f"{e.errors()=}")
            raise

        assert team

    def test_two_agent_model_schema(self) -> None:
        schema = TwoAgentTeam.model_json_schema()
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
                "initial_agent": {
                    "anyOf": [
                        {"$ref": "#/$defs/AssistantAgentRef"},
                        {"$ref": "#/$defs/WebSurferAgentRef"},
                    ],
                    "description": "Agent that starts the conversation",
                    "title": "Initial agent",
                },
                "secondary_agent": {
                    "anyOf": [
                        {"$ref": "#/$defs/AssistantAgentRef"},
                        {"$ref": "#/$defs/WebSurferAgentRef"},
                    ],
                    "description": "Agent that continues the conversation",
                    "title": "Secondary agent",
                },
            },
            "required": ["name", "initial_agent", "secondary_agent"],
            "title": "TwoAgentTeam",
            "type": "object",
        }
        assert schema == expected

    @pytest.mark.parametrize("llm_model", [OpenAI, AzureOAI])
    def test_two_agent_model_validation(self, llm_model: Model) -> None:
        llm_uuid = uuid.uuid4()
        llm = llm_model.get_reference_model()(uuid=llm_uuid)

        summarizer_llm_uuid = uuid.uuid4()
        summarizer_llm = llm_model.get_reference_model()(uuid=summarizer_llm_uuid)

        assistant = AssistantAgent(
            llm=llm, name="Assistant", system_message="test system message"
        )
        web_surfer = WebSurferAgent(
            name="WebSurfer", llm=llm, summarizer_llm=summarizer_llm
        )

        assistant_uuid = uuid.uuid4()
        assistant_ref = assistant.get_reference_model()(uuid=assistant_uuid)
        web_surfer_uuid = uuid.uuid4()
        web_surfer_ref = web_surfer.get_reference_model()(uuid=web_surfer_uuid)

        team = TwoAgentTeam(
            name="TwoAgentTeam",
            initial_agent=assistant_ref,
            secondary_agent=web_surfer_ref,
        )

        team_json = team.model_dump_json()
        assert team_json is not None

        validated_team = TwoAgentTeam.model_validate_json(team_json)
        assert validated_team is not None
        assert validated_team == team

    @pytest.mark.parametrize("llm_model,api_key_model", [(OpenAI, OpenAIAPIKey), (AzureOAI, AzureOAIAPIKey)])
    def test_two_agent_team_autogen(self, llm_model: Model, api_key_model: Model, monkeypatch: pytest.MonkeyPatch) -> None:
        user_uuid = str(uuid.uuid4())

        print(os.getenv("AZURE_OPENAI_API_KEY"))
        api_key = api_key_model(api_key=os.getenv("AZURE_OPENAI_API_KEY"), name="whatever")
        api_key_model_uuid = str(uuid.uuid4())
        api_key_validated_model = add_model(
            user_uuid=user_uuid,
            type_name="secret",
            model_name=llm_model.__name__,
            model_uuid=api_key_model_uuid,
            model=api_key.model_dump(),
        )

        llm = llm_model(
            model=os.getenv("AZURE_GPT35_MODEL"),
            api_key=api_key,
            base_url=os.getenv("AZURE_API_ENDPOINT"),
            api_version=os.getenv("AZURE_API_VERSION") if llm_model == AzureOAI else "latest",
        )
        llm_model_uuid = str(uuid.uuid4())
        llm_validated_model = add_model(
            user_uuid=user_uuid,
            type_name="llm",
            model_name=llm_model.__name__,
            model_uuid=llm_model_uuid,
            model=llm.model_dump(),
        )

        assistant = AssistantAgent(
            llm=llm, name="Assistant", system_message="test system message"
        )
        assistant_model_uuid = str(uuid.uuid4())
        assistant_validated_model = add_model(
            user_uuid=user_uuid,
            type_name="agent",
            model_name=AssistantAgent.__name__,
            model_uuid=assistant_model_uuid,
            model=assistant.model_dump(),
        )


        # Add secret, llm, agent to database

        # Then create autogen agents by monkeypatching create_autogen method



        # llm_uuid = uuid.uuid4()
        # llm = llm_model.get_reference_model()(uuid=llm_uuid)

        # summarizer_llm_uuid = uuid.uuid4()
        # summarizer_llm = llm_model.get_reference_model()(uuid=summarizer_llm_uuid)

        # assistant = AssistantAgent(
        #     llm=llm, name="Assistant", system_message="test system message"
        # )
        # web_surfer = WebSurferAgent(
        #     name="WebSurfer", llm=llm, summarizer_llm=summarizer_llm
        # )

        # assistant_uuid = uuid.uuid4()
        # assistant_ref = assistant.get_reference_model()(uuid=assistant_uuid)
        # web_surfer_uuid = uuid.uuid4()
        # web_surfer_ref = web_surfer.get_reference_model()(uuid=web_surfer_uuid)

        # team = TwoAgentTeam(
        #     name="TwoAgentTeam",
        #     initial_agent=assistant_ref,
        #     secondary_agent=web_surfer_ref,
        # )

        # team_json = team.model_dump_json()
        # assert team_json is not None

        # validated_team = TwoAgentTeam.model_validate_json(team_json)
        # assert validated_team is not None
        # assert validated_team == team
