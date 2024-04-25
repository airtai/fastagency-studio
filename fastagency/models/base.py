import inspect
from abc import ABC
from typing import Annotated, Any, Dict, Literal, Optional, Protocol, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field, create_model, model_validator
from typing_extensions import TypeAlias

M = TypeVar("M", bound="Model")

__all__ = [
    "ObjectReference",
    "ObjectWrapper",
    "create_reference_model",
    "create_wrapper_model",
    "get_wrapper_model",
    "get_reference_model",
    "Model",
]


# abstract class
class Model(BaseModel, ABC):
    _reference_model: "Optional[Type[ObjectReference]]" = None
    _wrapper_model: "Optional[Type[ObjectWrapper]]" = None

    @classmethod
    def get_reference_model(cls) -> "Type[ObjectReference]":
        if cls._reference_model is None:
            raise ValueError("reference model not set")
        return cls._reference_model

    @classmethod
    def get_wrapper_model(cls) -> "Type[ObjectWrapper]":
        if cls._wrapper_model is None:
            raise ValueError("wrapper model not set")
        return cls._wrapper_model


class ObjectReference(BaseModel):
    type: Annotated[str, Field(description="The name of the type of the data")] = ""
    name: Annotated[str, Field(description="The name of the data")] = ""
    uuid: Annotated[UUID, Field(description="The unique identifier")]

    _data_class: Optional[Type[Model]] = None
    _wrapper_class: "Optional[Type[ObjectWrapper]]" = None

    @model_validator(mode="after")
    def check_type(self) -> "ObjectReference":
        if self.type == "" or self.name == "":
            raise ValueError("type and name must be set")
        return self

    @classmethod
    def get_wrapper_model(cls) -> "Type[ObjectWrapper]":
        """Get the wrapper class for the reference.

        This method returns the wrapper class that is associated with the reference class.

        Returns:
            Type[ObjectWrapper]: The wrapper class for the reference

        Raises:
            ValueError: If the wrapper class is not set

        """
        if cls._wrapper_class is None:
            raise ValueError("wrapper class not set")

        return cls._wrapper_class

    @classmethod
    def get_data_model(cls) -> Type[Model]:
        """Get the data class for the reference.

        This method returns the data class that is associated with the reference class.

        Returns:
            Type[BM]: The data class for the reference

        Raises:
            ValueError: If the data class is not set

        """
        if cls._data_class is None:
            raise RuntimeError("data class not set")

        return cls._data_class

    @classmethod
    def create(cls, uuid: UUID) -> "ObjectReference":
        """Factory method to create a new instance of the class.

        This method is used to create a new instance of the class with the given UUID. It
        is exacly the same as calling `ObjectReference(uuid=uuid)`, but without type
        cheching failing because of the missing `type` and `name` arguments.

        Args:
            uuid (UUID): The unique identifier of the object

        Returns:
            ObjectReference: The new instance of the class
        """
        return cls(uuid=uuid)  # type: ignore[call-arg]


def create_reference_model(
    model_class: Optional[Type[M]] = None,
    *,
    type_name: str,
    model_name: Optional[str] = None,
) -> Type[ObjectReference]:
    if model_class is None and model_name is None:
        raise ValueError("Either model_class or model_name should be provided")
    if model_class is not None and model_name is not None:
        raise ValueError("Only one of model_class or model_name should be provided")

    model_type_name = model_class.__name__ if model_class is not None else model_name

    LiteralType: TypeAlias = Literal[type_name]  # type: ignore[valid-type]
    LiteralModelName: TypeAlias = Literal[model_type_name]  # type: ignore[valid-type]

    reference_model = create_model(
        f"{model_type_name}Ref",
        type=(
            Annotated[  # type: ignore[valid-type]
                LiteralType, Field(description="The name of the type of the data")
            ],
            type_name,
        ),
        name=(
            Annotated[LiteralModelName, Field(description="The name of the data")],
            model_type_name,
        ),
        uuid=(
            Annotated[UUID, Field(description="The unique identifier", title="UUID")],
            ...,
        ),
        __base__=ObjectReference,
    )
    reference_model.__module__ = (
        f"fastagency.models.{type_name}.{model_type_name}._generated"
    )

    reference_model._data_class = model_class  # type: ignore[attr-defined]
    reference_model._wrapper_class = None  # type: ignore[attr-defined]

    return reference_model  # type: ignore[return-value]


