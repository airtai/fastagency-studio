from typing import Annotated, Literal

from pydantic import Field, HttpUrl, field_validator
from typing_extensions import TypeAlias

from ...constants import OPENAI_MODELS_LITERAL
from ..base import Model
from ..registry import register

__all__ = [
    "OpenAIAPIKey",
    "OpenAI",
]


@register("secret")
class OpenAIAPIKey(Model):
    api_key: Annotated[
        str,
        Field(
            description="The API Key from OpenAI",
            pattern=r"sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20}",
        ),
    ]

    @field_validator("api_key")
    @classmethod
    def check_api_key(cls, v: str) -> str:
        if not v.startswith("sk-"):
            raise ValueError("API Key must start with 'sk-'")

        return v


OpenAIAPIKeyRef: TypeAlias = OpenAIAPIKey.get_reference_model()  # type: ignore[valid-type]


@register("llm")
class OpenAI(Model):
    model: Annotated[  # type: ignore[valid-type]
        Literal[OPENAI_MODELS_LITERAL],
        Field(description="The model to use for the OpenAI API, e.g. 'gpt-3.5-turbo'"),
    ] = "gpt-3.5-turbo"

    api_key: OpenAIAPIKeyRef

    base_url: Annotated[
        HttpUrl, Field(description="The base URL of the OpenAI API")
    ] = HttpUrl(url="https://api.openai.com/v1")

    api_type: Annotated[
        Literal["openai"],
        Field(title="API Type", description="The type of the API, must be 'openai'"),
    ] = "openai"
