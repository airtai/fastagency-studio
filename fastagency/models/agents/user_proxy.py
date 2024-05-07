from typing import Annotated, Optional

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
