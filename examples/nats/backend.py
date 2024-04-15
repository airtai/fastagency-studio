#! /usr/bin/env python3
import asyncio
import json
import multiprocessing

import nats


async def run(loop, process_id):
    print(f"I am {process_id=}")
    # nc = await nats.connect("nats://localhost:4222")
    nc = await nats.connect("nats://nats-fastagency:4222")
    js = nc.jetstream()
    tracking_client_ids = []

    async def enter_client_id_chat_handler(msg):
        subject = msg.subject
        reply = msg.reply
        data = msg.data.decode()
        d = json.loads(data)

        msg_client_id = d["id"]
        if msg_client_id in tracking_client_ids:
            await msg.ack()
            print(
                f"Received a message on '{subject=} {reply=}': {d=} -> from {process_id=}"
            )

            reply = {
                "id": "backend",
                "m": f"Helo {d['id']}!, received your msg=`{d['m']}` -> from {process_id=}",
            }
            await js.publish(f"backend.{process_id}", bytes(json.dumps(reply), "utf-8"))
        else:
            print(
                f"Unknown client id {msg_client_id}, going to nak it -> from {process_id=}"
            )
            await msg.nak()

    # async def subscribe_to_chat_id(d):
    #     chat_id = d['id']
    #     await js.subscribe(f"chat.{chat_id}", queue=f"chat_{chat_id}_workers", cb=enter_client_id_chat_handler, ordered_consumer=False)

    async def enter_message_handler(msg):
        subject = msg.subject
        reply = msg.reply
        data = msg.data.decode()
        d = json.loads(data)

        await msg.ack()

        print(
            f"Received a message on '{subject=} {reply=}': {d=} -> from {process_id=}"
        )

        welcome = {
            "id": "backend",
            "m": f"Welcome to the chat! - {d['id']} -> from {process_id=}",
        }

        # Send the processed message back to frontend
        await js.publish(f"backend.{process_id}", bytes(json.dumps(welcome), "utf-8"))

        tracking_client_ids.append(d["id"])
        print(f"tracking_client_ids={tracking_client_ids}")

        # loop.create_task(subscribe_to_chat_id(d))
        chat_id = d["id"]
        await js.subscribe(
            f"chat.{chat_id}", cb=enter_client_id_chat_handler, ordered_consumer=False
        )

    # Subscribe to chatId
    await js.subscribe(
        "enter.*",
        queue="enter_workers",
        cb=enter_message_handler,
        ordered_consumer=False,
    )


def start_loop(unique_id):
    loop = asyncio.get_event_loop()
    loop.run_until_complete(run(loop, unique_id))
    loop.run_forever()


if __name__ == "__main__":
    processes = []

    for i in range(2):
        p = multiprocessing.Process(target=start_loop, args=(i,))
        p.start()
        processes.append(p)

    for p in processes:
        p.join()
