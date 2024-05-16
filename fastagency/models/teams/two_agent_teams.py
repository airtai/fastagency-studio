from typing import Annotated, Any
from uuid import UUID

from pydantic import Field

from ..registry import Registry
from .base import TeamBaseModel, agent_type_refs
from ...db.helpers import find_model_using_raw

__all__ = ["TwoAgentTeam"]


@Registry.get_default().register("team")
class TwoAgentTeam(TeamBaseModel):
    initial_agent: Annotated[
        agent_type_refs,
        Field(
            title="Initial agent",
            description="Agent that starts the conversation",
        ),
    ]
    secondary_agent: Annotated[
        agent_type_refs,
        Field(
            title="Secondary agent",
            description="Agent that continues the conversation",
        ),
    ]

    @classmethod
    def create_autogen(cls, model_id: UUID, user_id: UUID) -> Any:
        my_model_dict = find_model_using_raw(model_id, user_id)
        my_model = cls(**my_model_dict)

        initial_agent_dict = find_model_using_raw(my_model.initial_agent.uuid, user_id)
        initial_agent_model = my_model.initial_agent.get_data_model()(**initial_agent_dict)
        initial_agent = initial_agent_model.create_autogen(my_model.initial_agent.uuid, user_id)

        secondary_agent_dict = find_model_using_raw(my_model.secondary_agent.uuid, user_id)
        secondary_agent_model = my_model.secondary_agent.get_data_model()(**secondary_agent_dict)
        secondary_agent = secondary_agent_model.create_autogen(my_model.secondary_agent.uuid, user_id)

        class AutogenTwoAgentTeam:
            def __init__(self, initial_agent, secondary_agent):
                self.initial_agent = initial_agent
                self.secondary_agent = secondary_agent

            def initiate_chat(self, message) -> None:
                self.initial_agent.initiate_chat(self.secondary_agent, message)

        return AutogenTwoAgentTeam(initial_agent, secondary_agent)
