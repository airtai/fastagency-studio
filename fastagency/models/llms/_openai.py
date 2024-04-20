from typing import Annotated, Literal

from pydantic import Field, HttpUrl

from ...constants import OPENAI_MODELS_LITERAL
from ._base import UUIDModel, register

__all__ = ["OpenAI"]


@register
class OpenAI(UUIDModel):
    model: Annotated[  # type: ignore[valid-type]
        Literal[OPENAI_MODELS_LITERAL],
        Field(description="The model to use for the OpenAI API, e.g. 'gpt-3.5-turbo'"),
    ] = "gpt-3.5-turbo"
    api_key: Annotated[
        str,
        Field(
            title="API Key",
            description="The API key for the OpenAI API, e.g. 'sk-1234567890abcdef1234567890abcdef'",
        ),
    ]
    base_url: Annotated[
        HttpUrl, Field(description="The base URL of the OpenAI API")
    ] = HttpUrl(url="https://api.openai.com/v1")
    api_type: Annotated[
        Literal["openai"],
        Field(title="API Type", description="The type of the API, must be 'openai'"),
    ] = "openai"
