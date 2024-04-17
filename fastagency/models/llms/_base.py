from typing import Annotated, Any, Dict
from uuid import UUID

from pydantic import BaseModel, Field

from ._registry import _llm_registry

__all__ = ["UUIDModel", "validate_model"]


class UUIDModel(BaseModel):
    uuid: Annotated[
        UUID,
        Field(title="UUID", description="The unique identifier"),
    ]


def validate_model(model_dict: Dict[str, Any], model_name: str) -> None:
    """Validate a model instance.

    Args:
        model_dict (BaseModel): The model instance to validate.
        model_name (str): The name of the model.

    Raises:
        ValueError: If the model is not valid.

    """
    model_type = _llm_registry.get(model_name)
    if model_type is None:
        raise ValueError(f"Model '{model_name}' not found")

    model_type(**model_dict)
