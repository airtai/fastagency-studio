from typing import Annotated
from uuid import UUID

from pydantic import BaseModel, Field

from .._registry import Registry

__all__ = ["UUIDModel", "get_llm_registry"]


class UUIDModel(BaseModel):
    uuid: Annotated[
        UUID,
        Field(title="UUID", description="The unique identifier"),
    ]


_llm_registry = Registry("llm_registry")


def get_llm_registry() -> Registry:
    """Get the LLM registry.

    Returns:
        Registry: The LLM registry
    """
    return _llm_registry
