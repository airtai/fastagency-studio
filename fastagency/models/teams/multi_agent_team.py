from typing import Annotated, Optional

from pydantic import Field

from ..registry import Registry
from .base import TeamBaseModel, agent_type_refs

__all__ = ["MultiAgentTeam"]

registry = Registry.get_default()


@registry.register("team")
class MultiAgentTeam(TeamBaseModel):
    agent_1: Annotated[
        agent_type_refs,
        Field(
            title="Agents",
            description="An agent in the team",
        ),
    ]
    agent_2: Annotated[
        agent_type_refs,
        Field(
            title="Agents",
            description="An agent in the team",
        ),
    ]
    agent_3: Annotated[
        Optional[agent_type_refs],
        Field(
            title="Agents",
            description="An agent in the team",
        ),
    ] = None
    agent_4: Annotated[
        Optional[agent_type_refs],
        Field(
            title="Agents",
            description="An agent in the team",
        ),
    ] = None
    agent_5: Annotated[
        Optional[agent_type_refs],
        Field(
            title="Agents",
            description="An agent in the team",
        ),
    ] = None
