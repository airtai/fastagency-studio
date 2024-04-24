from typing import Annotated, Literal

from pydantic import BaseModel, Field, HttpUrl, model_validator
from typing_extensions import Self, TypeAlias

from ...constants import OPENAI_MODELS_LITERAL
from ..registry import get_reference_model, get_wrapper_model, register

__all__ = [
    "OpenAIAPIKey",
    "OpenAIAPIKeyRef",
    "OpenAIAPIKeyWrapper",
    "OpenAI",
    "OpenAIRef",
    "OpenAIWrapper",
]


@register("secret")
class OpenAIAPIKey(BaseModel):
    api_key: Annotated[str, Field(description="The API Key from OpenAI")]

    @model_validator(mode="after")
    def check(self) -> Self:
        if not self.api_key.startswith("sk-"):
            raise ValueError("API Key must start with 'sk-'")

        return self


OpenAIAPIKeyRef: TypeAlias = get_reference_model(OpenAIAPIKey)  # type: ignore[valid-type]
OpenAIAPIKeyWrapper: TypeAlias = get_wrapper_model(OpenAIAPIKey)  # type: ignore[valid-type]


@register("llm")
class OpenAI(BaseModel):
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


OpenAIRef: TypeAlias = get_reference_model(OpenAI)  # type: ignore[valid-type]
OpenAIWrapper: TypeAlias = get_wrapper_model(OpenAI)  # type: ignore[valid-type]
