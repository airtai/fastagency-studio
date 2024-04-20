import uuid
from typing import Type

import pytest

from fastagency.models._registry import Registry, UUIDModel


class TestRegistry:
    @pytest.fixture()
    def my_model_type(self) -> Type[UUIDModel]:
        self.registry = Registry("my registry")

        @self.registry.register
        class MyModel(UUIDModel):
            i: int
            s: str

        return MyModel

    def test_register_under_the_same_name(self, my_model_type: Type[UUIDModel]) -> None:
        with pytest.raises(
            ValueError, match="Class 'MyModel' already registered in 'my registry'"
        ):
            self.registry.register(my_model_type)

    def test_validate_model(self, my_model_type: Type[UUIDModel]) -> None:
        model = my_model_type(uuid=uuid.uuid4(), i=1, s="hello")
        self.registry.validate(model.model_dump(), "MyModel")

    def test_validate_unregistred_model(self, my_model_type: Type[UUIDModel]) -> None:
        with pytest.raises(
            ValueError, match="Model 'UnregistredModel' not found in 'my registry"
        ):
            self.registry.validate({}, "UnregistredModel")

    def test_validate_corrupted_model(self, my_model_type: Type[UUIDModel]) -> None:
        with pytest.raises(ValueError, match="validation errors"):
            self.registry.validate({"a": "b"}, "MyModel")
