from typing import Annotated, Optional, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field

from ._base import UUIDModel, register

BM = TypeVar("BM", bound=Type[BaseModel])

# _agent_registry: Dict[str, Type[BaseModel]] = {}


# def register_agent(m: BM) -> BM:
#     name = m.__name__  # type: ignore[attr-defined]
#     if name in _agent_registry:
#         raise ValueError(f"Model '{name}' already registered")

#     _agent_registry[name] = m

#     return m


# def list_agents() -> List[str]:
#     return list(_agent_registry.keys())


# def get_agent_type(name: str) -> Type[BaseModel]:
#     return _agent_registry[name]


class AgentBaseModel(UUIDModel):
    name: Annotated[str, Field(description="The name of the agent")]
    llm_uuid: Annotated[
        UUID,
        Field(
            title="LLM UUID", description="The unique identifier for the LLM instance"
        ),
    ]


@register
class AssistantAgent(AgentBaseModel):
    system_message: Annotated[
        str,
        Field(
            description="The system message of the agent. This message is used to inform the agent about his role in the conversation"
        ),
    ]


@register
class WebSurferAgent(AgentBaseModel):
    summarizer_llm_uuid: Annotated[
        UUID,
        Field(
            title="Summarizer LLM UUID",
            description="The unique identifier for the summarizer model instance",
        ),
    ]
    viewport_size: Annotated[
        int, Field(description="The viewport size of the browser")
    ] = 1080
    bing_api_key: Annotated[
        Optional[str], Field(description="The Bing API key for the browser")
    ] = None
