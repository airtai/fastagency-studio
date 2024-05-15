import json
import os
import uuid
from datetime import datetime
from typing import Any, Callable, Dict
from unittest.mock import MagicMock

import openai
import pytest
from autogen.agentchat import AssistantAgent, UserProxyAgent
from autogen.io.console import IOConsole
from faststream.nats import TestNatsBroker
from pydantic import BaseModel

import fastagency.io.ionats
from fastagency.io.ionats import (  # type: ignore [attr-defined]
    InputRequestModel,
    InputResponseModel,
    broker,
    stream,
)


def as_dict(model: BaseModel) -> Dict[str, Any]:
    return json.loads(model.model_dump_json())  # type: ignore [no-any-return]


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


@pytest.mark.azure_oai()
def test_llm_config_fixture(llm_config: Dict[str, Any]) -> None:
    assert set(llm_config.keys()) == {"config_list", "temperature"}
    assert isinstance(llm_config["config_list"], list)
    assert llm_config["temperature"] == 0

    for k in ["model", "api_key", "base_url", "api_type", "api_version"]:
        assert len(llm_config["config_list"][0][k]) > 3


class TestAutogen:
    @pytest.mark.azure_oai()
    def test_ioconsole(
        self, llm_config: Dict[str, Any], monkeypatch: pytest.MonkeyPatch
    ) -> None:
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

        # print(f"{llm_config=}")

        weather_man = AssistantAgent(
            name="weather_man",
            system_message="You are the weather man. Ask the user to give you the name of a city and then provide the weather forecast for that city.",
            llm_config=llm_config,
        )

        user_proxy = UserProxyAgent(
            "user_proxy",
        )

        get_forecast_for_city_mock = MagicMock()

        @user_proxy.register_for_execution()  # type: ignore [misc]
        @weather_man.register_for_llm(description="Get weather forecast for a city")  # type: ignore [misc]
        def get_forecast_for_city(city: str) -> str:
            get_forecast_for_city_mock(city)
            return f"The weather in {city} is sunny today."

        chat_result = weather_man.initiate_chat(
            recipient=user_proxy,
            message="Hi! Tell me the city for which you want the weather forecast.",
        )

        # print(f"{chat_result=}")

        last_message = chat_result.chat_history[-1]
        # print(f"{last_message=}")

        get_forecast_for_city_mock.assert_called_once_with("New York")
        assert "sunny" in last_message["content"]

    @pytest.mark.azure_oai()
    @pytest.mark.nats()
    @pytest.mark.asyncio()
    async def test_ionats(
        self, llm_config: Dict[str, Any], monkeypatch: pytest.MonkeyPatch
    ) -> None:
        thread_id = uuid.uuid4()
        team_id = uuid.uuid4()

        ### begin sending inputs to server

        d = {"count": 0}

        def input(prompt: str, d: Dict[str, int] = d) -> str:
            d["count"] += 1
            if d["count"] == 1:
                return f"[{datetime.now()}] What's the weather in New York today?"
            elif d["count"] == 2:
                return ""
            else:
                return "exit"

        @broker.subscriber(f"chat.client.input.{thread_id}", stream=stream)
        async def client_input_handler(msg: InputRequestModel) -> None:
            response = InputResponseModel(msg=input(msg.prompt))

            await broker.publish(response, subject=f"chat.server.input.{thread_id}")

        ### end sending inputs to server

        ### begin reading print from server

        # msg_queue: asyncio.Queue = asyncio.Queue()
        actual = []

        @broker.subscriber(f"chat.client.print.{thread_id}", stream=stream)
        async def print_handler(msg: Dict[str, Any]) -> None:
            # print(f"{msg=}")
            actual.append(msg)

        ### end reading print from server

        get_forecast_for_city_mock = MagicMock()

        def create_team(team_id: uuid.UUID) -> Callable[[], Any]:
            weather_man = AssistantAgent(
                name="weather_man",
                system_message="You are the weather man. Ask the user to give you the name of a city and then provide the weather forecast for that city.",
                llm_config=llm_config,
            )

            user_proxy = UserProxyAgent(
                "user_proxy",
            )

            @user_proxy.register_for_execution()  # type: ignore [misc]
            @weather_man.register_for_llm(description="Get weather forecast for a city")  # type: ignore [misc]
            def get_forecast_for_city(city: str) -> str:
                get_forecast_for_city_mock(city)
                return f"The weather in {city} is sunny today."

            def initiate_chat() -> Any:
                chat_result = weather_man.initiate_chat(
                    recipient=user_proxy,
                    message="Hi! Tell me the city for which you want the weather forecast.",
                )
                return chat_result

            return initiate_chat

        monkeypatch.setattr(fastagency.io.ionats, "create_team", create_team)

        async with TestNatsBroker(broker) as br:
            await br.publish(
                fastagency.io.ionats.InitiateModel(
                    msg="exit",
                    thread_id=thread_id,
                    team_id=team_id,
                ),
                subject="chat.server.initiate_chat",
            )

            expected = [
                {"msg": "\x1b[33mweather_man\x1b[0m (to user_proxy):\n\n"},
                {
                    "msg": "Hi! Tell me the city for which you want the weather forecast.\n"
                },
                {
                    "msg": "\n--------------------------------------------------------------------------------\n"
                },
                {"msg": "\x1b[33muser_proxy\x1b[0m (to weather_man):\n\n"},
                {"msg": "What's the weather in New York today?\n"},
                {
                    "msg": "\n--------------------------------------------------------------------------------\n"
                },
                {"msg": "\x1b[33mweather_man\x1b[0m (to user_proxy):\n\n"},
                {"msg": "\x1b[32m***** Suggested tool call (call_"},
                {"msg": 'Arguments: \n{\n  "city": "New York"\n}\n'},
                {
                    "msg": "\x1b[32m**************************************************************************************\x1b[0m\n"
                },
                {
                    "msg": "\n--------------------------------------------------------------------------------\n"
                },
                {"msg": "\x1b[31m\n>>>>>>>> NO HUMAN INPUT RECEIVED.\x1b[0m\n"},
                {"msg": "\x1b[31m\n>>>>>>>> USING AUTO REPLY...\x1b[0m\n"},
                {
                    "msg": "\x1b[35m\n>>>>>>>> EXECUTING FUNCTION get_forecast_for_city...\x1b[0m\n"
                },
                {"msg": "\x1b[33muser_proxy\x1b[0m (to weather_man):\n\n"},
                {"msg": "\x1b[33muser_proxy\x1b[0m (to weather_man):\n\n"},
                {"msg": "\x1b[32m***** Response from calling tool (call_"},
                {"msg": "The weather in New York is sunny today.\n"},
                {
                    "msg": "\x1b[32m**********************************************************************\x1b[0m\n"
                },
                {
                    "msg": "\n--------------------------------------------------------------------------------\n"
                },
                {"msg": "\x1b[33mweather_man\x1b[0m (to user_proxy):\n\n"},
                {"msg": "The weather in New York today is sunny.\n"},
                {
                    "msg": "\n--------------------------------------------------------------------------------\n"
                },
            ]

            assert len(actual) == len(expected)
            for i in range(len(expected)):
                assert (
                    expected[i]["msg"] in actual[i]["msg"]
                ), f"{actual[i]} != {expected[i]}"
