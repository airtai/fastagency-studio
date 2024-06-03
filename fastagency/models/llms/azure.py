from typing import Annotated, Any, Dict, Literal
from uuid import UUID

from pydantic import AfterValidator, Field, HttpUrl
from typing_extensions import TypeAlias

from ...constants import AZURE_API_VERSIONS_LITERAL
from ..base import Model
from ..registry import register

__all__ = [
    "AzureOAIAPIKey",
    "AzureOAI",
]


@register("secret")
class AzureOAIAPIKey(Model):
    api_key: Annotated[str, Field(description="The API Key from Azure OpenAI")]

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> str:
        my_model = await cls.from_db(model_id)

        return my_model.api_key


AzureOAIAPIKeyRef: TypeAlias = AzureOAIAPIKey.get_reference_model()  # type: ignore[valid-type]

# Pydantic adds trailing slash automatically to URLs, so we need to remove it
# https://github.com/pydantic/pydantic/issues/7186#issuecomment-1691594032
URL = Annotated[HttpUrl, AfterValidator(lambda x: str(x).rstrip("/"))]


@register("llm")
class AzureOAI(Model):
    model: Annotated[
        str,
        Field(
            description="The model to use for the Azure OpenAI API, e.g. 'gpt-3.5-turbo'"
        ),
    ] = "gpt-3.5-turbo"

    api_key: AzureOAIAPIKeyRef

    base_url: Annotated[
        URL, Field(description="The base URL of the Azure OpenAI API")
    ] = URL(url="https://api.openai.com/v1")

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

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> Dict[str, Any]:
        my_model = await cls.from_db(model_id)

        api_key_model = await my_model.api_key.get_data_model().from_db(
            my_model.api_key.uuid
        )
        api_key = await api_key_model.create_autogen(my_model.api_key.uuid, user_id)

        config_list = [
            {
                "model": my_model.model,
                "api_key": api_key,
                "base_url": str(my_model.base_url),
                "api_type": my_model.api_type,
                "api_version": my_model.api_version,
            }
        ]

        llm_config = {
            "config_list": config_list,
            "temperature": 0,
        }

        return llm_config
