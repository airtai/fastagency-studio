from typing import Annotated, Any, Dict, List, Optional, Tuple
from uuid import UUID

from autogen import ConversableAgent, GroupChat, GroupChatManager
from pydantic import Field

from ..registry import Registry
from ..toolboxes.toolbox import FunctionInfo
from .base import TeamBaseModel, agent_type_refs, register_toolbox_functions

__all__ = ["MultiAgentTeam"]

registry = Registry.get_default()


class AutogenMultiAgentTeam:
    def __init__(
        self,
        agents_and_functions: List[Tuple[ConversableAgent, List[FunctionInfo]]],
    ) -> None:
        self.agents = [agent for agent, _ in agents_and_functions]
        self.functions = [functions for _, functions in agents_and_functions]

        for i, (agent, functions) in enumerate(agents_and_functions):
            other_agents = [
                other_agent
                for j, (other_agent, _) in enumerate(agents_and_functions)
                if i != j
            ]
            register_toolbox_functions(agent, other_agents, functions)

    def initiate_chat(self, message: str) -> List[Dict[str, Any]]:
        groupchat = GroupChat(agents=self.agents, messages=[])
        manager = GroupChatManager(groupchat=groupchat)
        return self.agents[0].initiate_chat(  # type: ignore[no-any-return]
            recipient=manager, message=message
        )


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
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> Any:
        my_model = await cls.from_db(model_id)

        agents_and_functions: List[Tuple[ConversableAgent, List[FunctionInfo]]] = []
        for i in range(5):
            agent_property = getattr(my_model, f"agent_{i+1}")
            if agent_property is None:
                continue

            agent_model = await agent_property.get_data_model().from_db(
                agent_property.uuid
            )

            agent, functions = await agent_model.create_autogen(
                getattr(my_model, f"agent_{i+1}").uuid, user_id
            )
            agents_and_functions.append((agent, functions))

        return AutogenMultiAgentTeam(agents_and_functions)
