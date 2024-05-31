from typing import Annotated, Any, Optional
from uuid import UUID

import autogen.agentchat.contrib.web_surfer
from asyncer import syncify
from pydantic import Field
from typing_extensions import TypeAlias

from ...db.helpers import find_model_using_raw
from ..base import Model
from ..registry import register
from .base import AgentBaseModel, llm_type_refs

# todo: this should be a mixin


@register("secret")
class BingAPIKey(Model):
    api_key: Annotated[str, Field(description="The API Key from OpenAI")]

    @classmethod
    def create_autogen(cls, model_id: UUID, user_id: UUID) -> str:
        my_model_dict = syncify(find_model_using_raw)(model_id)
        my_model = cls(**my_model_dict["json_str"])

        return my_model.api_key


BingAPIKeyRef: TypeAlias = BingAPIKey.get_reference_model()  # type: ignore[valid-type]


@register("agent")
class WebSurferAgent(AgentBaseModel):
    summarizer_llm: Annotated[
        llm_type_refs,
        Field(
            title="Summarizer LLM",
            description="This LLM will be used to generated summary of all pages visited",
        ),
    ]
    viewport_size: Annotated[
        int, Field(description="The viewport size of the browser")
    ] = 1080
    bing_api_key: Annotated[
        Optional[BingAPIKeyRef], Field(description="The Bing API key for the browser")
    ] = None

    @classmethod
    def create_autogen(cls, model_id: UUID, user_id: UUID) -> Any:
        my_model_dict = syncify(find_model_using_raw)(model_id)
        my_model = cls(**my_model_dict["json_str"])

        llm_dict = syncify(find_model_using_raw)(my_model.llm.uuid)
        llm_model = my_model.llm.get_data_model()(**llm_dict["json_str"])
        llm = llm_model.create_autogen(my_model.llm.uuid, user_id)

        summarizer_llm_dict = syncify(find_model_using_raw)(
            my_model.summarizer_llm.uuid
        )
        summarizer_llm_model = my_model.summarizer_llm.get_data_model()(
            **summarizer_llm_dict["json_str"]
        )
        summarizer_llm = summarizer_llm_model.create_autogen(
            my_model.summarizer_llm.uuid, user_id
        )

        browser_config = {
            "viewport_size": my_model.viewport_size,
            "bing_api_key": my_model.bing_api_key,
        }
        agent_name = my_model_dict["model_name"]

        agent = autogen.agentchat.contrib.web_surfer.WebSurferAgent(
            name=agent_name,
            llm_config=llm,
            summarizer_llm_config=summarizer_llm,
            browser_config=browser_config,
        )
        return agent
