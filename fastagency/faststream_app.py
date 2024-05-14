import asyncio
import json
import random
from os import environ
from typing import Any, Dict, Optional

from faststream import FastStream, Logger
from faststream.nats import JStream, NatsBroker, NatsMessage

process_id = random.randint(1, 1000)  # nosec B311

nats_url: Optional[str] = environ.get("NATS_URL", None)  # type: ignore[assignment]
if nats_url is None:
    domain: str = environ.get("DOMAIN")  # type: ignore[assignment]
    nats_url = f"tls://{domain}:4222"

broker = NatsBroker(nats_url)
app = FastStream(broker)

stream = JStream(name="ping_pong", subjects=["ping.*", "pong.*", "terminate.*"])

LOREM_IPSUM = "[35mchat_manager (to chat_manager):[0m\n\n[32mLorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.[0m\n\n[35mIt has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.[0m\n\n[35m### End ###"


async def ping_handler(body: Dict[str, Any], msg: NatsMessage, logger: Logger) -> None:
    raw_message = msg.raw_message

    subject = raw_message.subject
    client_id = subject.split(".")[1]
    reply_subject = raw_message.reply

    await msg.ack()
    logger.info(
        f"Received a message on '{subject=} {reply_subject=}': {body=} -> from {process_id=}"
    )

    if "msg" not in body or body["msg"].lower() != "ping":
        reply_msg = f"Unkown message: {body}, please send 'ping' in body['msg']"
    else:
        reply_msg = LOREM_IPSUM

    for c in reply_msg:
        await asyncio.sleep(0.05)
        reply = {
            "msg": c,
            "process_id": process_id,
        }
        await broker.publish(json.dumps(reply), f"pong.{client_id}")

    await broker.publish(
        json.dumps({"msg": reply_msg, "process_id": process_id}),
        f"terminate.{client_id}",
    )


@broker.subscriber(
    "register.*",
    stream=stream,
    queue="register_workers",
)
async def register_handler(
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
        f"ping.{client_id}",
        stream=stream,
    )
    subscriber(ping_handler)

    broker.setup_subscriber(subscriber)
    # print(broker)
    # print(type(broker))
    # print(dir(broker))
    await subscriber.start()
