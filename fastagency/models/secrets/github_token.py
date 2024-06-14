from typing import Annotated
from uuid import UUID

from pydantic import Field

from ..base import Model
from ..registry import register

__all__ = ["GitHubToken"]


@register("secret")
class GitHubToken(Model):
    gh_token: Annotated[
        str, Field(description="The GitHub token to use for creating a new repository")
    ]

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> str:
        my_model = await cls.from_db(model_id)

        return my_model.gh_token
