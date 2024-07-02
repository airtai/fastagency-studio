from typing import Annotated, Any, Dict, Literal
from uuid import UUID

from pydantic import AfterValidator, Field, HttpUrl
from typing_extensions import TypeAlias

from ..base import Model
from ..registry import register

AnthropicModels: TypeAlias = Literal[
    "claude-3-5-sonnet-20240620",
    "claude-3-opus-20240229",
    "claude-3-sonnet-20240229",
    "claude-3-haiku-20240307",
]

__all__ = [
    "AnthropicAPIKey",
    "Anthropic",
]


@register("secret")
class AnthropicAPIKey(Model):
    api_key: Annotated[
        str,
        Field(
            description="The API Key from Anthropic",
            pattern=r"^sk-ant-api03-[a-zA-Z0-9\-\_]{95}$",
        ),
    ]

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID, **kwargs: Any) -> str:
        my_model: AnthropicAPIKey = await cls.from_db(model_id)

        return my_model.api_key


AnthropicAPIKeyRef: TypeAlias = AnthropicAPIKey.get_reference_model()  # type: ignore[valid-type]

# Pydantic adds trailing slash automatically to URLs, so we need to remove it
# https://github.com/pydantic/pydantic/issues/7186#issuecomment-1691594032
URL = Annotated[HttpUrl, AfterValidator(lambda x: str(x).rstrip("/"))]


@register("llm")
class Anthropic(Model):
    model: Annotated[  # type: ignore[valid-type]
        AnthropicModels,
        Field(
            description="The model to use for the Anthropic API, e.g. 'claude-3-5-sonnet-20240620'"
        ),
    ] = "claude-3-5-sonnet-20240620"

    api_key: AnthropicAPIKeyRef

    base_url: Annotated[URL, Field(description="The base URL of the Anthropic API")] = (
        URL(url="https://api.anthropic.com/v1")
    )

    api_type: Annotated[
        Literal["anthropic"],
        Field(title="API Type", description="The type of the API, must be 'anthropic'"),
    ] = "anthropic"

    temperature: Annotated[
        float,
        Field(
            description="The temperature to use for the model, must be between 0 and 2",
            ge=0.0,
            le=2.0,
        ),
    ] = 0.8

    @classmethod
    async def create_autogen(
        cls, model_id: UUID, user_id: UUID, **kwargs: Any
    ) -> Dict[str, Any]:
        my_model: Anthropic = await cls.from_db(model_id)

        api_key_model: AnthropicAPIKey = (
            await my_model.api_key.get_data_model().from_db(my_model.api_key.uuid)
        )

        api_key = await api_key_model.create_autogen(my_model.api_key.uuid, user_id)

        config_list = [
            {
                "model": my_model.model,
                "api_key": api_key,
                "base_url": str(my_model.base_url),
                "api_type": my_model.api_type,
            }
        ]

        llm_config = {
            "config_list": config_list,
            "temperature": my_model.temperature,
        }

        return llm_config
