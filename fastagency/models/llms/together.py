from typing import Annotated, Any, Dict, Literal
from uuid import UUID

from pydantic import AfterValidator, Field, HttpUrl
from together import Together
from typing_extensions import TypeAlias

from ..base import Model
from ..registry import register

__all__ = [
    "TogetherAIAPIKey",
    "TogetherAI",
]

# requires that environment variables TOGETHER_API_KEY is set
client = Together()


together_model_string: Dict[str, str] = {
    model.display_name: model.id
    for model in client.models.list()
    if model.type == "chat"
}

TogetherModels: TypeAlias = Literal[tuple(together_model_string.keys())]  # type: ignore[valid-type]


@register("secret")
class TogetherAIAPIKey(Model):
    api_key: Annotated[
        str,
        Field(
            description="The API Key from Together.ai",
            min_length=64,
            max_length=64,
        ),
    ]

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> str:
        my_model: TogetherAIAPIKey = await cls.from_db(model_id)

        return my_model.api_key


TogetherAIAPIKeyRef: TypeAlias = TogetherAIAPIKey.get_reference_model()  # type: ignore[valid-type]

# Pydantic adds trailing slash automatically to URLs, so we need to remove it
# https://github.com/pydantic/pydantic/issues/7186#issuecomment-1691594032
URL = Annotated[HttpUrl, AfterValidator(lambda x: str(x).rstrip("/"))]


@register("llm")
class TogetherAI(Model):
    model: Annotated[  # type: ignore[valid-type]
        TogetherModels,
        Field(description="The model to use for the Together API"),
    ] = "Meta Llama 3 70B Chat"

    api_key: TogetherAIAPIKeyRef

    base_url: Annotated[URL, Field(description="The base URL of the OpenAI API")] = URL(
        url="https://api.together.xyz/v1"
    )

    api_type: Annotated[
        Literal["togetherai"],
        Field(
            title="API Type", description="The type of the API, must be 'togetherai'"
        ),
    ] = "togetherai"

    temperature: Annotated[
        float,
        Field(
            description="The temperature to use for the model, must be between 0 and 2",
            ge=0.0,
            le=2.0,
        ),
    ] = 0.8

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> Dict[str, Any]:
        my_model: TogetherAI = await cls.from_db(model_id)

        api_key_model: TogetherAIAPIKey = (
            await my_model.api_key.get_data_model().from_db(my_model.api_key.uuid)
        )

        api_key = await api_key_model.create_autogen(my_model.api_key.uuid, user_id)

        config_list = [
            {
                "model": together_model_string[my_model.model],
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
