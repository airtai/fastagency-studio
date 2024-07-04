from typing import Annotated, Any, Callable, Dict, List, Optional, Tuple, Union
from uuid import UUID

from autogen.agentchat import Agent as AutogenAgent
from autogen.agentchat import AssistantAgent as AutogenAssistantAgent
from autogen.agentchat.contrib.web_surfer import WebSurferAgent as AutogenWebSurferAgent
from autogen.oai.client import OpenAIWrapper as AutogenOpenAIWrapper
from pydantic import BaseModel, Field
from typing_extensions import TypeAlias

from ...openapi.client import Client
from ..base import Model
from ..registry import register
from .base import AgentBaseModel, llm_type_refs

_org_generate_surfer_reply: Optional[Callable[..., Any]] = None


def _patch_generate_surfer_reply() -> None:
    global _org_generate_surfer_reply

    if _org_generate_surfer_reply is None:
        _org_generate_surfer_reply = AutogenWebSurferAgent.generate_surfer_reply

    def generate_surfer_reply(
        self: AutogenWebSurferAgent,
        messages: Optional[List[Dict[str, str]]] = None,
        sender: Optional[AutogenAgent] = None,
        config: Optional[AutogenOpenAIWrapper] = None,
    ) -> Tuple[bool, Optional[Union[str, Dict[str, str]]]]:
        global _org_generate_surfer_reply

        if messages is not None and "tool_responses" in messages[-1]:
            messages = messages.copy()
            messages.append(messages[-1].copy())
            messages[-1].pop("tool_responses")

        return _org_generate_surfer_reply(self, messages, sender, config)  # type: ignore[no-any-return]

    AutogenWebSurferAgent.generate_surfer_reply = generate_surfer_reply


_patch_generate_surfer_reply()


class WebsurferAnswer(BaseModel):
    task: Annotated[str, Field(..., description="The task to be completed")]
    is_successful: Annotated[
        bool, Field(..., description="Whether the task was successful")
    ]
    short_answer: Annotated[
        str,
        Field(
            ...,
            description="The short answer to the task without any explanation",
        ),
    ]
    long_answer: Annotated[
        str,
        Field(..., description="The long answer to the task with explanation"),
    ]
    visited_links: Annotated[
        List[HttpUrl], Field(..., description="The list of visited links")
    ]


