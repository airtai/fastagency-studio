from typing import Annotated, Optional, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field

from ._base import AgentBaseModel, register

BM = TypeVar("BM", bound=Type[BaseModel])


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
