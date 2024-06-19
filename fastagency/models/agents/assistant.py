from typing import Annotated, List, Tuple
from uuid import UUID

import autogen
from pydantic import Field

from ...openapi.client import Client
from ..registry import register
from .base import AgentBaseModel


@register("agent")
class AssistantAgent(AgentBaseModel):
    system_message: Annotated[
        str,
        Field(
            description="The system message of the agent. This message is used to inform the agent about his role in the conversation"
        ),
    ]

    @classmethod
    async def create_autogen(
        cls, model_id: UUID, user_id: UUID
    ) -> Tuple[autogen.agentchat.AssistantAgent, List[Client]]:
        my_model = await cls.from_db(model_id)

        llm_model = await my_model.llm.get_data_model().from_db(my_model.llm.uuid)

        llm = await llm_model.create_autogen(my_model.llm.uuid, user_id)

        clients = await my_model.get_clients_from_toolboxes(user_id)

        agent_name = my_model.name

        agent = autogen.agentchat.AssistantAgent(
            name=agent_name,
            llm_config=llm,
            system_message=my_model.system_message,
            code_execution_config=False,
        )
        return agent, clients
