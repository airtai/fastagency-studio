from typing import Annotated, Any
from uuid import UUID

from pydantic import Field

from ..registry import register
from .base import AgentBaseModel


@register("agent")
class AssistantAgent(AgentBaseModel):
    system_message: Annotated[
        str,
        Field(
            description="The system message of the agent. This message is used to inform the agent about his role in the conversation"
        ),
    ]

    @classmethod
    def create_autogen(cls, model_id: UUID, user_id: UUID) -> Any:
        pass
