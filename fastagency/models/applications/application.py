from typing import Annotated, Any, Union
from uuid import UUID

from pydantic import Field
from typing_extensions import TypeAlias

from ..base import Model
from ..registry import Registry

__all__ = ["Application"]

# Applications can work with any Team, so we construct a union of all Team references
team_type_refs: TypeAlias = Union[  # type: ignore[valid-type]
    tuple(Registry.get_default().get_models_refs_by_type("team"))
]


@Registry.get_default().register("application")
class Application(Model):
    team: Annotated[
        team_type_refs,
        Field(
            title="Team name",
            description="The team that is used in the application",
        ),
    ]

    @classmethod
    def create_autogen(cls, model_id: UUID, user_id: UUID) -> Any:
        raise NotImplementedError
