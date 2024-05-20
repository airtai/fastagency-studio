import random
import time
from nats.aio.client import Client as NATS
from nats.aio.errors import ErrConnectionClosed, ErrTimeout, ErrNoServers
import asyncio
from os import environ
import json


NATS_URL = environ["NATS_URL"]
print(f"{NATS_URL=}")

async def generate_client_id():
    client_id = random.randint(1000, 9999)
    return client_id

async def send_message(subject, message):
    nc = NATS()

    try:
        await nc.connect(servers=[NATS_URL])#, max_reconnect_attempts=-1)

        await nc.publish(subject, json.dumps(message).encode())

        await nc.flush()

        await nc.close()
        print(f"Message {message} sent to {subject}")
    except (ErrConnectionClosed, ErrTimeout, ErrNoServers) as e:
        print(f"Error: {e}")


async def subscribe_to_message(subject):
    nc = NATS()

    async def message_handler(msg):
        print(f"Received message: {msg.data.decode()}")

    try:
        await nc.connect(servers=[NATS_URL])#, max_reconnect_attempts=-1)
        js = nc.jetstream()
        psub = await js.pull_subscribe(subject )

        for i in range(0, 10):
            msgs = await psub.fetch(1)
            for msg in msgs:
                await msg.ack()
                data = msg.data.decode()
                print(f"Response from {subject=} - {data=}")


    except (ErrConnectionClosed, ErrTimeout, ErrNoServers) as e:
        print(f"Error: {e}")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await nc.close()

async def main():
    client_id = await generate_client_id()

    initiate_subject = f"initiate.{client_id}"
    request_subject = f"request.{client_id}"
    response_subject = f"response.{client_id}"

    await send_message(initiate_subject, {"client_id": client_id})
    await asyncio.sleep(3)

    await send_message(request_subject, {"msg": "What is the weather like today?"})
    await asyncio.sleep(3)

    await subscribe_to_message(response_subject)


if __name__ == "__main__":
    asyncio.run(main())
