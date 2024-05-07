import random

import pytest
from faststream.nats import TestNatsBroker

from fastagency.faststream_app import broker, register_handler


@pytest.mark.asyncio()
async def test_register_handler() -> None:
    client_id = random.randint(1, 1000)
    async with TestNatsBroker(broker) as br:
        await br.publish(
            {"client_id": client_id},
            f"register.{client_id}",
        )

        register_handler.mock.assert_called_once_with({"client_id": client_id})  # type: ignore[union-attr]

        # Later I will send a message to "ping.*" and will await for "pong.*" message
