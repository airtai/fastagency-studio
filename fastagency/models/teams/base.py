from typing import Annotated, List, Literal, Union

from autogen.agentchat import ConversableAgent
from pydantic import Field
from typing_extensions import TypeAlias

from ..base import Model
from ..registry import Registry
from ..toolboxes.toolbox import FunctionInfo

__all__ = ["TeamBaseModel", "agent_type_refs"]

# Agents can work with any LLM, so we construct a union of all LLM references
agent_type_refs: TypeAlias = Union[  # type: ignore[valid-type]
    tuple(Registry.get_default().get_models_refs_by_type("agent"))
]


class TeamBaseModel(Model):
    termination_message_regex: Annotated[
        str,
        Field(
            description="Whether the message is a termination message or not. If it is a termination message, the agent will not respond to it."
        ),
    ] = "^TERMINATE$"

    human_input_mode: Annotated[
        Literal["ALWAYS", "TERMINATE", "NEVER"],
        Field(
            title="Human input mode",
            description="Mode for human input",
        ),
    ] = "ALWAYS"


def register_toolbox_functions(
    agent: ConversableAgent,
    execution_agents: List[ConversableAgent],
    function_infos: List[FunctionInfo],
) -> None:
    for function_info in function_infos:
        agent.register_for_llm(
            name=function_info.name,
            description=function_info.description,
        )(function_info.function)

        for execution_agent in execution_agents:
            execution_agent.register_for_execution()(function_info.function)
