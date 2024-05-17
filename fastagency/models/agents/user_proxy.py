from typing import Annotated, Any, Optional
from uuid import UUID

import autogen
from asyncer import syncify
from pydantic import Field

from ...db.helpers import find_model_using_raw
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
        my_model_dict = syncify(find_model_using_raw)(model_id, user_id)
        my_model = cls(**my_model_dict["json_str"])

        llm_dict = syncify(find_model_using_raw)(my_model.llm.uuid, user_id)
        llm_model = my_model.llm.get_data_model()(**llm_dict["json_str"])
        llm = llm_model.create_autogen(my_model.llm.uuid, user_id)

        agent_name = my_model_dict["model_name"]

        agent = autogen.agentchat.UserProxyAgent(
            name=agent_name,
            llm_config=llm,
            max_consecutive_auto_reply=my_model.max_consecutive_auto_reply,
        )
        return agent
