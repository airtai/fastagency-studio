from typing import Annotated, List

from pydantic import Field

from ..registry import Registry
from .base import TeamBaseModel, agent_type_refs

__all__ = ["MultiAgentTeam"]

registry = Registry.get_default()


@registry.register("team")
class MultiAgentTeam(TeamBaseModel):
    agents: Annotated[
        List[agent_type_refs],
        Field(
            title="Agents",
            description="List of agents in the team",
        ),
    ]
