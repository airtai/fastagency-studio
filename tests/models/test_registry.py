import json
import uuid

import pytest
from pydantic import BaseModel

from fastagency.models.registry import (
    # Registry,
    ModelSchema,
    Registry,
    _create_reference_model,
    _create_wrapper_model,
    _get_annotations,
    get_reference_model,
    get_wrapper_model,
)


def test_create_reference_model() -> None:
    class MyModel(BaseModel):
        i: int
        s: str

    MyModelRef = _create_reference_model(MyModel, type_name="my_type")  # noqa: N806

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
    class A(BaseModel):
        a: int = 1
        b: str = "abc"
        c: float

    expected = {"a": (int, 1), "b": (str, "abc"), "c": float}
    annotations = _get_annotations(A)
    # print(f"{annotations=}")
    assert annotations == expected


def test_create_wrapper_model() -> None:
    class MySecret(BaseModel):
        key: str

    MySecretRef = _create_reference_model(MySecret, type_name="my_secret")  # noqa: N806

    class MyModel(BaseModel):
        i: int
        s: str
        secret: MySecretRef  # type: ignore[valid-type]

    MyModelRef = _create_reference_model(MyModel, type_name="my_type")  # noqa: N806
    MyModelWrapper = _create_wrapper_model(MyModelRef)  # noqa: N806

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
    registry = Registry()

    @registry.register("my_type")
    class MyModel(BaseModel):
        i: int
        s: str

    MyModelRef = _create_reference_model(MyModel, type_name="my_type")  # noqa: N806
    MyModelWrapper = _create_wrapper_model(MyModelRef)  # noqa: N806

    assert get_wrapper_model(MyModel) == MyModelWrapper
    assert get_wrapper_model(MyModelRef) == MyModelWrapper
    assert get_wrapper_model(MyModelWrapper) == MyModelWrapper
    with pytest.raises(
        ValueError, match="Class 'BaseModel' is not and does not have a wrapper"
    ):
        get_wrapper_model(BaseModel)


def test_get_reference_model() -> None:
    class MyModel(BaseModel):
        i: int
        s: str

    MyModelRef = _create_reference_model(MyModel, type_name="my_type")  # noqa: N806
    MyModelWrapper = _create_wrapper_model(MyModelRef)  # noqa: N806

    assert get_reference_model(MyModel) == MyModelRef
    assert get_reference_model(MyModelRef) == MyModelRef
    assert get_reference_model(MyModelWrapper) == MyModelRef
    with pytest.raises(
        ValueError, match="Class 'BaseModel' is not and does not have a reference"
    ):
        get_reference_model(BaseModel)


