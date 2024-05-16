import os
import uuid
from datetime import datetime
from typing import Any, Dict
from unittest.mock import MagicMock

import autogen
import openai
import pytest
from asyncer import asyncify
from autogen.io.console import IOConsole
from pydantic import ValidationError

from fastagency.app import add_model
from fastagency.models.agents.assistant import AssistantAgent
from fastagency.models.agents.user_proxy import UserProxyAgent
from fastagency.models.agents.web_surfer import WebSurferAgent
from fastagency.models.base import Model
from fastagency.models.llms.azure import AzureOAI, AzureOAIAPIKey
from fastagency.models.llms.openai import OpenAI
from fastagency.models.teams.two_agent_teams import TwoAgentTeam


@pytest.fixture()
def llm_config() -> Dict[str, Any]:
    api_key = os.getenv("AZURE_OPENAI_API_KEY")  # use France or Canada
    api_base = os.getenv("AZURE_API_ENDPOINT")
    gpt_3_5_model_name = os.getenv("AZURE_GPT35_MODEL")  # "gpt-35-turbo-16k"

    openai.api_type = "azure"
    openai.api_version = os.getenv("AZURE_API_VERSION")  # "2024-02-15-preview"

    config_list = [
        {
            "model": gpt_3_5_model_name,
            "api_key": api_key,
            "base_url": api_base,
            "api_type": openai.api_type,
            "api_version": openai.api_version,
        }
    ]

    llm_config = {
        "config_list": config_list,
        "temperature": 0,
    }

    return llm_config


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
                        {"$ref": "#/$defs/UserProxyAgentRef"},
                        {"$ref": "#/$defs/WebSurferAgentRef"},
                    ],
                    "description": "Agent that starts the conversation",
                    "title": "Initial agent",
                },
                "secondary_agent": {
                    "anyOf": [
                        {"$ref": "#/$defs/AssistantAgentRef"},
                        {"$ref": "#/$defs/UserProxyAgentRef"},
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
        # print(schema)
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

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.parametrize(
        "llm_model,api_key_model",  # noqa: PT006
        [
            (AzureOAI, AzureOAIAPIKey),
        ],
    )
    async def test_two_agent_team_autogen(
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
        api_key_validated_model = await add_model(  # noqa: F841
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
        llm_validated_model = await add_model(  # noqa: F841
            user_uuid=user_uuid,
            type_name="llm",
            model_name=llm_model.__name__,  # type: ignore [attr-defined]
            model_uuid=llm_model_uuid,
            model=llm.model_dump(),
        )

        weatherman_assistant_model = AssistantAgent(
            llm=llm.get_reference_model()(uuid=llm_model_uuid),
            name="Assistant",
            system_message="test system message",
        )
        weatherman_assistant_model_uuid = str(uuid.uuid4())
        weatherman_assistant_validated_model = await add_model(  # noqa: F841
            user_uuid=user_uuid,
            type_name="agent",
            model_name=AssistantAgent.__name__,
            model_uuid=weatherman_assistant_model_uuid,
            model=weatherman_assistant_model.model_dump(),
        )

        user_proxy_model = UserProxyAgent(
            name="UserProxyAgent",
            llm=llm.get_reference_model()(uuid=llm_model_uuid),
        )
        user_proxy_model_uuid = str(uuid.uuid4())
        user_proxy_validated_model = await add_model(  # noqa: F841
            user_uuid=user_uuid,
            type_name="agent",
            model_name=UserProxyAgent.__name__,
            model_uuid=user_proxy_model_uuid,
            model=user_proxy_model.model_dump(),
        )

        team_model_uuid = str(uuid.uuid4())
        initial_agent = weatherman_assistant_model.get_reference_model()(
            uuid=weatherman_assistant_model_uuid
        )
        secondary_agent = user_proxy_model.get_reference_model()(
            uuid=user_proxy_model_uuid
        )
        team = TwoAgentTeam(
            name="TwoAgentTeam",
            initial_agent=initial_agent,
            secondary_agent=secondary_agent,
        )
        team_validated_model = await add_model(  # noqa: F841
            user_uuid=user_uuid,
            type_name="team",
            model_name=TwoAgentTeam.__name__,
            model_uuid=team_model_uuid,
            model=team.model_dump(),
        )

        # Then create autogen agents by monkeypatching create_autogen method
        weatherman_agent = autogen.agentchat.AssistantAgent(
            name="weather_man",
            system_message="You are the weather man. Ask the user to give you the name of a city and then provide the weather forecast for that city.",
            llm_config=llm_config,
        )

        user_proxy_agent = autogen.agentchat.UserProxyAgent(
            "user_proxy",
        )

        get_forecast_for_city_mock = MagicMock()

        @user_proxy_agent.register_for_execution()  # type: ignore [misc]
        @weatherman_agent.register_for_llm(
            description="Get weather forecast for a city"
        )  # type: ignore [misc]
        def get_forecast_for_city(city: str) -> str:
            get_forecast_for_city_mock(city)
            return f"The weather in {city} is sunny today."

        monkeypatch.setattr(
            AssistantAgent,
            "create_autogen",
            lambda cls, model_id, user_id: weatherman_agent,
        )
        monkeypatch.setattr(
            UserProxyAgent,
            "create_autogen",
            lambda cls, model_id, user_id: user_proxy_agent,
        )

        team = await asyncify(TwoAgentTeam.create_autogen)(
            model_id=uuid.UUID(team_model_uuid), user_id=uuid.UUID(user_uuid)
        )

        assert hasattr(team, "initiate_chat")

        d = {"count": 0}

        def input(prompt: str, d: Dict[str, int] = d) -> str:
            d["count"] += 1
            if d["count"] == 1:
                return f"[{datetime.now()}] What's the weather in New York today?"
            elif d["count"] == 2:
                return ""
            else:
                return "exit"

        monkeypatch.setattr(IOConsole, "input", lambda self, prompt: input(prompt))

        chat_result = team.initiate_chat(
            message="Hi! Tell me the city for which you want the weather forecast.",
        )

        last_message = chat_result.chat_history[-1]

        get_forecast_for_city_mock.assert_called_once_with("New York")
        assert "sunny" in last_message["content"]

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
