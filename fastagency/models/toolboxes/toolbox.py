from typing import Annotated, Any, Optional
from uuid import UUID

from asyncer import syncify
from pydantic import AfterValidator, Field, HttpUrl
from typing_extensions import TypeAlias

from ...db.helpers import find_model_using_raw
from ..base import Model
from ..registry import Registry
from ..secrets import OpenAPIAuthRef  # type: ignore[attr-defined]

# Pydantic adds trailing slash automatically to URLs, so we need to remove it
# https://github.com/pydantic/pydantic/issues/7186#issuecomment-1691594032
URL = Annotated[HttpUrl, AfterValidator(lambda x: str(x).rstrip("/"))]

__all__ = [
    "Toolbox",
    "ToolboxRef",
]


@Registry.get_default().register("toolbox")
class Toolbox(Model):
    openapi_url: Annotated[
        URL,
        Field(
            title="openapi url",
            description="URL of openapi spec file",
        ),
    ]
    openapi_auth: Annotated[
        Optional[OpenAPIAuthRef],
        Field(
            title="openapi auth",
            description="Authentication info for the api mentioned in openapi spec",
        ),
    ] = None

    @classmethod
    def create_autogen(cls, model_id: UUID, user_id: UUID) -> Any:
        my_model_dict = syncify(find_model_using_raw)(model_id, user_id)
        my_model = cls(**my_model_dict["json_str"])  # noqa: F841

        # ToDo: Generate api spec client


ToolboxRef: TypeAlias = Toolbox.get_reference_model()  # type: ignore[valid-type]
