from typing import Annotated
from uuid import UUID

from pydantic import Field

from .._registry import Registry, UUIDModel

__all__ = ["AgentBaseModel", "register"]

register = Registry.get_default().register("agent")


class AgentBaseModel(UUIDModel):
    name: Annotated[str, Field(description="The name of the agent")]
    llm_uuid: Annotated[
        UUID,
        Field(
            title="LLM UUID", description="The unique identifier for the LLM instance"
        ),
    ]
