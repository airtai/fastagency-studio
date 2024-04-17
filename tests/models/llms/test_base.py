from typing import Iterator, Type

import pytest
from pydantic import BaseModel

from fastagency.models.llms._base import validate_model
from fastagency.models.llms._registry import _llm_registry, register_llm


class TestValidateModel:
    @pytest.fixture()
    def my_model_type(self) -> Iterator[Type[BaseModel]]:
        @register_llm
        class MyModel(BaseModel):
            i: int
            s: str

        try:
            yield MyModel
        finally:
            _llm_registry.pop("MyModel")

    def test_validate_model(self, my_model_type: Type[BaseModel]) -> None:
        model = my_model_type(i=1, s="hello")
        validate_model(model.model_dump(), "MyModel")
