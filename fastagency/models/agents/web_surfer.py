from typing import Annotated, List, Optional, Tuple
from uuid import UUID

import autogen.agentchat.contrib.web_surfer
from pydantic import Field
from typing_extensions import TypeAlias

from ...openapi.client import Client
from ..base import Model
from ..registry import register
from .base import AgentBaseModel, llm_type_refs

# todo: this should be a mixin


@register("secret")
class BingAPIKey(Model):
    api_key: Annotated[str, Field(description="The API Key from Bing")]

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID) -> str:
        my_model = await cls.from_db(model_id)

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
    async def create_autogen(
        cls, model_id: UUID, user_id: UUID
    ) -> Tuple[autogen.agentchat.AssistantAgent, List[Client]]:
        my_model = await cls.from_db(model_id)

        llm_model = await my_model.llm.get_data_model().from_db(my_model.llm.uuid)

        llm = await llm_model.create_autogen(my_model.llm.uuid, user_id)

        clients = await my_model.get_clients_from_toolboxes(user_id)  # noqa: F841

        summarizer_llm_model = await my_model.summarizer_llm.get_data_model().from_db(
            my_model.summarizer_llm.uuid
        )

        summarizer_llm = await summarizer_llm_model.create_autogen(
            my_model.summarizer_llm.uuid, user_id
        )

        bing_api_key = None
        if my_model.bing_api_key is not None:
            bing_model = await my_model.bing_api_key.get_data_model().from_db(  # type: ignore[union-attr]
                my_model.bing_api_key.uuid  # type: ignore[union-attr]
            )
            bing_api_key = await bing_model.create_autogen(
                my_model.bing_api_key.uuid,  # type: ignore[union-attr]
                user_id,
            )

        browser_config = {
            "viewport_size": my_model.viewport_size,
            "bing_api_key": bing_api_key,
        }
        agent_name = my_model.name

        agent = autogen.agentchat.contrib.web_surfer.WebSurferAgent(
            name=agent_name,
            llm_config=llm,
            summarizer_llm_config=summarizer_llm,
            browser_config=browser_config,
        )

        return agent, []
