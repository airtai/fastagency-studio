from typing import Annotated, Any, Callable, Dict, List, Optional, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field

from ..constants import REGISTRED_MODEL_TYPES

__all__ = ["Registry", "Schema", "Schemas", "ModelSchemas", "UUIDModel"]

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


class ModelSchemas(BaseModel):
    name: Annotated[REGISTRED_MODEL_TYPES, Field(description="The name of the Model")]
    schemas: Annotated[
        List[Schema],
        Field(description="The schemas for all registred models of particular types"),
    ]


class Schemas(BaseModel):
    schemas: Annotated[
        List[ModelSchemas], Field(description="The schemas for all registred models")
    ]


class Registry:
    def __init__(self) -> None:
        keys: List[str] = REGISTRED_MODEL_TYPES.__args__  # type: ignore[attr-defined]
        self._registry: Dict[str, Dict[str, "Type[UUIDModel]"]] = {
            key: {} for key in keys
        }

    def register(self, type: REGISTRED_MODEL_TYPES) -> Callable[[BM], BM]:
        def _inner(m: BM) -> BM:
            name = m.__name__  # type: ignore[attr-defined]
            if name in self._registry[type]:
                raise ValueError(f"Class '{name}' already registered as '{type}'")

            self._registry[type][name] = m

            return m

        return _inner

    def get(
        self, type: REGISTRED_MODEL_TYPES, name: str
    ) -> "Optional[Type[UUIDModel]]":
        return self._registry[type].get(name, None)

    def get_schemas_for_type(self, type: REGISTRED_MODEL_TYPES) -> ModelSchemas:
        return ModelSchemas(
            name=type,
            schemas=[
                Schema(name=name, json_schema=model.model_json_schema())
                for name, model in self._registry[type].items()
            ],
        )

    def get_schemas(self) -> Schemas:
        return Schemas(
            schemas=[
                self.get_schemas_for_type(type)
                for type in REGISTRED_MODEL_TYPES.__args__  # type: ignore[attr-defined]
            ]
        )

    def validate(
        self, type: REGISTRED_MODEL_TYPES, model_dict: Dict[str, Any], model_name: str
    ) -> None:
        model_type = self.get(type, model_name)
        if model_type is None:
            raise ValueError(f"Model '{model_name}' not found as '{type}'")

        model_type(**model_dict)

    _default_registry: "Optional[Registry]" = None

    @classmethod
    def get_default(cls) -> "Registry":
        if cls._default_registry is None:
            cls._default_registry = cls()
        return cls._default_registry
