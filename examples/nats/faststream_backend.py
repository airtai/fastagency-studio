import json
import random
from typing import Any, Dict

from faststream import FastStream, Logger
from faststream.nats import JStream, NatsBroker, NatsMessage

process_id = random.randint(1, 1000)


broker = NatsBroker("nats://nats-fastagency:4222")
app = FastStream(broker)

stream = JStream(name="chat_test")

tracking_client_ids = []


async def chat_handler(body: Dict[str, Any], msg: NatsMessage, logger: Logger):
    raw_message = msg.raw_message

    subject = raw_message.subject
    reply = raw_message.reply

    msg_client_id = body["id"]
    if msg_client_id in tracking_client_ids:
        await msg.ack()
        print(
            f"Received a message on '{subject=} {reply=}': {body=} -> from {process_id=}"
        )

        reply = {
            "id": "backend",
            "m": f"Helo {body['id']}!, received your msg=`{body['m']}` -> from {process_id=}",
        }
        await broker.publish(json.dumps(reply), f"backend.{process_id}")
    else:
        print(
            f"Unknown client id {msg_client_id}, going to nak it -> from {process_id=}"
        )
        await msg.nak()


@broker.subscriber(
    "enter.*",
    stream=stream,
    queue="enter_workers",
    # deliver_policy="new",
)
async def enter_handler(body: Dict[str, Any], msg: NatsMessage, logger: Logger):
    raw_message = msg.raw_message

    subject = raw_message.subject
    reply = raw_message.reply

    await msg.ack()

    logger.info(
        f"Received a message on '{subject=} {reply=}': {body=} -> from {process_id=}"
    )

    welcome = {
        "id": "backend",
        "m": f"Welcome to the chat! - {body['id']} -> from {process_id=}",
    }

    # Send the processed message back to frontend
    await broker.publish(json.dumps(welcome), f"backend.{process_id}")

    tracking_client_ids.append(body["id"])
    logger.info(f"tracking_client_ids={tracking_client_ids}")

    subscriber = broker.subscriber(
        f"chat.{body['id']}",
        stream=stream,
        # deliver_policy="new",
    )
    subscriber(chat_handler)

    broker.setup_subscriber(subscriber)
    await subscriber.start()
