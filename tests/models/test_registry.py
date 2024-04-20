import uuid
from typing import Type

import pytest

from fastagency.models._registry import Registry, UUIDModel


class TestRegistry:
    @pytest.fixture()
    def my_model_type(self) -> Type[UUIDModel]:
        self.registry = Registry()

        @self.registry.register("llm")
        class MyModel(UUIDModel):
            i: int
            s: str

        return MyModel

    def test_register_under_the_same_name(self, my_model_type: Type[UUIDModel]) -> None:
        with pytest.raises(
            ValueError, match="Class 'MyModel' already registered as 'llm'"
        ):
            self.registry.register("llm")(my_model_type)

    def test_validate_model(self, my_model_type: Type[UUIDModel]) -> None:
        model = my_model_type(uuid=uuid.uuid4(), i=1, s="hello")
        self.registry.validate("llm", model.model_dump(), "MyModel")

    def test_validate_unregistred_model(self, my_model_type: Type[UUIDModel]) -> None:
        with pytest.raises(
            ValueError, match="Model 'UnregistredModel' not found as 'llm'"
        ):
            self.registry.validate("llm", {}, "UnregistredModel")

    def test_validate_corrupted_model(self, my_model_type: Type[UUIDModel]) -> None:
        with pytest.raises(ValueError, match="validation errors"):
            self.registry.validate("llm", {"a": "b"}, "MyModel")