class ModelTypeFinder(Protocol):
    def get_model_type(self, type: str, name: str) -> Type[Model]: ...


class ObjectWrapper(ObjectReference):
    data: Model

    _data_class: Optional[Type[Model]] = None
    _reference_class: Optional[Type[ObjectReference]] = None
    _model_type_finder: Optional[ModelTypeFinder] = None

    @classmethod
    def set_model_type_finder(cls, model_type_finder: ModelTypeFinder) -> None:
        cls._model_type_finder = model_type_finder

    @classmethod
    def get_data_model(cls) -> Type[Model]:
        """Get the data class for the wrapper.

        This method returns the data class that is associated with the wrapper class.

        Returns:
            Type[BM]: The data class for the wrapper

        """
        if cls._data_class is None:
            raise RuntimeError("data class not set")
        return cls._data_class

    @classmethod
    def get_reference_model(cls) -> Type[ObjectReference]:
        """Get the reference class for the wrapper.

        This method returns the reference class that is associated with the wrapper class.

        Returns:
            Type[ObjectReference]: The reference class for the wrapper

        """
        if cls._reference_class is None:
            raise ValueError("reference class not set")
        return cls._reference_class

    @classmethod
    def create(cls, uuid: UUID, data: Model) -> "ObjectWrapper":  # type: ignore[override]
        return cls(uuid=uuid, data=data)  # type: ignore[call-arg]

    @staticmethod
    def _get_value(param: inspect.Parameter, raw: Dict[str, Any]) -> Any:
        if param.name in raw:
            return raw[param.name]
        if param.default is not inspect.Parameter.empty:
            return param.default
        raise ValueError(f"{param.name} is required")

    @model_validator(mode="before")
    @classmethod
    def check_data(cls, raw: Any) -> Any:
        if cls._model_type_finder is None:
            raise ValueError("model type finder not set")

        param = inspect.signature(cls).parameters
        model_type = cls._model_type_finder.get_model_type(
            type=cls._get_value(param["type"], raw),
            name=cls._get_value(param["name"], raw),
        )

        data = raw["data"]
        if isinstance(data, BaseModel):
            data = model_type(**data.model_dump())
        else:
            data = model_type(**data)

        raw["data"] = data

        return raw


def _get_annotations(model: Type[BaseModel]) -> dict[str, Any]:
    sig = inspect.signature(model)
    default_params = {
        name: param.default
        for name, param in sig.parameters.items()
        if param.default is not inspect.Parameter.empty
    }
    annotations = {
        k: (v, default_params[k]) if k in default_params else v
        for k, v in model.__annotations__.items()
    }
    return annotations


def create_wrapper_model(
    reference_model: Type[ObjectReference],
) -> Type[ObjectWrapper]:
    annotations = _get_annotations(reference_model)

    data_model = reference_model.get_data_model()
    data_model_name = data_model.__name__

    wrapper_model = create_model(
        f"{data_model_name}",
        **{
            # **reference_model.__annotations__,
            **annotations,
            "data": Annotated[data_model, Field(description="The data")],
        },
        __base__=ObjectWrapper,
    )
    # needed to hide from docs
    wrapper_model.__module__ = reference_model.__module__

    wrapper_model._data_class = data_model  # type: ignore[attr-defined]
    wrapper_model._reference_class = reference_model  # type: ignore[attr-defined]
    reference_model._wrapper_class = wrapper_model  # type: ignore[attr-defined]
    data_model._wrapper_model = wrapper_model  # type: ignore[attr-defined]
    data_model._reference_model = reference_model  # type: ignore[attr-defined]

    return wrapper_model  # type: ignore[no-any-return]


def get_wrapper_model(model: Type[BaseModel]) -> Type[ObjectWrapper]:
    if issubclass(model, ObjectWrapper):
        return model
    elif issubclass(model, ObjectReference):
        return model.get_wrapper_model()
    elif hasattr(model, "_wrapper_model"):
        return model._wrapper_model  # type: ignore[attr-defined,no-any-return]
    raise ValueError(f"Class '{model.__name__}' is not and does not have a wrapper")


def get_reference_model(model: Type[BaseModel]) -> Type[ObjectReference]:
    if issubclass(model, ObjectWrapper):
        return model.get_reference_model()
    elif issubclass(model, ObjectReference):
        return model
    elif hasattr(model, "_reference_model"):
        return model._reference_model  # type: ignore[attr-defined,no-any-return]
    raise ValueError(f"Class '{model.__name__}' is not and does not have a reference")
