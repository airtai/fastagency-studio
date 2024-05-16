from typing import Annotated, Any, Optional
from uuid import UUID

from pydantic import Field
from typing_extensions import TypeAlias

from ..base import Model
from ..registry import register
from .base import AgentBaseModel, llm_type_refs

# todo: this should be a mixin


@register("secret")
class BingAPIKey(Model):
    api_key: Annotated[str, Field(description="The API Key from OpenAI")]


BingAPIKeyRef: TypeAlias = BingAPIKey.get_reference_model()  # type: ignore[valid-type]


@register("agent")
class WebSurferAgent(AgentBaseModel):
    summarizer_llm: Annotated[
        llm_type_refs,
        Field(
            title="Summarizer LLM",
            description="This LLM will be used to generated summary of all pages visited",
        ),
    ]
    viewport_size: Annotated[
        int, Field(description="The viewport size of the browser")
    ] = 1080
    bing_api_key: Annotated[
        Optional[BingAPIKeyRef], Field(description="The Bing API key for the browser")
    ] = None

    @classmethod
    def create_autogen(cls, model_id: UUID, user_id: UUID) -> Any:
        pass