async def get_answer_from_web_surfer(task: str) -> WebsurferAnswer:
    example_answer = WebsurferAnswer(
        task="What is the most popular QLED TV to buy on amazon.com?",
        is_successful=True,
        short_answer='Amazon Fire TV 55" Omni QLED Series 4K UHD smart TV, Dolby Vision IQ, Fire TV Ambient Experience, local dimming, hands-free with Alexa',
        long_answer='Amazon has the best selling page by different categories and there is a category for QLED TVs under electroincs. The most popular QLED TV is Amazon Fire TV 55" Omni QLED Series 4K UHD smart TV, Dolby Vision IQ, Fire TV Ambient Experience, local dimming, hands-free with Alexa. It is the best selling QLED TV on Amazon.',
        visited_links=[
            "https://www.amazon.com",
            "https://www.amazon.com/Best-Sellers/zgbs/",
            "https://www.amazon.com/Best-Sellers-Electronics/zgbs/electronics/ref=zg_bs_nav_electronics_0",
            "https://www.amazon.com/Best-Sellers-Electronics-Televisions-Video-Products/zgbs/electronics/1266092011/ref=zg_bs_nav_electronics_1",
            "https://www.amazon.com/Best-Sellers-Electronics-Televisions/zgbs/electronics/172659/ref=zg_bs_nav_electronics_2_1266092011",
            "https://www.amazon.com/Best-Sellers-Electronics-QLED-TVs/zgbs/electronics/21489946011/ref=zg_bs_nav_electronics_3_172659",
        ],
    )

    assistant_system_message = f"""You are in charge of navigating the web_surfer agent to scrape the web.
web_surfer is able to CLICK on links, SCROLL down, and scrape the content of the web page. e.g. you cen tell him: "Click the 'Getting Started' result".
Each time you receive a reply from web_surfer, you need to tell him what to do next. e.g. "Click the TV link" or "Scroll down".
It is very important that you explore ONLY the page links relevant for the task!

GUIDELINES:
- Once you retrieve the content from the received url, you can tell web_surfer to CLICK on links, SCROLL down...
By using these capabilities, you will be able to retrieve MUCH BETTER information from the web page than by just scraping the given URL!
You MUST use these capabilities when you receive a task for a specific category/product etc.
- do NOT try to create a summary without clicking on any link, because you will be missing a lot of information!
- if needed, you can instruct web surfer to SEARCH THE WEB for information.

Examples:
"Click the 'TVs' result" - This way you will navigate to the TVs section of the page and you will find more information about TVs.
"Click 'Electronics' link" - This way you will navigate to the Electronics section of the page and you will find more information about Electronics.
"Click the 'Next' button"
"Search the internet for the best TV to buy" - this will get links to initial pages to start the search

- Do NOT try to click all the links on the page, but only the ones which are RELEVANT for the task! Web pages can be very long and you will be penalized if spend too much time on this task!
- Your final goal is to summarize the findings for the given task. The summary must be in English!
- Create a summary after you successfully retrieve the information from the web page.
- It is useful to include in the summary relevant links where more information can be found.
e.g. If the page is offering to sell TVs, you can include a link to the TV section of the page.
- If you get some 40x error, please do NOT give up immediately, but try to navigate to another page and continue with the task.
Give up only if you get 40x error on ALL the pages which you tried to navigate to.


FINAL MESSAGE:
Once you have retrieved he wanted information, YOU MUST create JSON-encoded string. Summary created by the web_surfer is not enough!
You MUST not include any other text or formatting in the message, only JSON-encoded summary!

An example of the JSON-encoded summary:
{example_answer.model_dump_json()}

TERMINATION:
When YOU are finished and YOU have created JSON-encoded answer, write a single 'TERMINATE' to end the task.

OFTEN MISTAKES:
- Web surfer expects you to tell him what LINK NAME to click next, not the relative link. E.g. in case of '[Hardware](/Hardware), the proper command would be 'Click into 'Hardware''.
- Links presented are often RELATIVE links, so you need to ADD the DOMAIN to the link to make it work. E.g. link '/products/air-conditioners' should be 'https://www.example.com/products/air-conditioners'
- You do NOT need to click on MAX number of links. If you have enough information from the first xy links, you do NOT need to click on the rest of the links!
- Do NOT repeat the steps you have already completed!
- ALWAYS include the NEXT steps in the message!
- Do NOT instruct web_surfer to click on the same link multiple times. If there are some problems with the link, MOVE ON to the next one!
- Also, if web_surfer does not understand your message, just MOVE ON to the next link!
- NEVER REPEAT the same instructions to web_surfer! If he does not understand the first time, MOVE ON to the next link!
- NEVER enclose JSON-encoded answer in any other text or formatting including '```json' ... '```' or similar!
"""

    max_links_to_click = 10
    initial_message = f"""We are tasked with the following task:

{task}

If no link is provided in the task, you should search the internet first to find the relevant information.

The focus is on the provided url and its subpages, we do NOT care about the rest of the website i.e. parent pages.
e.g. If the url is 'https://www.example.com/products/air-conditioners', we are interested ONLY in the 'air-conditioners' and its subpages.

AFTER visiting the home page, create a step-by-step plan BEFORE visiting the other pages.
You can click on MAXIMUM {max_links_to_click} links. Do NOT try to click all the links on the page, but only the ones which are most relevant for the task (MAX {max_links_to_click})!
Do NOT visit the same page multiple times, but only once!
If your co-speaker repeats the same message, inform him that you have already answered to that message and ask him to proceed with the task.
e.g. "I have already answered to that message, please proceed with the task or you will be penalized!"
"""

    def is_termination_msg(msg: Dict[str, Any]) -> bool:
        # print(f"is_termination_msg({msg=})")
        if "content" in msg and msg["content"] == "TERMINATE":
            return True
        try:
            WebsurferAnswer.model_validate_json(msg["content"])
            return True
        except Exception:
            # print(f"{e=}")
            return False

    ag_websurfer, _ = await create_autogen(
        model_ref=websurfer_ref,
        user_uuid=user_uuid,
        is_termination_msg=is_termination_msg,
    )

    ag_assistant, _ = await create_autogen(
        model_ref=assistant_noapi_azure_oai_gpt4o_ref,
        user_uuid=user_uuid,
        system_message=assistant_system_message,
        max_consecutive_auto_reply=20,
        # is_termination_msg=is_termination_msg,
    )

    # ag_user_proxy = autogen.agentchat.UserProxyAgent(
    #     name="user_proxy",
    #     human_input_mode="NEVER",
    #     max_consecutive_auto_reply=1,
    # )

    chat_result = ag_websurfer.initiate_chat(
        ag_assistant,
        message=initial_message,
    )

    messages = [msg["content"] for msg in chat_result.chat_history]

    if "TERMINATE" in messages[-1]:
        chat_result = ag_websurfer.initiate_chat(
            recipient=ag_assistant,
            message=f"Please output the JSON-encoded answer only in the following messsage before trying to terminate the chat. An example of the JSON-encoded summary: {example_answer.model_dump_json()}\n\n"
            "IMPORTANT:\n - NEVER enclose JSON-encoded answer in any other text or formatting including '```json' ... '```' or similar!"
            "\n - NEVER write TERMINATE in the same message as the JSON-encoded answer!",
            clear_history=False,
        )
        messages = [msg["content"] for msg in chat_result.chat_history]

    assert messages
    # for w in ["1242", "Zagreb", "free royal city"]:
    #     assert any(msg is not None and w in msg for msg in messages), (
    #         w,
    #         messages,
    #     )
    # for w in ["TERMINATE"]:
    #     assert not any(msg is not None and w in msg for msg in messages), (w, messages)

    final_answer = WebsurferAnswer.model_validate_json(messages[-1])
    assert final_answer.is_successful
    print(f"{final_answer=}")  # noqa: T201


