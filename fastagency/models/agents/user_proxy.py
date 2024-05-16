from typing import Annotated, Any, Optional
from uuid import UUID

from pydantic import Field

from ..registry import register
from .base import AgentBaseModel


@register("agent")
class UserProxyAgent(AgentBaseModel):
    max_consecutive_auto_reply: Annotated[
        Optional[int],
        Field(
            description="The maximum number of consecutive auto-replies the agent can make"
        ),
    ] = None

    @classmethod
    def create_autogen(cls, model_id: UUID, user_id: UUID) -> Any:
        raise NotImplementedError()
