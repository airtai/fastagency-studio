from typing import Annotated

from pydantic import Field

from ..registry import Registry
from .base import TeamBaseModel, agent_type_refs

__all__ = ["TwoAgentTeam"]


@Registry.get_default().register("team")
class TwoAgentTeam(TeamBaseModel):
    initial_agent: Annotated[
        agent_type_refs,
        Field(
            title="Initial agent",
            description="Agent that starts the conversation",
        ),
    ]
    secondary_agent: Annotated[
        agent_type_refs,
        Field(
            title="Secondary agent",
            description="Agent that continues the conversation",
        ),
    ]
