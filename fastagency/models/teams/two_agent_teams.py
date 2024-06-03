from typing import Annotated, Any, Dict, List
from uuid import UUID

import autogen
from pydantic import Field

from ..registry import Registry
from .base import TeamBaseModel, agent_type_refs

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
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> Any:
        my_model = await cls.from_db(model_id)

        initial_agent_model = await my_model.initial_agent.get_data_model().from_db(
            my_model.initial_agent.uuid
        )
        initial_agent = await initial_agent_model.create_autogen(
            my_model.initial_agent.uuid, user_id
        )

        secondary_agent_model = await my_model.secondary_agent.get_data_model().from_db(
            my_model.secondary_agent.uuid
        )
        secondary_agent = await secondary_agent_model.create_autogen(
            my_model.secondary_agent.uuid, user_id
        )

        class AutogenTwoAgentTeam:
            def __init__(
                self, initial_agent: agent_type_refs, secondary_agent: agent_type_refs
            ) -> None:
                self.initial_agent = initial_agent
                self.secondary_agent = secondary_agent

                if isinstance(self.initial_agent, autogen.agentchat.AssistantAgent):
                    assistant_agent = self.initial_agent
                    user_proxy_agent = self.secondary_agent
                elif isinstance(self.initial_agent, autogen.agentchat.UserProxyAgent):
                    user_proxy_agent = self.initial_agent
                    assistant_agent = self.secondary_agent
                else:
                    raise ValueError(
                        "Agents must be of type AssistantAgent and UserProxyAgent"
                    )

                @user_proxy_agent.register_for_execution()  # type: ignore [misc]
                @assistant_agent.register_for_llm(
                    description="Get weather forecast for a city"
                )  # type: ignore [misc]
                def get_forecast_for_city(city: str) -> str:
                    return f"The weather in {city} is sunny today."

            def initiate_chat(self, message: str) -> List[Dict[str, Any]]:
                return self.initial_agent.initiate_chat(  # type: ignore[no-any-return]
                    recipient=self.secondary_agent, message=message
                )

        return AutogenTwoAgentTeam(initial_agent, secondary_agent)
