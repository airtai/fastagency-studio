from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field

from ..registry import Registry

__all__ = ["AgentBaseModel", "register"]

register = Registry.get_default().register("agent")


class AgentBaseModel(BaseModel):
    name: Annotated[str, Field(description="The name of the agent")]
    llm_uuid: Annotated[
        UUID,
        Field(
            title="LLM UUID", description="The unique identifier for the LLM instance"
        ),
    ]
