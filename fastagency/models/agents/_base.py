from typing import Annotated, Union

from pydantic import Field
from typing_extensions import TypeAlias

from ..base import Model
from ..registry import Registry

__all__ = ["AgentBaseModel"]

# Agents can work with any LLM, so we construct a union of all LLM references
llm_type_refs: TypeAlias = Union[  # type: ignore[valid-type]
    tuple(Registry.get_default().get_models_refs_by_type("llm"))
]


class AgentBaseModel(Model):
    llm: Annotated[
        llm_type_refs,
        Field(
            title="LLM",
            description="LLM used by the agent for producing responses",
        ),
    ]
