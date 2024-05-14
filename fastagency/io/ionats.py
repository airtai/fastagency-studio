import os
import time
from queue import Queue
from typing import Any, Callable
from uuid import UUID

from asyncer import asyncify, syncify
from autogen.io.base import IOStream
from faststream import Logger
from faststream.nats import NatsMessage
from nats.js import api
from pydantic import BaseModel

from .app import broker, stream


class PrintModel(BaseModel):
    msg: str


class InputModel(BaseModel):
    msg: str


class IONats(IOStream):  # type: ignore[misc]
    def __init__(self, thread_id: str) -> None:
        """Initialize the IO class."""
        self.queue: Queue = Queue()  # type: ignore[type-arg]
        self._publisher = broker.publish
        self._thread_id = thread_id

        self._receive_subject = f"chat.server.thread.{thread_id}"
        self._send_subject = f"chat.client.thread.{thread_id}"

    @classmethod
    async def create(cls, thread_id: str) -> "IONats":
        self = cls(thread_id)

        # dynamically subscribe to the chat server
        subscriber = broker.subscriber(
            subject=self._receive_subject,
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

        msg = PrintModel(msg=xs)
        print(f"Printing data to the output stream - {msg}")

        syncify(self._publisher)(msg, self._send_subject)

    def input(self, prompt: str = "", *, password: bool = False) -> str:
        """Read a line from the input stream.

        Args:
            prompt (str, optional): The prompt to display. Defaults to "".
            password (bool, optional): Whether to read a password. Defaults to False.

        Returns:
            str: The line read from the input stream.

        """
        if prompt != "":
            self.print(prompt)

        while self.queue.empty():
            print("Waiting for input...")
            time.sleep(0.1)

        msg: NatsMessage = self.queue.get()

        self.queue.task_done()
        syncify(msg.ack)()

        retval = InputModel.model_validate_json(
            msg.raw_message.data.decode("utf-8")
        ).msg
        print(f"{retval=}")

        return retval

    async def handle_input(
        self, body: InputModel, msg: NatsMessage, logger: Logger
    ) -> None:
        # print(f"Received message in subject '{self._receive_subject}': {body}")
        logger.info(f"Received message in subject '{self._receive_subject}': {body}")

        self.queue.put(msg)


class InitiateModel(BaseModel):
    thread_id: UUID
    team_id: UUID
    msg: str


# patch this is tests
def create_team(team_id: UUID) -> Callable[[], Any]:
    raise NotImplementedError


@broker.subscriber(
    "chat.server.initiate_thread",
    stream=stream,
    queue="initiate_workers",
    deliver_policy=api.DeliverPolicy("all"),
)
async def initiate_handler(
    body: InitiateModel, msg: NatsMessage, logger: Logger
) -> None:
    await msg.ack()

    logger.info(
        f"Received a message in subject 'chat.server.initiate_thread': {body=} -> from process id {os.getpid()}"
    )

    iostream = await IONats.create(body.thread_id)

    def start_chat() -> Any:
        with IOStream.set_default(iostream):
            initiate_chat = create_team(team_id=body.team_id)
            return initiate_chat()

    await asyncify(start_chat)()
