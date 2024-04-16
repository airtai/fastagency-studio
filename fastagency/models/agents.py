from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field


class Agent(BaseModel):
    uuid: Annotated[
        UUID,
        Field(title="UUID", description="The unique identifier for agent instance"),
    ]
    model_uuid: Annotated[
        UUID,
        Field(title="UUID", description="The unique identifier for the model instance"),
    ]
    name: Annotated[str, Field(description="The name of the agent")]
    system_message: Annotated[
        str,
        Field(
            description="The system message of the agent. This message is used to inform the agent about his role in the conversation"
        ),
    ]
