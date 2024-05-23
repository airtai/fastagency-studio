import asyncio
import os
import time
import traceback
from queue import Queue
from typing import Any, Callable, Dict, List, Literal, Union
from uuid import UUID

from asyncer import asyncify, syncify, runnify
from autogen.io.base import IOStream
from faststream import Logger
from faststream.nats import NatsMessage
from nats.js import api
from pydantic import BaseModel

from ..db.helpers import find_model_using_raw
from ..models.teams.multi_agent_team import MultiAgentTeam
from ..models.teams.two_agent_teams import TwoAgentTeam
from .app import app, broker, stream  # noqa


class PrintModel(BaseModel):
    msg: str


class InputRequestModel(BaseModel):
    prompt: str
    is_password: bool


class InputResponseModel(BaseModel):
    msg: str


class TerminateModel(BaseModel):
    msg: str = "Chat completed."


class ErrorResoponseModel(BaseModel):
    msg: str


TYPE_LITERAL = Literal["input", "print", "terminate", "error"]


class ServerResponseModel(BaseModel):
    data: Union[InputRequestModel, PrintModel, TerminateModel, ErrorResoponseModel]
    type: TYPE_LITERAL


class IONats(IOStream):  # type: ignore[misc]
    def __init__(self, thread_id: str) -> None:
        """Initialize the IO class."""
        self.queue: Queue = Queue()  # type: ignore[type-arg]
        self._publisher = broker.publish
        self._thread_id = thread_id

        self._input_request_subject = f"chat.client.messages.{thread_id}"
        self._input_receive_subject = f"chat.server.messages.{thread_id}"

    @classmethod
    async def create(cls, thread_id: Union[str, UUID]) -> "IONats":
        if isinstance(thread_id, UUID):
            thread_id = str(thread_id)
        self = cls(thread_id)

        # dynamically subscribe to the chat server
        subscriber = broker.subscriber(
            subject=self._input_receive_subject,
            stream=stream,
            deliver_policy=api.DeliverPolicy("all"),
        )
        subscriber(self.handle_input)
        broker.setup_subscriber(subscriber)

        await subscriber.start()

        return self

    def print(
        self, *objects: Any, sep: str = " ", end: str = "\n", flush: bool = False
    ) -> None:
        r"""Print data to the output stream.

        Args:
            objects (any): The data to print.
            sep (str, optional): The separator between objects. Defaults to " ".
            end (str, optional): The end of the output. Defaults to "\n".
            flush (bool, optional): Whether to flush the output. Defaults to False.
        """
        xs = sep.join(map(str, objects)) + end

        print_data = PrintModel(msg=xs)
        msg = ServerResponseModel(data=print_data, type="print")

        syncify(self._publisher)(msg, self._input_request_subject)

    def input(self, prompt: str = "", *, password: bool = False) -> str:
        """Read a line from the input stream.

        Args:
            prompt (str, optional): The prompt to display. Defaults to "".
            password (bool, optional): Whether to read a password. Defaults to False.

        Returns:
            str: The line read from the input stream.

        """
        # request a new input
        input_request_data = InputRequestModel(prompt=prompt, is_password=password)
        input_request_msg = ServerResponseModel(data=input_request_data, type="input")

        syncify(self._publisher)(input_request_msg, self._input_request_subject)

        # wait for the input to arrive and be propagated to queue
        while self.queue.empty():
            time.sleep(0.1)

        msg: NatsMessage = self.queue.get()

        self.queue.task_done()
        syncify(msg.ack)()

        retval = InputResponseModel.model_validate_json(
            msg.raw_message.data.decode("utf-8")
        ).msg

        return retval

    async def handle_input(
        self, body: InputResponseModel, msg: NatsMessage, logger: Logger
    ) -> None:
        logger.info(
            f"Received message in subject '{self._input_receive_subject}': {body}"
        )

        self.queue.put(msg)


class InitiateModel(BaseModel):
    user_id: UUID
    thread_id: UUID
    team_id: UUID
    msg: str


# patch this is tests
def create_team(team_id: UUID, user_id: UUID) -> Callable[[str], List[Dict[str, Any]]]:
    team_dict = syncify(find_model_using_raw)(team_id, user_id)

    team_model: Union[TwoAgentTeam, MultiAgentTeam]
    if "initial_agent" in team_dict["json_str"]:
        team_model = TwoAgentTeam(**team_dict["json_str"])
    elif "agent_1" in team_dict["json_str"]:
        team_model = MultiAgentTeam(**team_dict["json_str"])
    else:
        raise ValueError(f"Unknown team model {team_dict['json_str']}")

    autogen_team = team_model.create_autogen(team_id, user_id)

    return autogen_team.initiate_chat  # type: ignore[no-any-return]


@broker.subscriber(
    "chat.server.initiate_chat",
    stream=stream,
    queue="initiate_workers",
    deliver_policy=api.DeliverPolicy("all"),
)
async def initiate_handler(
    body: InitiateModel, msg: NatsMessage, logger: Logger
) -> None:
    await msg.ack()

    logger.info(
        f"Received a message in subject 'chat.server.initiate_chat': {body=} -> from process id {os.getpid()}"
    )

    try:
        iostream = await IONats.create(body.thread_id)

        def start_chat() -> List[Dict[str, Any]]:
            terminate_data = TerminateModel()
            terminate_chat_msg = ServerResponseModel(
                data=terminate_data, type="terminate"
            )

            with IOStream.set_default(iostream):
                print(create_team)
                print(type(create_team))
                initiate_chat = create_team(team_id=body.team_id, user_id=body.user_id)
                chat_result = initiate_chat(body.msg)

                syncify(broker.publish)(
                    terminate_chat_msg, iostream._input_request_subject
                )  # type: ignore [arg-type]

                return chat_result

        async_start_chat = asyncify(start_chat)

        background_tasks = set()
        task = asyncio.create_task(async_start_chat())  # type: ignore
        background_tasks.add(task)

        def task_done(t):
            background_tasks.discard(t)
            exc = t.exception()
            if exc:
                print("here")
                # t.result()
                
                logger.error(f"Error in handling initiate chat: {exc}")
                logger.error(traceback.format_exc())
                error_data = ErrorResoponseModel(msg=str(exc))
                error_msg = ServerResponseModel(data=error_data, type="error")
                print(f"{error_data=}")
                print(f"{error_msg=}")
                syncify(broker.publish)(error_msg, iostream._input_request_subject)  # type: ignore [arg-type]


        task.add_done_callback(task_done)


    except Exception as e:
        logger.error(f"Error in handling initiate chat: {e}")
        logger.error(traceback.format_exc())
        print("there")
        error_data = ErrorResoponseModel(msg=str(e))
        error_msg = ServerResponseModel(data=error_data, type="error")
        # print(f"{error_data=}")
        # print(f"{error_msg=}")
        syncify(broker.publish)(error_msg, iostream._input_request_subject)  # type: ignore [arg-type]