class TestRegistry:
    def test_create_reference_success(self) -> None:
        registry = Registry()

        MySecretRef = registry.create_reference(  # noqa: N806
            type_name="my_secret", model_name="MySecret"
        )

        assert hasattr(MySecretRef, "get_data_model")
        with pytest.raises(RuntimeError, match="data class not set"):
            MySecretRef.get_data_model()
        assert registry._store["my_secret"]["MySecret"] == (None, MySecretRef)

    def test_create_reference_fail(self) -> None:
        registry = Registry()

        @registry.register("my_secret")
        class MySecret(BaseModel):
            key: str

        with pytest.raises(ValueError, match="Reference already created for the model"):
            registry.create_reference(type_name="my_secret", model_name="MySecret")

    def test_register_simple_success(self) -> None:
        registry = Registry()

        @registry.register("my_type")
        class MyModel(BaseModel):
            i: int
            s: str

        MyModelRef = get_reference_model(MyModel)  # noqa: N806
        assert registry._store["my_type"]["MyModel"] == (MyModel, MyModelRef)

    def test_register_complex_with_ref_success(self) -> None:
        registry = Registry()

        MySecretRef = registry.create_reference(  # noqa: N806
            type_name="my_secret", model_name="MySecret"
        )

        @registry.register("my_type")
        class MyModel(BaseModel):
            i: int
            s: str
            secret: MySecretRef  # type: ignore[valid-type]

        MyModelRef = get_reference_model(MyModel)  # noqa: N806
        assert registry._store["my_type"]["MyModel"] == (MyModel, MyModelRef)

    def test_register_complex_with_nested_model_success(self) -> None:
        registry = Registry()

        @registry.register("my_secret")
        class MySecret(BaseModel):
            key: str

        MySecretRef = get_reference_model(MySecret)  # noqa: N806

        @registry.register("my_type")
        class MyModel(BaseModel):
            i: int
            s: str
            secret: MySecretRef  # type: ignore[valid-type]

        MyModelRef = get_reference_model(MyModel)  # noqa: N806
        assert registry._store["my_type"]["MyModel"] == (MyModel, MyModelRef)

    def test_get_default(self) -> None:
        registry = Registry.get_default()
        assert isinstance(registry, Registry)
        assert Registry.get_default() == registry

    def test_get_dongling_references(self) -> None:
        registry = Registry()

        assert registry.get_dongling_references() == []

        MySecretRef = registry.create_reference(  # noqa: N806
            type_name="my_secret", model_name="MySecret"
        )
        assert registry.get_dongling_references() == [MySecretRef]

        @registry.register("my_secret")
        class MySecret(BaseModel):
            key: str

        assert registry.get_dongling_references() == []

    def test_get_model_schema_simple(self) -> None:
        registry = Registry()

        @registry.register("my_type")
        class MyModel(BaseModel):
            i: int
            s: str

        schema = registry.get_model_schema(MyModel)
        expected = ModelSchema(
            name="MyModel",
            json_schema={
                "$defs": {
                    "MyModel": {
                        "properties": {
                            "i": {"title": "I", "type": "integer"},
                            "s": {"title": "S", "type": "string"},
                        },
                        "required": ["i", "s"],
                        "title": "MyModel",
                        "type": "object",
                    }
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
                    "data": {
                        "allOf": [{"$ref": "#/$defs/MyModel"}],
                        "description": "The data",
                    },
                },
                "required": ["uuid", "data"],
                "title": "MyModel",
                "type": "object",
            },
        )
        assert schema == expected

    def test_get_model_schema_nested(self) -> None:
        registry = Registry()

        @registry.register("my_secret")
        class MySecret(BaseModel):
            key: str

        MySecretRef = get_reference_model(MySecret)  # noqa: N806

        @registry.register("my_type")
        class MyModel(BaseModel):
            i: int
            s: str
            secret: MySecretRef  # type: ignore[valid-type]

        schema = registry.get_model_schema(MyModel)
        expected = ModelSchema(
            name="MyModel",
            json_schema={
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
                    "data": {
                        "allOf": [{"$ref": "#/$defs/MyModel"}],
                        "description": "The data",
                    },
                },
                "required": ["uuid", "data"],
                "title": "MyModel",
                "type": "object",
            },
        )
        assert schema == expected

    def test_get_model_schemas_simple(self) -> None:
        registry = Registry()

        @registry.register("my_type")
        class MyModel(BaseModel):
            i: int
            s: str

        schemas = registry.get_model_schemas("my_type")
        assert len(schemas.schemas) == 1
        assert schemas.schemas[0].name == "MyModel"

    def test_get_schemas_simple(self) -> None:
        registry = Registry()

        @registry.register("my_type")
        class MyModel(BaseModel):
            i: int
            s: str

        schemas = registry.get_schemas()
        assert len(schemas.list_of_schemas) == 1
        assert len(schemas.list_of_schemas[0].schemas) == 1
        assert schemas.list_of_schemas[0].schemas[0].name == "MyModel"

    def test_validate_complex_success(self) -> None:
        registry = Registry()

        @registry.register("my_secret")
        class MySecret(BaseModel):
            key: str

        MySecretRef = get_reference_model(MySecret)  # noqa: N806

        @registry.register("my_type")
        class MyModel(BaseModel):
            i: int
            s: str
            secret: MySecretRef  # type: ignore[valid-type]

        secret = MySecretRef.create(uuid=uuid.uuid4())
        model = MyModel(i=1, s="a", secret=secret)

        model_wrapped = get_wrapper_model(MyModel).create(uuid=uuid.uuid4(), data=model)

        model_json = json.loads(model_wrapped.model_dump_json())

        registry.validate(model_json)


