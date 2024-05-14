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
from fastagency.io.ionats import broker


def as_dict(model: BaseModel) -> Dict[str, Any]:
    return json.loads(model.model_dump_json())


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
def test_llm_config_fixture(llm_config):
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

        @user_proxy.register_for_execution()
        @weather_man.register_for_llm(description="Get weather forecast for a city")
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

            @user_proxy.register_for_execution()
            @weather_man.register_for_llm(description="Get weather forecast for a city")
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
            for msg in [
                f"[{datetime.now()}] What's the weather in New York today?",
                "",
                "exit",
            ]:
                await br.publish(
                    fastagency.io.ionats.PrintModel(
                        msg=msg,
                        thread_id=thread_id,
                    ),
                    subject=f"chat.server.thread.{thread_id}",
                )

            await br.publish(
                fastagency.io.ionats.InitiateModel(
                    msg="exit",
                    thread_id=thread_id,
                    team_id=team_id,
                ),
                subject="chat.server.initiate_thread",
            )

        # chat_result = create_team(team_id=0)()
        # last_message = chat_result.chat_history[-1]

        # print(f"{last_message=}")

    #     broker = NatsBroker()

    #     class ChatMessage(BaseModel):
    #         thread_uuid: uuid.UUID
    #         msg: str

    #     # generate unique thread id
    #     thread_uuid = uuid.uuid4()

    #     # these three subjects are used in the chat server
    #     # the last part of the subject is the thread id
    #     # the part after 'chat' is the name of the consumer
    #     subject_server_initiate = "chat.server.initiate"
    #     subject_server_thread = f"chat.server.thread.{thread_uuid}"
    #     subject_client_thread = f"chat.client.thread.{thread_uuid}"

    #     chat_thread_team_mock = MagicMock()

    #     ### SERVER CONSUMERS
    #     @broker.subscriber(subject=subject_server_initiate)
    #     async def initiate_chat(msg: ChatMessage):
    #         print(f"Received message in subject '{subject_server_initiate}': {msg}")

    #         send_subject = f"chat.client.thread.{msg.thread_uuid}"
    #         receive_subject = f"chat.server.thread.{msg.thread_uuid}"

    #         subscriber = broker.subscriber(subject=receive_subject)

    #         async def chat_thread_server(msg: ChatMessage):
    #             chat_thread_team_mock(msg)
    #             print(f"Received message in subject '{receive_subject}'): {msg}")

    #             await broker.publish(
    #                 ChatMessage(msg="exit", thread_uuid=msg.thread_uuid),
    #                 subject=send_subject,
    #             )

    #         subscriber(chat_thread_server)

    #         broker.setup_subscriber(subscriber)
    #         await subscriber.start()

    #         await broker.publish(
    #             ChatMessage(
    #                 msg=f"Hello from initiate_chat: {msg}", thread_uuid=msg.thread_uuid
    #             ),
    #             subject=send_subject,
    #         )

    #     @broker.subscriber(subject=subject_client_thread)
    #     async def chat_thread_initiator(msg: ChatMessage):
    #         print(f"Received message in subject '{subject_client_thread}'): {msg}")

    #         if msg.msg == "exit":
    #             return

    #         my_msg = ChatMessage(
    #             msg=f"Hello from chat_thread_initiator: {msg}",
    #             thread_uuid=msg.thread_uuid,
    #         )

    #         print(f"Sending message to subject '{subject_server_thread}': {my_msg}")
    #         await broker.publish(my_msg, subject=subject_server_thread)

    #     async with TestNatsBroker(broker) as br:
    #         initial_msg = ChatMessage(msg="Hello!", thread_uuid=thread_uuid)

    #         await br.publish(
    #             initial_msg,
    #             subject=subject_server_initiate,
    #         )

    #         initiate_chat.mock.assert_called_once()
    #         chat_thread_initiator.mock.assert_called()
    #         chat_thread_team_mock.assert_called_once()
