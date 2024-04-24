import inspect
from typing import (
    Annotated,
    Any,
    Callable,
    Dict,
    List,
    Literal,
    Optional,
    Tuple,
    Type,
    TypeVar,
)
from uuid import UUID

from pydantic import BaseModel, Field, create_model
from typing_extensions import TypeAlias

__all__ = [
    "ModelSchema",
    "ModelSchemas",
    "ObjectReference",
    "ObjectWrapper",
    "Registry",
    "Schemas",
    "get_reference_model",
    "get_wrapper_model",
    "register",
]

BM = TypeVar("BM", bound="BaseModel")


class ObjectReference(BaseModel):
    type: Annotated[str, Field(description="The name of the type of the data")]
    name: Annotated[str, Field(description="The name of the data")]
    uuid: Annotated[UUID, Field(description="The unique identifier")]

    _data_class: Optional[Type[BaseModel]] = None
    _wrapper_class: "Optional[Type[ObjectWrapper]]" = None

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
    def get_data_model(cls) -> Type[BaseModel]:
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


def _create_reference_model(
    model_class: Optional[Type[BM]] = None,
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

    reference_model._data_class = model_class  # type: ignore[attr-defined]
    reference_model._wrapper_class = None  # type: ignore[attr-defined]

    return reference_model  # type: ignore[return-value]


class ObjectWrapper(ObjectReference):
    data: BaseModel

    _data_class: Type[BaseModel]
    _reference_class: Type[ObjectReference]

    @classmethod
    def get_data_model(cls) -> Type[BaseModel]:
        """Get the data class for the wrapper.

        This method returns the data class that is associated with the wrapper class.

        Returns:
            Type[BM]: The data class for the wrapper

        """
        return cls._data_class

    @classmethod
    def get_reference_model(cls) -> Type[ObjectReference]:
        """Get the reference class for the wrapper.

        This method returns the reference class that is associated with the wrapper class.

        Returns:
            Type[ObjectReference]: The reference class for the wrapper

        """
        return cls._reference_class

    @classmethod
    def create(cls, uuid: UUID, data: BaseModel) -> "ObjectWrapper":  # type: ignore[override]
        return cls(uuid=uuid, data=data)  # type: ignore[call-arg]


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


def _create_wrapper_model(
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


class ModelSchema(BaseModel):
    name: Annotated[str, Field(description="The name of the model")]
    json_schema: Annotated[
        Dict[str, Any], Field(description="The schema for the model")
    ]


class ModelSchemas(BaseModel):
    name: Annotated[str, Field(description="The name of the type of models")]
    schemas: Annotated[
        List[ModelSchema],
        Field(
            description="The schemas for all registred models of the particular types"
        ),
    ]


class Schemas(BaseModel):
    list_of_schemas: Annotated[
        List[ModelSchemas],
        Field(description="The list of schemas for all registred models"),
    ]


class Registry:
    def __init__(self) -> None:
        """Initialize the registry."""
        self._store: "Dict[str, Dict[str, Tuple[Optional[Type[BaseModel]], Type[ObjectReference]]]]" = {}

    def register(self, type_name: str) -> Callable[[Type[BM]], Type[BM]]:
        if type_name not in self._store:
            self._store[type_name] = {}

        type_store = self._store[type_name]

        def _inner(model: Type[BM]) -> Type[BM]:
            model_type_name = model.__name__

            model_tuple = type_store.get(model_type_name)
            existing_model, existing_ref = model_tuple if model_tuple else (None, None)

            if existing_model:
                raise ValueError(
                    f"Model '{model_type_name}' already registered under '{type_name}'"
                )

            if existing_ref is None:
                reference_model: Type[ObjectReference] = _create_reference_model(
                    model, type_name=type_name
                )
            else:
                reference_model = existing_ref
                reference_model._data_class = model  # type: ignore[attr-defined]

            _create_wrapper_model(reference_model)

            type_store[model_type_name] = (model, reference_model)

            return model

        return _inner

    def create_reference(
        self, type_name: str, model_name: str
    ) -> Type[ObjectReference]:
        # check if the type_name is already registered
        if type_name not in self._store:
            self._store[type_name] = {}

        # check if the model_name is already registered
        if model_name in self._store[type_name]:
            raise ValueError("Reference already created for the model")

        # create a reference model and store it
        reference_model = _create_reference_model(
            type_name=type_name, model_name=model_name
        )
        self._store[type_name][model_name] = (None, reference_model)

        return reference_model

    _default_registry: "Optional[Registry]" = None

    @classmethod
    def get_default(cls) -> "Registry":
        if cls._default_registry is None:
            cls._default_registry = cls()
        return cls._default_registry

    def get_dongling_references(self) -> List[Type[ObjectReference]]:
        """Return a list of all dongling references."""
        return [
            reference
            for type_name, models in self._store.items()
            for model_name, (model, reference) in models.items()
            if model is None
        ]

    def get_model_schema(self, model: Type[BaseModel]) -> ModelSchema:
        """Return the schema for the given model."""
        wrapper_model = get_wrapper_model(model)
        return ModelSchema(
            name=wrapper_model.__name__,
            json_schema=wrapper_model.model_json_schema(),
        )

    def get_model_schemas(self, type_name: str) -> ModelSchemas:
        """Return the schemas for all models of the given type."""
        models = self._store.get(type_name)
        if models is None:
            raise ValueError(f"No models registered under '{type_name}'")

        schemas = [self.get_model_schema(model) for _, (model, _) in models.items()]  # type: ignore[arg-type]

        return ModelSchemas(name=type_name, schemas=schemas)

    def get_schemas(self) -> Schemas:
        """Return the schemas for all registered models."""
        dongling_references = self.get_dongling_references()
        if dongling_references:
            raise ValueError(
                f"Found {len(dongling_references)} dongling references: {dongling_references}"
            )

        list_of_schemas = [
            self.get_model_schemas(type_name) for type_name in self._store
        ]

        return Schemas(list_of_schemas=list_of_schemas)

    def validate(self, model_json: Dict[str, Any]) -> None:
        type_name = model_json["type"]
        model_name = model_json["name"]
        Model = self._store[type_name][model_name][0]  # noqa: N806
        if Model is None:
            raise ValueError(f"Model '{model_name}' not found in '{type_name}'")
        data_json = model_json["data"]
        Model(**data_json)


def register(type_name: str) -> Callable[[Type[BM]], Type[BM]]:
    return Registry.get_default().register(type_name)
