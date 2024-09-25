import uuid

import pytest
from pydantic import ValidationError

from fastagency_studio.helpers import create_autogen
from fastagency_studio.models.agents.assistant import AssistantAgent
from fastagency_studio.models.agents.web_surfer import WebSurferAgent
from fastagency_studio.models.base import Model, ObjectReference
from fastagency_studio.models.llms.azure import AzureOAI
from fastagency_studio.models.llms.openai import OpenAI
from fastagency_studio.models.teams.two_agent_teams import TwoAgentTeam
from tests.helpers import get_by_tag, parametrize_fixtures


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

    def test_two_agents_team_schema(self) -> None:
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
                "UserProxyAgentRef": {
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
                            "const": "UserProxyAgent",
                            "default": "UserProxyAgent",
                            "description": "The name of the data",
                            "enum": ["UserProxyAgent"],
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
                    "title": "UserProxyAgentRef",
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
                    "description": "The name of the item",
                    "minLength": 1,
                    "title": "Name",
                    "type": "string",
                },
                "is_termination_msg_regex": {
                    "default": "TERMINATE",
                    "description": "Whether the message is a termination message or not. If it is a termination message, the chat will terminate.",
                    "metadata": {
                        "tooltip_message": "The termination message regular expression format. The LLM uses this pattern to decide when to end the chat if the message matches."
                    },
                    "title": "Is Termination Msg Regex",
                    "type": "string",
                },
                "human_input_mode": {
                    "default": "ALWAYS",
                    "description": "Mode for human input",
                    "enum": ["ALWAYS", "TERMINATE", "NEVER"],
                    "metadata": {
                        "tooltip_message": "Select the human input mode to control the level of human involvement. Modes include NEVER (full autonomy), TERMINATE (human input requested upon termination), and ALWAYS (input required after every message)."
                    },
                    "title": "Human Input Mode",
                    "type": "string",
                },
                "initial_agent": {
                    "anyOf": [
                        {"$ref": "#/$defs/AssistantAgentRef"},
                        {"$ref": "#/$defs/UserProxyAgentRef"},
                        {"$ref": "#/$defs/WebSurferAgentRef"},
                    ],
                    "description": "Agent that starts the conversation",
                    "metadata": {
                        "tooltip_message": "Select the Initial Agent, the agent responsible for task orchestration. It interacts with users and assigns tasks to Secondary Agent, enhancing the efficiency of complex operations."
                    },
                    "title": "Initial Agent",
                },
                "secondary_agent": {
                    "anyOf": [
                        {"$ref": "#/$defs/AssistantAgentRef"},
                        {"$ref": "#/$defs/UserProxyAgentRef"},
                        {"$ref": "#/$defs/WebSurferAgentRef"},
                    ],
                    "description": "Agent that continues the conversation",
                    "metadata": {
                        "tooltip_message": "Select the Secondary Agent, the agent responsible for collaborating with the Initial Agent in performing specialized tasks. Secondary Agents enhance efficiency by focusing on specific roles, such as data analysis or code execution."
                    },
                    "title": "Secondary Agent",
                },
            },
            "required": ["name", "initial_agent", "secondary_agent"],
            "title": "TwoAgentTeam",
            "type": "object",
        }
        # print(schema)
        assert schema == expected


@pytest.mark.db
@pytest.mark.llm
class TestTwoAgentTeamSimpleChat:
    @pytest.mark.asyncio
    @parametrize_fixtures("team_ref", get_by_tag("team", "noapi"))
    async def test_simple_chat(
        self,
        user_uuid: str,
        team_ref: ObjectReference,
    ) -> None:
        # print(f"test_simple_chat: {team_ref=}")

        ag_team = await create_autogen(
            model_ref=team_ref,
            user_uuid=user_uuid,
        )

        assert ag_team
        history = ag_team.initiate_chat("What is 2 + 2?")
        messages = (msg["content"] for msg in history.chat_history)
        assert sum("TERMINATE" in msg for msg in messages) == 1

    @pytest.mark.asyncio
    @parametrize_fixtures("team_ref", get_by_tag("team", "weather"))
    async def test_chat_with_weatherapi(
        self,
        user_uuid: str,
        team_ref: ObjectReference,
    ) -> None:
        # print(f"test_simple_chat: {team_ref=}")

        ag_team = await create_autogen(
            model_ref=team_ref,
            user_uuid=user_uuid,
        )

        assert ag_team
        history = ag_team.initiate_chat("What is the weather in New York?")
        # print(f"history: {history=}")
        assert any(
            "sunny" in msg["content"]
            for msg in history.chat_history
            if "content" in msg and msg["content"] is not None
        )
        assert (
            sum(
                "TERMINATE" in msg["content"]
                for msg in history.chat_history
                if "content" in msg and msg["content"] is not None
            )
            == 1
        )