# def test_create_reference_model() -> None:
#     reference_model = _create_reference_model("my_type", "MyModel")
#     assert reference_model.__name__ == "ReferenceMyTypeMyModel"

#     schema = reference_model.model_json_schema()
#     # print(schema)
#     expected = {
#         "properties": {
#             "type": {
#                 "const": "my_type",
#                 "default": "my_type",
#                 "description": "The name of the type of the data",
#                 "enum": ["my_type"],
#                 "title": "Type",
#                 "type": "string",
#             },
#             "name": {
#                 "const": "MyModel",
#                 "default": "MyModel",
#                 "description": "The name of the data",
#                 "enum": ["MyModel"],
#                 "title": "Name",
#                 "type": "string",
#             },
#             "uuid": {
#                 "description": "The unique identifier",
#                 "format": "uuid",
#                 "title": "UUID",
#                 "type": "string",
#             },
#         },
#         "required": ["uuid"],
#         "title": "ReferenceMyTypeMyModel",
#         "type": "object",
#     }
#     assert schema == expected

#     my_uuid = uuid.uuid4()
#     o = reference_model(uuid=my_uuid)
#     # print(o.model_dump())
#     assert o.model_dump() == {"type": "my_type", "name": "MyModel", "uuid": my_uuid}


# def test_create_wrapper_model() -> None:
#     class MyModel(BaseModel):
#         i: int
#         s: str

#     reference_model = _create_reference_model("my_type", "MyModel")

#     wrapper_model = _create_wrapper_model(
#         type_name="my_type",
#         model_type_name="MyModel",
#         reference_model=reference_model,
#         model_type=MyModel,
#     )
#     assert wrapper_model.__name__ == "WrapperMyTypeMyModel"

#     schema = wrapper_model.model_json_schema()
#     # print(schema)
#     expected = {
#         "$defs": {
#             "MyModel": {
#                 "properties": {
#                     "i": {"title": "I", "type": "integer"},
#                     "s": {"title": "S", "type": "string"},
#                 },
#                 "required": ["i", "s"],
#                 "title": "MyModel",
#                 "type": "object",
#             }
#         },
#         "properties": {
#             "type": {
#                 "const": "my_type",
#                 "default": "my_type",
#                 "description": "The name of the type of the data",
#                 "enum": ["my_type"],
#                 "title": "Type",
#                 "type": "string",
#             },
#             "name": {
#                 "const": "MyModel",
#                 "default": "MyModel",
#                 "description": "The name of the data",
#                 "enum": ["MyModel"],
#                 "title": "Name",
#                 "type": "string",
#             },
#             "uuid": {
#                 "description": "The unique identifier",
#                 "format": "uuid",
#                 "title": "UUID",
#                 "type": "string",
#             },
#             "data": {"allOf": [{"$ref": "#/$defs/MyModel"}], "description": "The data"},
#         },
#         "required": ["uuid"],
#         "title": "WrapperMyTypeMyModel",
#         "type": "object",
#     }
#     assert schema == expected

#     my_uuid = uuid.uuid4()
#     my_model = MyModel(i=1, s="a")

#     o = wrapper_model(uuid=my_uuid, data=my_model)

#     expected = {
#         "type": "my_type",
#         "name": "MyModel",
#         "uuid": my_uuid,
#         "data": {"i": 1, "s": "a"},
#     }
#     assert o.model_dump() == expected

#     loaded = wrapper_model(**o.model_dump())
#     assert loaded.model_dump() == expected

#     json_dump = o.model_dump_json()
#     loaded_from_json = wrapper_model.model_validate_json(json_dump)
#     assert loaded_from_json.model_dump() == expected


