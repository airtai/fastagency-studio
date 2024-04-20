from typing import Annotated, Literal

from pydantic import Field, HttpUrl

from ...constants import AZURE_API_VERSIONS_LITERAL
from ._base import UUIDModel, get_llm_registry

__all__ = ["AzureOAI"]

_llm_registry = get_llm_registry()


@_llm_registry.register
class AzureOAI(UUIDModel):
    model: Annotated[
        str,
        Field(
            description="The model to use for the Azure OpenAI API, e.g. 'gpt-3.5-turbo'"
        ),
    ] = "gpt-3.5-turbo"
    api_key: Annotated[
        str,
        Field(
            title="API Key",
            description="The API key for the Azure OpenAI API, e.g. 'sk-1234567890abcdef1234567890abcdef'",
        ),
    ]
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
