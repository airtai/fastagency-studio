from typing import Annotated, Optional, Union

from pydantic import Field

from ..llms.azure import AzureOAIAPIKeyRef
from ..llms.openai import OpenAIAPIKeyRef
from ..registry import register
from ._base import AgentBaseModel

# todo: this should be a mixin


@register("agent")
class WebSurferAgent(AgentBaseModel):
    summarizer_llm: Annotated[
        Union[OpenAIAPIKeyRef, AzureOAIAPIKeyRef],
        Field(
            title="Summarizer LLM",
            description="This LLM will be used to generated summary of all pages visited",
        ),
    ]
    viewport_size: Annotated[
        int, Field(description="The viewport size of the browser")
    ] = 1080
    bing_api_key: Annotated[
        Optional[str], Field(description="The Bing API key for the browser")
    ] = None