# class TestRegistry:
#     @pytest.fixture()
#     def my_model_type(self) -> Type[BaseModel]:
#         self.registry = Registry()

#         @self.registry.register("my_type")
#         class MyModel(BaseModel):
#             i: int
#             s: str

#         return MyModel

#     def test_register(self, my_model_type: Type[BaseModel]) -> None:
#         model, ref, wrapper = self.registry._store["my_type"]["MyModel"]
#         assert model == my_model_type
#         assert ref is not None
#         assert wrapper is not None

#     def test_ref_before_registering(self, my_model_type: Type[BaseModel]) -> None:
#         initial_ref = self.registry.get_reference_type("my_type", "MyNewModel")
#         assert initial_ref is not None

#         model, ref, wrapper = self.registry._store["my_type"]["MyNewModel"]
#         assert model is None
#         assert ref is initial_ref
#         assert wrapper is None

#         @self.registry.register("my_type")
#         class MyNewModel(BaseModel):
#             i: int
#             s: str

#         model, ref, wrapper = self.registry._store["my_type"]["MyNewModel"]
#         assert model == MyNewModel
#         assert ref == initial_ref
#         assert wrapper is not None

#     def test_register_under_the_same_name(self, my_model_type: Type[BaseModel]) -> None:
#         with pytest.raises(ValueError, match="Type 'my_type' already registered"):
#             self.registry.register("my_type")(my_model_type)


# def test_validate_model(self, my_model_type: Type[BaseModel]) -> None:
#     model = my_model_type(uuid=uuid.uuid4(), i=1, s="hello")
#     self.registry.validate("llm", model.model_dump(), "MyModel")

# def test_validate_unregistred_model(self, my_model_type: Type[BaseModel]) -> None:
#     with pytest.raises(
#         ValueError, match="Model 'UnregistredModel' not found as 'llm'"
#     ):
#         self.registry.validate("llm", {}, "UnregistredModel")

# def test_validate_corrupted_model(self, my_model_type: Type[BaseModel]) -> None:
#     with pytest.raises(ValueError, match="validation errors"):
#         self.registry.validate("llm", {"a": "b"}, "MyModel")

# def test_get_schemas_for_type(self, my_model_type: Type[BaseModel]) -> None:
#     schemas = self.registry.get_schemas_for_type("llm")

#     expected = {
#         "name": "llm",
#         "schemas": [
#             {
#                 "json_schema": {
#                     "properties": {
#                         "i": {"title": "I", "type": "integer"},
#                         "s": {"title": "S", "type": "string"},
#                     },
#                     "required": ["i", "s"],
#                     "title": "MyModel",
#                     "type": "object",
#                 },
#                 "name": "MyModel",
#             }
#         ],
#     }
#     assert schemas.model_dump() == expected


# class TestObjectWrapper:
#     @pytest.fixture(autouse=True)
#     def setup_method(self) -> Registry:
#         self.registry = Registry(keys=["my_type"])
#         self.register = self.registry.register("my_type")  # type: ignore[arg-type]

#         return self.registry

#     @pytest.mark.parametrize("use_dict", [True, False])
#     def test_success(self, use_dict: bool, monkeypatch: pytest.MonkeyPatch) -> None:
#         monkeypatch.setattr(
#             "fastagency.models._registry.Registry.get_default", lambda: self.registry
#         )

#         @self.register
#         class MyModel(BaseModel):
#             i: int
#             s: str

#         my_uuid = uuid.uuid4()

#         data = {"i": 1, "s": "a"} if use_dict else MyModel(i=1, s="a")

#         object_wrapper_type = self.registry.get_wrapper_type("my_type", "MyModel")

#         try:
#             o = object_wrapper_type(uuid=my_uuid, data=data)
#         except Exception as e:
#             print(e.errors())

#         expected = {
#             "uuid": my_uuid,
#             "type": "my_type",
#             "name": "MyModel",
#             "data": {"i": 1, "s": "a"},
#         }
#         actual = o.model_dump()
#         assert actual == expected, actual

