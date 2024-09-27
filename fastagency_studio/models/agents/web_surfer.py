from typing import Annotated, Any, Optional
from uuid import UUID

from asyncer import syncify
from autogen.agentchat import AssistantAgent as AutoGenAssistantAgent
from autogen.agentchat import ConversableAgent as AutoGenConversableAgent
from fastagency.runtime.autogen.tools import WebSurferTool
from typing_extensions import TypeAlias

from ..base import Field, Model
from ..registry import register
from .base import AgentBaseModel, llm_type_refs


@register("secret")
class BingAPIKey(Model):
    api_key: Annotated[
        str,
        Field(
            title="API Key",
            description="The API Key from Bing",
            tooltip_message="The API key specified here will be used to authenticate requests to Bing services.",
        ),
    ]

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID, **kwargs: Any) -> str:
        my_model = await cls.from_db(model_id)

        return my_model.api_key


BingAPIKeyRef: TypeAlias = BingAPIKey.get_reference_model()  # type: ignore[valid-type]


class WebSurferToolbox:
    def __init__(self, websurfer_tool: WebSurferTool):
        """Create a toolbox for the web surfer agent. This toolbox will contain functions to delegate web surfing tasks to the internal web surfer agent.

        Args:
            websurfer_tool (WebSurferTool): The web surfer tool to be used in the toolbox
        """
        self.websurfer_tool = websurfer_tool

        def create_new_task(
            task: Annotated[str, "task for websurfer"],
        ) -> str:
            try:
                return syncify(self.websurfer_tool.a_create_new_task)(task)  # type: ignore [no-any-return]
            except Exception as e:
                raise e

        create_new_task._description = (  # type: ignore [attr-defined]
            "Delegate web surfing task to internal web surfer agent"
        )

        def continue_task_with_additional_instructions(
            message: Annotated[
                str,
                "Additional instructions for the task after receiving the initial answer",
            ],
        ) -> str:
            try:
                return syncify(  # type: ignore [no-any-return]
                    self.websurfer_tool.a_continue_task_with_additional_instructions
                )(message)
            except Exception as e:
                raise e

        continue_task_with_additional_instructions._description = (  # type: ignore [attr-defined]
            "Continue the task with additional instructions"
        )

        self.registered_funcs = [
            create_new_task,
            continue_task_with_additional_instructions,
        ]

    def register_for_llm(self, agent: AutoGenConversableAgent) -> None:
        for f in self.registered_funcs:
            agent.register_for_llm()(f)

    def register_for_execution(self, agent: AutoGenConversableAgent) -> None:
        for f in self.registered_funcs:
            agent.register_for_execution()(f)


@register("agent")
class WebSurferAgent(AgentBaseModel):
    summarizer_llm: Annotated[
        llm_type_refs,
        Field(
            title="Summarizer LLM",
            description="This LLM will be used to generated summary of all pages visited",
            tooltip_message="Select the summarizer LLM, which is used for generating precise and accurate summaries of web pages, while the LLM chosen above is used for handling regular web searches.",
        ),
    ]
    viewport_size: Annotated[
        int,
        Field(
            description="The viewport size of the browser",
            tooltip_message="Viewport size refers to the visible area of a webpage in the browser. Default is 4096. Modify only if a custom size is needed.",
        ),
    ] = 4096
    bing_api_key: Annotated[
        Optional[BingAPIKeyRef],
        Field(
            title="Bing API Key",
            description="The Bing API key for the browser",
            tooltip_message="Choose a Bing API key to allow the browser to access Bing's search and data services, improving information retrieval.",
        ),
    ] = None

    @classmethod
    async def create_autogen(
        cls, model_id: UUID, user_id: UUID, **kwargs: Any
    ) -> tuple[AutoGenAssistantAgent, list[WebSurferToolbox]]:
        from ...helpers import create_autogen, get_model_by_uuid

        websurfer_model: WebSurferAgent = await get_model_by_uuid(model_id)  # type: ignore [assignment]
        llm_config = await create_autogen(websurfer_model.llm, user_id)
        summarizer_llm_config = await create_autogen(
            websurfer_model.summarizer_llm, user_id
        )

        bing_api_key = (
            await create_autogen(websurfer_model.bing_api_key, user_id)
            if websurfer_model.bing_api_key
            else None
        )

        viewport_size = websurfer_model.viewport_size

        websurfer_tool = WebSurferTool(
            name_prefix=websurfer_model.name,
            llm_config=llm_config,
            summarizer_llm_config=summarizer_llm_config,
            viewport_size=viewport_size,
            bing_api_key=bing_api_key,
        )

        web_surfer_toolbox = WebSurferToolbox(websurfer_tool)

        agent_name = websurfer_model.name

        system_message = (
            "You are a helpful assistant with access to web surfing capabilities."
            "Please use 'create_new_task' and 'continue_task_with_additional_instructions' functions to provide answers to other agents."
        )

        agent = AutoGenAssistantAgent(
            name=agent_name,
            llm_config=llm_config,
            system_message=system_message,
            code_execution_config=False,
            **kwargs,
        )

        return agent, [web_surfer_toolbox]
