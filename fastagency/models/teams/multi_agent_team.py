from typing import Annotated, Any, Dict, List, Optional
from uuid import UUID

from asyncer import syncify
from autogen import GroupChat, GroupChatManager
from pydantic import Field

from fastagency.db.helpers import find_model_using_raw

from ..registry import Registry
from .base import TeamBaseModel, agent_type_refs

__all__ = ["MultiAgentTeam"]

registry = Registry.get_default()


@registry.register("team")
class MultiAgentTeam(TeamBaseModel):
    agent_1: Annotated[
        agent_type_refs,
        Field(
            title="Agents",
            description="An agent in the team",
        ),
    ]
    agent_2: Annotated[
        agent_type_refs,
        Field(
            title="Agents",
            description="An agent in the team",
        ),
    ]
    agent_3: Annotated[
        Optional[agent_type_refs],
        Field(
            title="Agents",
            description="An agent in the team",
        ),
    ] = None
    agent_4: Annotated[
        Optional[agent_type_refs],
        Field(
            title="Agents",
            description="An agent in the team",
        ),
    ] = None
    agent_5: Annotated[
        Optional[agent_type_refs],
        Field(
            title="Agents",
            description="An agent in the team",
        ),
    ] = None

    @classmethod
    def create_autogen(cls, model_id: UUID, user_id: UUID) -> Any:
        my_model_dict = syncify(find_model_using_raw)(model_id, user_id)
        my_model = cls(**my_model_dict["json_str"])

        agents = {}
        for i in range(5):
            agent_property = getattr(my_model, f"agent_{i+1}")
            if agent_property is None:
                continue

            agent_dict = syncify(find_model_using_raw)(
                getattr(my_model, f"agent_{i+1}").uuid, user_id
            )
            agent_model = getattr(my_model, f"agent_{i+1}").get_data_model()(
                **agent_dict["json_str"]
            )
            agent = agent_model.create_autogen(
                getattr(my_model, f"agent_{i+1}").uuid, user_id
            )
            agents[f"agent_{i+1}"] = agent

        class AutogenMultiAgentTeam:
            def __init__(
                self,
                agent_1: agent_type_refs,
                agent_2: agent_type_refs,
                agent_3: Optional[agent_type_refs] = None,
                agent_4: Optional[agent_type_refs] = None,
                agent_5: Optional[agent_type_refs] = None,
            ) -> None:
                self.agent_1 = agent_1
                self.agent_2 = agent_2
                self.agent_3 = agent_3
                self.agent_4 = agent_4
                self.agent_5 = agent_5
                self.agents = [
                    getattr(self, f"agent_{i+1}")
                    for i in range(5)
                    if getattr(self, f"agent_{i+1}") is not None
                ]

            def initiate_chat(self, message: str) -> List[Dict[str, Any]]:
                groupchat = GroupChat(agents=self.agents, messages=[])
                manager = GroupChatManager(groupchat=groupchat)
                return self.agent_1.initiate_chat(  # type: ignore[no-any-return]
                    recipient=manager, message=message
                )

        return AutogenMultiAgentTeam(**agents)
