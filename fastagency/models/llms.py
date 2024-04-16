from typing import Annotated, Dict, List, Literal, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel, Field, HttpUrl

from .constants import AZURE_API_VERSIONS_LITERAL, OPENAI_MODELS_LITERAL

__all__ = ["OpenAI", "AzureOAI", "list_llms", "get_llm_type"]

BM = TypeVar("BM", bound=Type[BaseModel])

_llm_registry: Dict[str, Type[BaseModel]] = {}


def register_llm(m: BM) -> BM:
    name = m.__name__  # type: ignore[attr-defined]
    if name in _llm_registry:
        raise ValueError(f"Model '{name}' already registered")

    _llm_registry[name] = m

    return m


def list_llms() -> List[str]:
    return list(_llm_registry.keys())


def get_llm_type(name: str) -> Type[BaseModel]:
    return _llm_registry[name]


OPENAI_MODEL_NAMES = ["gpt-4", "gpt-3.5-turbo"]


class _DefaultModel(BaseModel):
    uuid: Annotated[
        UUID,
        Field(title="UUID", description="The unique identifier for the model instance"),
    ]


@register_llm
class OpenAI(_DefaultModel):
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


AZURE_API_VERSIONS = ["2024-02-15-preview", "latest"]


@register_llm
class AzureOAI(_DefaultModel):
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
