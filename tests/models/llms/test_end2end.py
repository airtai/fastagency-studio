from uuid import UUID

from fastagency.helpers import create_model_ref
from fastagency.models.agents.assistant import AssistantAgent
from fastagency.models.base import ObjectReference
from fastagency.models.teams.two_agent_teams import TwoAgentTeam

from ...conftest import add_random_sufix


async def end2end_simple_chat_with_two_agents(
    llm_ref: ObjectReference,
    user_uuid: str,
) -> None:
    agent_1_ref = await create_model_ref(
        AssistantAgent,
        "agent",
        user_uuid=user_uuid,
        llm=llm_ref,
        name=add_random_sufix("agent"),
        system_message="You are a helpful assistant and your task is to answer to questions.",
    )

    agent_2_ref = await create_model_ref(
        AssistantAgent,
        "agent",
        user_uuid=user_uuid,
        llm=llm_ref,
        name=add_random_sufix("agent"),
        system_message="You are a answer checker and your task is to verify the answers. If the answer is answered correctly, terminate the chat by outputting 'TERMINATE'. If the answer is incorrect, ask for correction.",
    )
    team_ref = await create_model_ref(
        TwoAgentTeam,
        "team",
        user_uuid=user_uuid,
        name=add_random_sufix("team"),
        initial_agent=agent_2_ref,
        secondary_agent=agent_1_ref,
    )

    ag_team = await TwoAgentTeam.create_autogen(
        model_id=team_ref.uuid, user_id=UUID(user_uuid)
    )

    chat_result = ag_team.initiate_chat(
        message="What is 2+2?",
    )

    messages = [msg["content"] for msg in chat_result.chat_history]
    assert any("4" in msg for msg in messages), messages
