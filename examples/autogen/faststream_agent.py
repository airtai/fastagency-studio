import json
import random
from os import environ
from typing import Any, Dict, Optional

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


async def request_handler(body: Dict[str, Any], msg: NatsMessage, logger: Logger) -> None:
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

    subscriber = broker.subscriber(
        f"request.{client_id}",
        stream=stream,
    )
    subscriber(request_handler)

    broker.setup_subscriber(subscriber)
    await subscriber.start()
