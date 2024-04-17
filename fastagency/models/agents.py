from typing import Annotated, Dict, List, Optional, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field

BM = TypeVar("BM", bound=Type[BaseModel])

_agent_registry: Dict[str, Type[BaseModel]] = {}


def register_agent(m: BM) -> BM:
    name = m.__name__  # type: ignore[attr-defined]
    if name in _agent_registry:
        raise ValueError(f"Model '{name}' already registered")

    _agent_registry[name] = m

    return m


def list_agents() -> List[str]:
    return list(_agent_registry.keys())


def get_agent_type(name: str) -> Type[BaseModel]:
    return _agent_registry[name]


class _DefaultModel(BaseModel):
    uuid: Annotated[
        UUID,
        Field(title="UUID", description="The unique identifier for agent instance"),
    ]
    name: Annotated[str, Field(description="The name of the agent")]
    llm_uuid: Annotated[
        UUID,
        Field(
            title="LLM UUID", description="The unique identifier for the model instance"
        ),
    ]


@register_agent
class AssistantAgent(_DefaultModel):
    system_message: Annotated[
        str,
        Field(
            description="The system message of the agent. This message is used to inform the agent about his role in the conversation"
        ),
    ]


@register_agent
class WebSurferAgent(_DefaultModel):
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
