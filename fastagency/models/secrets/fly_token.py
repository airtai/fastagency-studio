from typing import Annotated
from uuid import UUID

from pydantic import Field
from typing_extensions import TypeAlias

from ..base import Model
from ..registry import register

__all__ = ["FlyToken"]


@register("secret")
class FlyToken(Model):
    fly_token: Annotated[
        str, Field(description="The Fly.io token to use for deploying the application")
    ]

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> str:
        my_model = await cls.from_db(model_id)

        return my_model.fly_token


FlyTokenRef: TypeAlias = FlyToken.get_reference_model()  # type: ignore[valid-type]
