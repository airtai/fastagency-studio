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
        "chat.server.initiate_thread",
        "chat.client.thread.*",
        "chat.server.thread.*",
        # "function.server.call",
        # "function.client.call.*",
        # "code.server.execute",
        # "code.client.execute.*",
    ],
)
