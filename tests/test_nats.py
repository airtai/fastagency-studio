import json
import uuid
from datetime import datetime
from typing import Any, Callable, Dict
from unittest.mock import MagicMock

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
        user_id = uuid.uuid4()
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

        def create_team(team_id: uuid.UUID, user_id: uuid.UUID) -> Callable[[], Any]:
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
                    user_id=user_id,
                ),
                subject="chat.server.initiate_chat",
            )

            expected = [
                {"msg": "(to user_proxy):\n\n"},
                {
                    "msg": "Hi! Tell me the city for which you want the weather forecast.\n"
                },
                {
                    "msg": "\n--------------------------------------------------------------------------------\n"
                },
                {"msg": "(to weather_man):\n\n"},
                {"msg": "What's the weather in New York today?\n"},
                {
                    "msg": "\n--------------------------------------------------------------------------------\n"
                },
                {"msg": "(to user_proxy):\n\n"},
                {"msg": " Suggested tool call (call_"},
                {"msg": 'Arguments: \n{\n  "city": "New York"\n}\n'},
                {
                    "msg": "*********************************************************************************"
                },
                {
                    "msg": "\n--------------------------------------------------------------------------------\n"
                },
                {"msg": ">>>>>>>> NO HUMAN INPUT RECEIVED."},
                {"msg": ">>>>>>>> USING AUTO REPLY..."},
                {"msg": ">>>>>>>> EXECUTING FUNCTION get_forecast_for_city..."},
                {"msg": "(to weather_man):\n\n"},
                {"msg": "(to weather_man):\n\n"},
                {"msg": " Response from calling tool (call_"},
                {"msg": "The weather in New York is sunny today.\n"},
                {
                    "msg": "*****************************************************************"
                },
                {
                    "msg": "\n--------------------------------------------------------------------------------\n"
                },
                {"msg": "(to user_proxy):\n\n"},
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
