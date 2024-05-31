from typing import Annotated, Tuple
from uuid import UUID

from asyncer import syncify
from pydantic import Field
from typing_extensions import TypeAlias

from ...db.helpers import find_model_using_raw
from ..base import Model
from ..registry import register

__all__ = [
    "OpenAPIAuth",
    "OpenAPIAuthRef",
]


@register("secret")
class OpenAPIAuth(Model):
    username: Annotated[
        str,
        Field(
            description="username for openapi routes authentication",
        ),
    ]
    password: Annotated[
        str,
        Field(
            description="password for openapi routes authentication",
        ),
    ]

    @classmethod
    def create_autogen(cls, model_id: UUID, user_id: UUID) -> Tuple[str, str]:
        my_model_dict = syncify(find_model_using_raw)(model_id)
        my_model = cls(**my_model_dict["json_str"])

        return my_model.username, my_model.password


OpenAPIAuthRef: TypeAlias = OpenAPIAuth.get_reference_model()  # type: ignore[valid-type]
