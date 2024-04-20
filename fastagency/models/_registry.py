from typing import Annotated, Any, Dict, List, Optional, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field

__all__ = ["Registry", "Schema", "Schemas", "UUIDModel"]

BM = TypeVar("BM", bound="Type[UUIDModel]")


class UUIDModel(BaseModel):
    uuid: Annotated[
        UUID,
        Field(title="UUID", description="The unique identifier"),
    ]


class Schema(BaseModel):
    name: Annotated[str, Field(description="The name of the LLM")]
    json_schema: Annotated[
        Dict[str, Any], Field(description="The schema for the model")
    ]


class Schemas(BaseModel):
    schemas: Annotated[
        List[Schema], Field(description="The schemas for all registred models")
    ]


class Registry:
    def __init__(self, name: str):
        self._registry: Dict[str, "Type[UUIDModel]"] = {}
        self._name = name

    def register(self, m: BM) -> BM:
        name = m.__name__  # type: ignore[attr-defined]
        if name in self._registry:
            raise ValueError(f"Class '{name}' already registered in '{self._name}'")

        self._registry[name] = m

        return m

    def get(self, name: str) -> "Optional[Type[UUIDModel]]":
        return self._registry.get(name, None)

    def get_schemas(self) -> Schemas:
        return Schemas(
            schemas=[
                Schema(name=name, json_schema=model.model_json_schema())
                for name, model in self._registry.items()
            ]
        )

    def validate(self, model_dict: Dict[str, Any], model_name: str) -> None:
        model_type = self.get(model_name)
        if model_type is None:
            raise ValueError(f"Model '{model_name}' not found in '{self._name}")

        model_type(**model_dict)
