import json
import random
from os import environ
from typing import Any, Dict, Optional, Callable
from queue import Queue

from asyncer import asyncify
from faststream import FastStream, Logger
from faststream.nats import JStream, NatsBroker, NatsMessage

from simple_conversation import chat_with_weatherman


process_id = random.randint(1, 1000)  # nosec B311

nats_url: Optional[str] = environ.get("NATS_URL", None)  # type: ignore[assignment]
if nats_url is None:
    domain: str = environ.get("DOMAIN")  # type: ignore[assignment]
    nats_url = f"tls://{domain}:4222"

broker = NatsBroker(nats_url)
app = FastStream(broker)

stream = JStream(name="request_response", subjects=["request.*", "response.*", "initiate.*"])


class IOWebsockets():
    def __init__(self, publisher: Callable[..., None], publish_subject: str) -> None:
        self.queue = Queue()
        self._publisher = publisher
        self._publish_subject = publish_subject

    def print(self, *objects: Any, sep: str = " ", end: str = "\n", flush: bool = False) -> None:
        """Print data to the output stream.

        Args:
            objects (any): The data to print.
            sep (str, optional): The separator between objects. Defaults to " ".
            end (str, optional): The end of the output. Defaults to "\n".
            flush (bool, optional): Whether to flush the output. Defaults to False.
        """
        xs = sep.join(map(str, objects)) + end
        # self._websocket.send(xs)
        self._publisher(xs, self._publish_subject)

    def input(self, prompt: str = "", *, password: bool = False) -> str:
        """Read a line from the input stream.

        Args:
            prompt (str, optional): The prompt to display. Defaults to "".
            password (bool, optional): Whether to read a password. Defaults to False.

        Returns:
            str: The line read from the input stream.

        """
        # if prompt != "":
        #     self._websocket.send(prompt)

        msg = self.queue.get()
        self.queue.task_done()

        return msg.decode("utf-8") if isinstance(msg, bytes) else msg

    async def request_handler(self, body: Dict[str, Any], msg: NatsMessage, logger: Logger) -> None:
        raw_message = msg.raw_message

        subject = raw_message.subject
        client_id = subject.split(".")[1]
        reply_subject = raw_message.reply

        await msg.ack()
        logger.info(
            f"Received a message on '{subject=} {reply_subject=}': {body=} -> from {process_id=}"
        )

        if "msg" not in body:
            init_msg = "What is the weather like today?"
        else:
            init_msg = body["msg"]

        # ToDo: Use the print function to send the message to NATS
        # TODo: When a new message arrives put it in self.queue and use input function to read message in autogen code

        chat_result = await asyncify(chat_with_weatherman)(message=init_msg)

        for c in chat_result.chat_history:
            await broker.publish(json.dumps(c), f"response.{client_id}")


@broker.subscriber(
    "initiate.*",
    stream=stream,
    queue="initiate_workers",
)
async def initiate_handler(
    body: Dict[str, Any], msg: NatsMessage, logger: Logger
) -> None:
    raw_message = msg.raw_message

    subject = raw_message.subject
    client_id = subject.split(".")[1]
    reply = raw_message.reply

    await msg.ack()

    logger.info(
        f"Received a message on '{subject=} {reply=}': {body=} -> from {process_id=}"
    )

    logger.info(f"Creating a new subscriber for {client_id=}")

    iostream = IOWebsockets(broker.publish, f"response.{client_id}")

    subscriber = broker.subscriber(
        f"request.{client_id}",
        stream=stream,
    )
    subscriber(iostream.request_handler)

    broker.setup_subscriber(subscriber)
    await subscriber.start()
