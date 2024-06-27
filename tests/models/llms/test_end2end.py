from typing import Any, Dict

from autogen.agentchat import AssistantAgent

# from fastagency.models.agents.assistant import AssistantAgent
from ...conftest import add_random_sufix


def end2end_simple_chat_with_two_agents(
    llm_config: Dict[str, Any],
) -> None:
    flags: Dict[str, bool] = {"terminated": False}

    def is_termination_msg(msg: Dict[str, Any]) -> bool:
        flags["terminated"] = "TERMINATE" in msg["content"]
        return flags["terminated"]

    for question, answer_part in zip(
        ["What is 2+2?", "What was the largest city in the world in 2000?"],
        ["4", "Tokyo"],
    ):
        flags["terminated"] = False

        assistant_agent = AssistantAgent(
            name=add_random_sufix("assistant"),
            llm_config=llm_config,
            system_message="You are a helpful assistant.",
            code_execution_config=False,
            is_termination_msg=is_termination_msg,
            human_input_mode="NEVER",
            max_consecutive_auto_reply=10,
        )

        verifier_agent = AssistantAgent(
            name=add_random_sufix("verifier"),
            llm_config=llm_config,
            system_message="""You are a verifier responsible for checking if other agents are giving correct answers. Please write a
    few sentencases with your thoughs about the answer before classifying it as correct or not.
    If the answer is correct, please finalize your analysis with word 'TERMINATE' to end the conversation.
    Otherwise, give a detailed feedback and help the agent in providing a correct answer.
    """,
            code_execution_config=False,
            is_termination_msg=is_termination_msg,
            human_input_mode="NEVER",
            max_consecutive_auto_reply=10,
        )

        chat_result = verifier_agent.initiate_chat(
            assistant_agent,
            message=question,
        )

        messages = [msg["content"] for msg in chat_result.chat_history]
        assert any(answer_part in msg for msg in messages), messages
        assert flags["terminated"], messages
