from typing import Annotated, Any, Optional
from uuid import UUID

import autogen
from pydantic import Field

from ..base import Model
from ..registry import register


@register("agent")
class UserProxyAgent(Model):
    max_consecutive_auto_reply: Annotated[
        Optional[int],
        Field(
            description="The maximum number of consecutive auto-replies the agent can make"
        ),
    ] = None

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> Any:
        my_model = await cls.from_db(model_id)

        agent_name = my_model.name

        agent = autogen.agentchat.UserProxyAgent(
            name=agent_name,
            max_consecutive_auto_reply=my_model.max_consecutive_auto_reply,
        )
        return agent
