import uuid

import pytest
from pydantic import BaseModel

from fastagency.models.base import (
    Model,
    _get_annotations,
    create_reference_model,
    create_wrapper_model,
    get_reference_model,
    get_wrapper_model,
)


def test_create_reference_model() -> None:
    class MyModel(Model):
        i: int
        s: str

    MyModelRef = create_reference_model(MyModel, type_name="my_type")  # noqa: N806

    assert hasattr(MyModelRef, "get_data_model")
    data_model = MyModelRef.get_data_model()
    assert data_model == MyModel

    assert hasattr(MyModelRef, "get_wrapper_model")
    with pytest.raises(ValueError, match="wrapper class not set"):
        MyModelRef.get_wrapper_model()

    schema = MyModelRef.model_json_schema()
    expected = {
        "properties": {
            "type": {
                "const": "my_type",
                "default": "my_type",
                "description": "The name of the type of the data",
                "enum": ["my_type"],
                "title": "Type",
                "type": "string",
            },
            "name": {
                "const": "MyModel",
                "default": "MyModel",
                "description": "The name of the data",
                "enum": ["MyModel"],
                "title": "Name",
                "type": "string",
            },
            "uuid": {
                "description": "The unique identifier",
                "format": "uuid",
                "title": "UUID",
                "type": "string",
            },
        },
        "required": ["uuid"],
        "title": "MyModelRef",
        "type": "object",
    }
    assert schema == expected

    my_uuid = uuid.uuid4()
    o = MyModelRef.create(uuid=my_uuid)
    dump = o.model_dump()
    assert dump == {"type": "my_type", "name": "MyModel", "uuid": my_uuid}

    loaded = MyModelRef(**dump)
    assert loaded == o


def test__get_annotations() -> None:
    class A(Model):
        a: int = 1
        b: str = "abc"
        c: float

    expected = {"a": (int, 1), "b": (str, "abc"), "c": float}
    annotations = _get_annotations(A)
    # print(f"{annotations=}")
    assert annotations == expected


def test_create_wrapper_model() -> None:
    class MySecret(Model):
        key: str

    MySecretRef = create_reference_model(MySecret, type_name="my_secret")  # noqa: N806

    class MyModel(Model):
        i: int
        s: str
        secret: MySecretRef  # type: ignore[valid-type]

    MyModelRef = create_reference_model(MyModel, type_name="my_type")  # noqa: N806
    MyModelWrapper = create_wrapper_model(MyModelRef)  # noqa: N806

    assert hasattr(MyModelWrapper, "get_reference_model")
    reference_model = MyModelWrapper.get_reference_model()
    assert reference_model == MyModelRef

    assert reference_model.get_wrapper_model() == MyModelWrapper

    secret_uuid = uuid.uuid4()
    my_model = MyModel(i=0, s="", secret=MySecretRef.create(uuid=secret_uuid))
    my_uuid = uuid.uuid4()
    my_model_wrapper = MyModelWrapper.create(uuid=my_uuid, data=my_model)

    schema = MyModelWrapper.model_json_schema()
    expected = {
        "$defs": {
            "MyModel": {
                "properties": {
                    "i": {"title": "I", "type": "integer"},
                    "s": {"title": "S", "type": "string"},
                    "secret": {"$ref": "#/$defs/MySecretRef"},
                },
                "required": ["i", "s", "secret"],
                "title": "MyModel",
                "type": "object",
            },
            "MySecretRef": {
                "properties": {
                    "type": {
                        "const": "my_secret",
                        "default": "my_secret",
                        "description": "The name of the type of the data",
                        "enum": ["my_secret"],
                        "title": "Type",
                        "type": "string",
                    },
                    "name": {
                        "const": "MySecret",
                        "default": "MySecret",
                        "description": "The name of the data",
                        "enum": ["MySecret"],
                        "title": "Name",
                        "type": "string",
                    },
                    "uuid": {
                        "description": "The unique identifier",
                        "format": "uuid",
                        "title": "UUID",
                        "type": "string",
                    },
                },
                "required": ["uuid"],
                "title": "MySecretRef",
                "type": "object",
            },
        },
        "properties": {
            "type": {
                "const": "my_type",
                "default": "my_type",
                "description": "The name of the type of the data",
                "enum": ["my_type"],
                "title": "Type",
                "type": "string",
            },
            "name": {
                "const": "MyModel",
                "default": "MyModel",
                "description": "The name of the data",
                "enum": ["MyModel"],
                "title": "Name",
                "type": "string",
            },
            "uuid": {
                "description": "The unique identifier",
                "format": "uuid",
                "title": "UUID",
                "type": "string",
            },
            "data": {"allOf": [{"$ref": "#/$defs/MyModel"}], "description": "The data"},
        },
        "required": ["uuid", "data"],
        "title": "MyModel",
        "type": "object",
    }
    assert schema == expected

    dump = my_model_wrapper.model_dump()
    expected = {
        "type": "my_type",
        "name": "MyModel",
        "uuid": my_uuid,
        "data": {
            "i": 0,
            "s": "",
            "secret": {
                "type": "my_secret",
                "name": "MySecret",
                "uuid": secret_uuid,
            },
        },
    }
    # print(dump)
    assert dump == expected


def test_get_wrapper() -> None:
    # registry = Registry()

    # @registry.register("my_type")
    class MyModel(Model):
        i: int
        s: str

    MyModelRef = create_reference_model(MyModel, type_name="my_type")  # noqa: N806
    MyModelWrapper = create_wrapper_model(MyModelRef)  # noqa: N806

    assert get_wrapper_model(MyModel) == MyModelWrapper
    assert get_wrapper_model(MyModelRef) == MyModelWrapper
    assert get_wrapper_model(MyModelWrapper) == MyModelWrapper
    with pytest.raises(
        ValueError, match="Class 'BaseModel' is not and does not have a wrapper"
    ):
        get_wrapper_model(BaseModel)


def test_get_reference_model() -> None:
    class MyModel(Model):
        i: int
        s: str

    MyModelRef = create_reference_model(MyModel, type_name="my_type")  # noqa: N806
    MyModelWrapper = create_wrapper_model(MyModelRef)  # noqa: N806

    assert get_reference_model(MyModel) == MyModelRef
    assert get_reference_model(MyModelRef) == MyModelRef
    assert get_reference_model(MyModelWrapper) == MyModelRef
    with pytest.raises(
        ValueError, match="Class 'BaseModel' is not and does not have a reference"
    ):
        get_reference_model(BaseModel)
