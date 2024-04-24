from typing import Annotated

from pydantic import Field

from ._base import AgentBaseModel, register


@register
class AssistantAgent(AgentBaseModel):
    system_message: Annotated[
        str,
        Field(
            description="The system message of the agent. This message is used to inform the agent about his role in the conversation"
        ),
    ]
