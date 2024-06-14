import uuid
from typing import Any, Type, TypeVar, Union
from uuid import UUID

from fastagency.app import add_model

from .db.helpers import find_model_using_raw
from .models.base import Model, ObjectReference
from .models.registry import Registry

T = TypeVar("T", bound=Model)


async def get_model_by_uuid(model_uuid: Union[str, UUID]) -> Model:
    model_dict = await find_model_using_raw(model_uuid=model_uuid)

    registry = Registry.get_default()
    model = registry.validate(
        type=model_dict["type_name"],
        name=model_dict["model_name"],
        model=model_dict["json_str"],
    )

    return model


async def get_model_by_ref(model_ref: ObjectReference) -> Model:
    return await get_model_by_uuid(model_ref.uuid)


async def create_model_ref(
    cls: Type[T], type_name: str, user_uuid: Union[str, UUID], **kwargs: Any
) -> ObjectReference:
    model = cls(**kwargs)
    model_uuid = uuid.uuid4()

    await add_model(
        user_uuid=str(user_uuid),
        type_name=type_name,
        model_name=cls.__name__,  # type: ignore [attr-defined]
        model_uuid=str(model_uuid),
        model=model.model_dump(),
    )

    model_ref = cls.get_reference_model()(uuid=model_uuid)

    return model_ref
