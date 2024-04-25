from typing import Annotated, Literal

from pydantic import Field, HttpUrl, model_validator
from typing_extensions import Self, TypeAlias

from ...constants import OPENAI_MODELS_LITERAL
from ..base import Model
from ..registry import register

__all__ = [
    "OpenAIAPIKey",
    "OpenAI",
]


@register("secret")
class OpenAIAPIKey(Model):
    api_key: Annotated[str, Field(description="The API Key from OpenAI")]

    @model_validator(mode="after")
    def check(self) -> Self:
        if not self.api_key.startswith("sk-"):
            raise ValueError("API Key must start with 'sk-'")

        return self


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