@register("secret")
class BingAPIKey(Model):
    api_key: Annotated[str, Field(description="The API Key from Bing")]

    @classmethod
    async def create_autogen(cls, model_id: UUID, user_id: UUID, **kwargs: Any) -> str:
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
    ] = 4096
    bing_api_key: Annotated[
        Optional[BingAPIKeyRef], Field(description="The Bing API key for the browser")
    ] = None

    @classmethod
    async def create_autogen(
        cls, model_id: UUID, user_id: UUID, **kwargs: Any
    ) -> Tuple[AutogenAssistantAgent, List[Client]]:
        my_model = await cls.from_db(model_id)

        llm_model = await my_model.llm.get_data_model().from_db(my_model.llm.uuid)

        llm = await llm_model.create_autogen(my_model.llm.uuid, user_id)

        # clients = await my_model.get_clients_from_toolboxes(user_id)

        summarizer_llm_model = await my_model.summarizer_llm.get_data_model().from_db(
            my_model.summarizer_llm.uuid
        )

        summarizer_llm = await summarizer_llm_model.create_autogen(
            my_model.summarizer_llm.uuid, user_id
        )

        bing_api_key = None
        if my_model.bing_api_key:
            bing_api_key_model = await my_model.bing_api_key.get_data_model().from_db(
                my_model.bing_api_key.uuid
            )
            bing_api_key = await bing_api_key_model.create_autogen(
                my_model.bing_api_key.uuid, user_id
            )

        browser_config = {
            "viewport_size": my_model.viewport_size,
            "bing_api_key": bing_api_key,
            "request_kwargs": {
                "headers": {
                    "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/41.0.2228.0 Safari/537.36",
                }
            },
        }

        agent_name = my_model.name

        agent = AutogenWebSurferAgent(
            name=agent_name,
            llm_config=llm,
            summarizer_llm_config=summarizer_llm,
            browser_config=browser_config,
            human_input_mode="NEVER",
            **kwargs,
        )

        return agent, []
