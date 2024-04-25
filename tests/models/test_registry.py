import pytest

from fastagency.models.base import Model
from fastagency.models.registry import ModelSchema, Registry


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
        class MySecret(Model):
            key: str

        with pytest.raises(ValueError, match="Reference already created for the model"):
            registry.create_reference(type_name="my_secret", model_name="MySecret")

    def test_register_simple_success(self) -> None:
        registry = Registry()

        @registry.register("my_type")
        class MyModel(Model):
            i: int
            s: str

        MyModelRef = MyModel.get_reference_model()  # noqa: N806
        assert registry._store["my_type"]["MyModel"] == (MyModel, MyModelRef)

    def test_register_complex_with_ref_success(self) -> None:
        registry = Registry()

        MySecretRef = registry.create_reference(  # noqa: N806
            type_name="my_secret", model_name="MySecret"
        )

        @registry.register("my_type")
        class MyModel(Model):
            i: int
            s: str
            secret: MySecretRef  # type: ignore[valid-type]

        MyModelRef = MyModel.get_reference_model()  # noqa: N806
        assert registry._store["my_type"]["MyModel"] == (MyModel, MyModelRef)

    def test_register_complex_with_nested_model_success(self) -> None:
        registry = Registry()

        @registry.register("my_secret")
        class MySecret(Model):
            key: str

        MySecretRef = MySecret.get_reference_model()  # noqa: N806

        @registry.register("my_type")
        class MyModel(Model):
            i: int
            s: str
            secret: MySecretRef  # type: ignore[valid-type]

        MyModelRef = MyModel.get_reference_model()  # noqa: N806
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
        class MySecret(Model):
            key: str

        assert registry.get_dongling_references() == []

    def test_get_model_schema_simple(self) -> None:
        registry = Registry()

        @registry.register("my_type")
        class MyModel(Model):
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
        class MySecret(Model):
            key: str

        MySecretRef = MySecret.get_reference_model()  # noqa: N806

        @registry.register("my_type")
        class MyModel(Model):
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
        class MyModel(Model):
            i: int
            s: str

        schemas = registry.get_model_schemas("my_type")
        assert len(schemas.schemas) == 1
        assert schemas.schemas[0].name == "MyModel"

    def test_get_schemas_simple(self) -> None:
        registry = Registry()

        @registry.register("my_type")
        class MyModel(Model):
            i: int
            s: str

        schemas = registry.get_schemas()
        assert len(schemas.list_of_schemas) == 1
        assert len(schemas.list_of_schemas[0].schemas) == 1
        assert schemas.list_of_schemas[0].schemas[0].name == "MyModel"

    # @pytest.mark.skip(reason="Not implemented")
    # def test_validate_complex_success(self) -> None:
    #     registry = Registry()

    #     @registry.register("my_secret")
    #     class MySecret(Model):
    #         key: str

    #     MySecretRef = MySecret.get_reference_model()

    #     @registry.register("my_type")
    #     class MyModel(Model):
    #         i: int
    #         s: str
    #         secret: MySecretRef  # type: ignore[valid-type]

    #     secret = MySecretRef.create(uuid=uuid.uuid4())
    #     model = MyModel(i=1, s="a", secret=secret)

    #     wrapper = MyModel.get_wrapper_model().create(uuid=uuid.uuid4(), data=model)
    #     registry.validate(wrapper)

    #     wrapper_from_json = ObjectWrapper.model_validate_json(wrapper.model_dump_json())
    # data = wrapper_from_json.data
    # print()
    # print(f"test_validate_complex_success({data=}): {type(data)=}")
    # print()
    # registry.validate(wrapper)

    # model_json = json.loads(wrapper.model_dump_json())

    # registry.validate(model_json)
