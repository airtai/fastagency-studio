from os import environ
from typing import Optional

from faststream import FastStream
from faststream.nats import JStream, NatsBroker

nats_url: Optional[str] = environ.get("NATS_URL", None)  # type: ignore[assignment]

if nats_url is None:
    domain: str = environ.get("DOMAIN")  # type: ignore[assignment]
    nats_url = f"tls://{domain}:4222"

broker = NatsBroker(nats_url)
app = FastStream(broker)

stream = JStream(
    name="FastAgency",
    subjects=[
        # starts new conversation
        "chat.server.initiate_chat",
        # server requests input from client
        "chat.client.input.*",
        # client responds to input request from server
        "chat.server.input.*",
        # server prints message to client
        "chat.client.print.*",
        # "function.server.call",
        # "function.client.call.*",
        # "code.server.execute",
        # "code.client.execute.*",
    ],
)