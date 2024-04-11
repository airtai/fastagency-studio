#!/usr/bin/env python3

import asyncio
import nats

async def create_jetstream(loop):
    # nc = await nats.connect("nats://localhost:4222")
    nc = await nats.connect("nats://nats-fastagency:4222")
    js = nc.jetstream()

    # jsm = await js.stream_info("chat_test")
    # print("Stream info before creation")
    # print(jsm)

    await js.add_stream(name="chat_test", subjects=["chat.*", "enter.*", "exit.*", "backend.*"], retention="limits", max_msgs=1000)
    # await js.add_stream(name="chat_test", subjects=["chats"])
    print("Stream created")

    jsm = await js.stream_info("chat_test")
    print("Stream info after creation")
    print(jsm)

    print("Closing connection")
    await nc.close()
    print("Connection closed")

if __name__ == '__main__':
    loop = asyncio.get_event_loop()
    loop.run_until_complete(create_jetstream(loop))
    loop.run_until_complete(asyncio.sleep(1))
