from typing import Annotated, Literal

from pydantic import BaseModel, Field, HttpUrl
from typing_extensions import TypeAlias

from ...constants import AZURE_API_VERSIONS_LITERAL
from ..registry import get_reference_model, get_wrapper_model, register

__all__ = [
    "AzureOAIAPIKey",
    "AzureOAIAPIKeyRef",
    "AzureOAIAPIKeyWrapper",
    "AzureOAI",
    "AzureOAIRef",
    "AzureOAIWrapper",
]


@register("secret")
class AzureOAIAPIKey(BaseModel):
    api_key: Annotated[str, Field(description="The API Key from OpenAI")]


AzureOAIAPIKeyRef: TypeAlias = get_reference_model(AzureOAIAPIKey)  # type: ignore[valid-type]
AzureOAIAPIKeyWrapper: TypeAlias = get_wrapper_model(AzureOAIAPIKey)  # type: ignore[valid-type]


@register("llm")
class AzureOAI(BaseModel):
    model: Annotated[
        str,
        Field(
            description="The model to use for the Azure OpenAI API, e.g. 'gpt-3.5-turbo'"
        ),
    ] = "gpt-3.5-turbo"

    api_key: AzureOAIAPIKeyRef

    base_url: Annotated[
        HttpUrl, Field(description="The base URL of the Azure OpenAI API")
    ] = HttpUrl(url="https://api.openai.com/v1")

    api_type: Annotated[
        Literal["azure"],
        Field(title="API type", description="The type of the API, must be 'azure'"),
    ] = "azure"

    api_version: Annotated[
        AZURE_API_VERSIONS_LITERAL,
        Field(
            description="The version of the Azure OpenAI API, e.g. '2024-02-15-preview' or 'latest"
        ),
    ] = "latest"


AzureOAIRef: TypeAlias = get_reference_model(AzureOAI)  # type: ignore[valid-type]
AzureOAIWrapper: TypeAlias = get_wrapper_model(AzureOAI)  # type: ignore[valid-type]
