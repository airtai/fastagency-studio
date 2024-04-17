from typing import Annotated, Any, Dict, List, Optional, Type, TypeVar

from pydantic import BaseModel, Field

__all__ = ["register_llm", "get_llm_schemas", "LLMSchema", "LLMSchemas"]

BM = TypeVar("BM", bound="Type[BaseModel]")

_llm_registry: "Dict[str, Type[BaseModel]]" = {}


def register_llm(m: BM) -> BM:
    name = m.__name__  # type: ignore[attr-defined]
    if name in _llm_registry:
        raise ValueError(f"Model '{name}' already registered")

    _llm_registry[name] = m

    return m


def get_from_llm_registry(name: str) -> "Optional[Type[BaseModel]]":
    return _llm_registry.get(name, None)


class LLMSchema(BaseModel):
    name: Annotated[str, Field(description="The name of the LLM")]
    json_schema: Annotated[Dict[str, Any], Field(description="The schema for the LLM")]


class LLMSchemas(BaseModel):
    schemas: Annotated[List[LLMSchema], Field(description="The schemas for the LLMs")]


def get_llm_schemas() -> LLMSchemas:
    """Get the schemas for all registered LLMs.

    Returns:
        LLMSchemas: The schemas for all registered LLMs.

    """
    return LLMSchemas(
        schemas=[
            LLMSchema(name=name, json_schema=model.model_json_schema())
            for name, model in _llm_registry.items()
        ]
    )
