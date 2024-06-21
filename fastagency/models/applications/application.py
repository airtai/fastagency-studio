from typing import Annotated, Any, Union
from uuid import UUID

from pydantic import Field
from typing_extensions import TypeAlias

from ..base import Model
from ..registry import Registry
from ..secrets.fly_token import FlyToken
from ..secrets.github_token import GitHubToken

__all__ = ["Application"]

# Applications can work with any Team, so we construct a union of all Team references
team_type_refs: TypeAlias = Union[  # type: ignore[valid-type]
    tuple(Registry.get_default().get_models_refs_by_type("team"))
]

# Applications can work with any FlyIO Tokens, so we construct a union of all FlyIO Token references
FlyTokenRef: TypeAlias = FlyToken.get_reference_model()  # type: ignore[valid-type]

# Applications can work with any GitHub Tokens, so we construct a union of all GitHub Token references
GitHubTokenRef: TypeAlias = GitHubToken.get_reference_model()  # type: ignore[valid-type]


@Registry.get_default().register("application")
class Application(Model):
    name: Annotated[
        str, Field(..., description="The name of the item", min_length=1, max_length=30)
    ]
    team: Annotated[
        team_type_refs,
        Field(
            title="Team name",
            description="The team that is used in the application",
        ),
    ]
    gh_token: GitHubTokenRef
    fly_token: FlyTokenRef

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> Any:
        raise NotImplementedError