#     @pytest.mark.parametrize(
#         ("type", "name", "match"),
#         [
#             ("unknown", "MyModel", "Type 'unknown' is not registered"),
#             (
#                 "my_type",
#                 "unknown",
#                 "Model 'unknown' of type 'my_type' is not registered",
#             ),
#             ("unknown", "unknown", "Type 'unknown' is not registered"),
#         ],
#     )
#     def test_wrong_name_and_or_type(
#         self, type: str, name: str, match: str, monkeypatch: pytest.MonkeyPatch
#     ) -> None:
#         monkeypatch.setattr(
#             "fastagency.models._registry.Registry.get_default", lambda: self.registry
#         )

#         my_uuid = uuid.uuid4()

#         with pytest.raises(ValueError, match=match):
#             ObjectWrapper(type=type, name=name, uuid=my_uuid, data={})


# class TestObjectReference:
#     @pytest.fixture(autouse=True)
#     def my_model_type(self) -> Type[BaseModel]:
#         self.registry = Registry(keys=["my_type"])
#         self.register = self.registry.register("my_type")  # type: ignore[arg-type]

#         @self.register
#         class MyModel(BaseModel):
#             i: int
#             s: str

#         return MyModel

#     def test_reference_type_success(
#         self, my_model_type: Type[BaseModel], monkeypatch: pytest.MonkeyPatch
#     ) -> None:
#         monkeypatch.setattr(
#             "fastagency.models._registry.Registry.get_default", lambda: self.registry
#         )

#         ref_type = self.registry.get_reference_type("my_type", "MyModel")

#         assert ref_type is not None
#         assert ref_type.__name__ == "ObjectReferenceMyType"

#         ref_type(uuid=uuid.uuid4(), type="my_type", name="MyModel")

#         # checkout the schema
#         expected = {
#             "properties": {
#                 "uuid": {
#                     "description": "The unique identifier",
#                     "format": "uuid",
#                     "title": "UUID",
#                     "type": "string",
#                 },
#                 "type": {
#                     "const": "my_type",
#                     "default": "my_type",
#                     "description": "The name of the type of the data",
#                     "enum": ["my_type"],
#                     "title": "Type",
#                     "type": "string",
#                 },
#                 "name": {
#                     "const": "MyModel",
#                     "default": "MyModel",
#                     "description": "The name of the data",
#                     "enum": ["MyModel"],
#                     "title": "Name",
#                     "type": "string",
#                 },
#             },
#             "required": ["uuid"],
#             "title": "ObjectReferenceMyType",
#             "type": "object",
#         }
#         schema = ref_type.model_json_schema()
#         assert schema == expected

#     def test_reference_type_fail_on_type(
#         self, my_model_type: Type[BaseModel], monkeypatch: pytest.MonkeyPatch
#     ) -> None:
#         monkeypatch.setattr(
#             "fastagency.models._registry.Registry.get_default", lambda: self.registry
#         )

#         ref_type = self.registry.get_reference_type("my_type", "MyModel")

#         assert ref_type is not None
#         assert ref_type.__name__ == "ObjectReferenceMyType"

#         with pytest.raises(
#             ValueError, match="1 validation error for _ObjectReferenceDynamic"
#         ):
#             ref_type(uuid=uuid.uuid4(), type="unknown", name="MyModel")

#     def test_reference_type_fail_on_name(
#         self, my_model_type: Type[BaseModel], monkeypatch: pytest.MonkeyPatch
#     ) -> None:
#         monkeypatch.setattr(
#             "fastagency.models._registry.Registry.get_default", lambda: self.registry
#         )

#         ref_type = self.registry.get_reference_type("my_type", "MyModel")

#         assert ref_type is not None
#         assert ref_type.__name__ == "ObjectReferenceMyType"

#         with pytest.raises(
#             ValueError, match="1 validation error for _ObjectReferenceDynamic"
#         ):
#             ref_type(uuid=uuid.uuid4(), type="my_type", name="Unknown")
