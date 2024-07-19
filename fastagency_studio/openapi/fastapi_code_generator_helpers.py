from contextlib import contextmanager
from functools import cached_property
from typing import Iterator, List, Optional, Union

from fastapi_code_generator.parser import (
    Argument,
    OpenAPIParser,
    ParameterObject,
    ReferenceObject,
)


class ArgumentWithDescription(Argument):  # type: ignore[misc]
    description: Optional[str] = None

    @cached_property
    def argument(self) -> str:
        if self.description:
            description = self.description.replace('"""', '"""')
            type_hint = f'Annotated[{self.type_hint}, """{description}"""]'
        else:
            type_hint = self.type_hint

        if self.default is None and self.required:
            return f"{self.name}: {type_hint}"

        return f"{self.name}: {type_hint} = {self.default}"


@contextmanager
def patch_get_parameter_type() -> Iterator[None]:
    original_get_parameter_type = OpenAPIParser.get_parameter_type

    def get_parameter_type(
        self: OpenAPIParser,
        parameters: Union[ReferenceObject, ParameterObject],
        snake_case: bool,
        path: List[str],
    ) -> Optional[Argument]:
        # get the original argument
        argument = original_get_parameter_type(self, parameters, snake_case, path)

        # add description to the argument
        parameters = self.resolve_object(parameters, ParameterObject)
        argument_with_description = ArgumentWithDescription(
            description=parameters.description, **argument.model_dump()
        )
        return argument_with_description

    OpenAPIParser.get_parameter_type = get_parameter_type

    try:
        yield
    finally:
        OpenAPIParser.get_parameter_type = original_get_parameter_type
