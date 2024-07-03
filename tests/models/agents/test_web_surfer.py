import uuid
from typing import Any, Dict, List

import autogen.agentchat.contrib.web_surfer
import pytest
from fastapi import BackgroundTasks
from pydantic import BaseModel, HttpUrl

from fastagency.app import add_model
from fastagency.helpers import create_autogen
from fastagency.models.agents.web_surfer import BingAPIKey, WebSurferAgent
from fastagency.models.base import ObjectReference
from fastagency.models.llms.azure import AzureOAIAPIKey
from tests.helpers import get_by_tag, parametrize_fixtures


class TestWebSurferAgent:
    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.llm()
    @parametrize_fixtures("websurfer_ref", get_by_tag("websurfer"))
    async def test_websurfer_construction(
        self,
        user_uuid: str,
        websurfer_ref: ObjectReference,
    ) -> None:
        print(f"test_websurfer_construction({user_uuid=}, {websurfer_ref=})")  # noqa: T201

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.llm()
    @parametrize_fixtures("llm_ref", get_by_tag("websurfer-llm"))
    async def test_websurfer_llm_construction(
        self,
        user_uuid: str,
        llm_ref: ObjectReference,
    ) -> None:
        print(f"test_websurfer_llm_construction({user_uuid=}, {llm_ref=})")  # noqa: T201

    def test_web_surfer_model_schema(self) -> None:
        schema = WebSurferAgent.model_json_schema()
        expected = {
            "$defs": {
                "AnthropicRef": {
                    "properties": {
                        "type": {
                            "const": "llm",
                            "default": "llm",
                            "description": "The name of the type of the data",
                            "enum": ["llm"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "Anthropic",
                            "default": "Anthropic",
                            "description": "The name of the data",
                            "enum": ["Anthropic"],
                            "title": "Name",
                            "type": "string",
                        },
                        "uuid": {
                            "description": "The unique identifier",
                            "format": "uuid",
                            "title": "UUID",
                            "type": "string",
                        },
                    },
                    "required": ["uuid"],
                    "title": "AnthropicRef",
                    "type": "object",
                },
                "AzureOAIRef": {
                    "properties": {
                        "type": {
                            "const": "llm",
                            "default": "llm",
                            "description": "The name of the type of the data",
                            "enum": ["llm"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "AzureOAI",
                            "default": "AzureOAI",
                            "description": "The name of the data",
                            "enum": ["AzureOAI"],
                            "title": "Name",
                            "type": "string",
                        },
                        "uuid": {
                            "description": "The unique identifier",
                            "format": "uuid",
                            "title": "UUID",
                            "type": "string",
                        },
                    },
                    "required": ["uuid"],
                    "title": "AzureOAIRef",
                    "type": "object",
                },
                "BingAPIKeyRef": {
                    "properties": {
                        "type": {
                            "const": "secret",
                            "default": "secret",
                            "description": "The name of the type of the data",
                            "enum": ["secret"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "BingAPIKey",
                            "default": "BingAPIKey",
                            "description": "The name of the data",
                            "enum": ["BingAPIKey"],
                            "title": "Name",
                            "type": "string",
                        },
                        "uuid": {
                            "description": "The unique identifier",
                            "format": "uuid",
                            "title": "UUID",
                            "type": "string",
                        },
                    },
                    "required": ["uuid"],
                    "title": "BingAPIKeyRef",
                    "type": "object",
                },
                "OpenAIRef": {
                    "properties": {
                        "type": {
                            "const": "llm",
                            "default": "llm",
                            "description": "The name of the type of the data",
                            "enum": ["llm"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "OpenAI",
                            "default": "OpenAI",
                            "description": "The name of the data",
                            "enum": ["OpenAI"],
                            "title": "Name",
                            "type": "string",
                        },
                        "uuid": {
                            "description": "The unique identifier",
                            "format": "uuid",
                            "title": "UUID",
                            "type": "string",
                        },
                    },
                    "required": ["uuid"],
                    "title": "OpenAIRef",
                    "type": "object",
                },
                "TogetherAIRef": {
                    "properties": {
                        "type": {
                            "const": "llm",
                            "default": "llm",
                            "description": "The name of the type of the data",
                            "enum": ["llm"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "TogetherAI",
                            "default": "TogetherAI",
                            "description": "The name of the data",
                            "enum": ["TogetherAI"],
                            "title": "Name",
                            "type": "string",
                        },
                        "uuid": {
                            "description": "The unique identifier",
                            "format": "uuid",
                            "title": "UUID",
                            "type": "string",
                        },
                    },
                    "required": ["uuid"],
                    "title": "TogetherAIRef",
                    "type": "object",
                },
                "ToolboxRef": {
                    "properties": {
                        "type": {
                            "const": "toolbox",
                            "default": "toolbox",
                            "description": "The name of the type of the data",
                            "enum": ["toolbox"],
                            "title": "Type",
                            "type": "string",
                        },
                        "name": {
                            "const": "Toolbox",
                            "default": "Toolbox",
                            "description": "The name of the data",
                            "enum": ["Toolbox"],
                            "title": "Name",
                            "type": "string",
                        },
                        "uuid": {
                            "description": "The unique identifier",
                            "format": "uuid",
                            "title": "UUID",
                            "type": "string",
                        },
                    },
                    "required": ["uuid"],
                    "title": "ToolboxRef",
                    "type": "object",
                },
            },
            "properties": {
                "name": {
                    "description": "The name of the item",
                    "minLength": 1,
                    "title": "Name",
                    "type": "string",
                },
                "llm": {
                    "anyOf": [
                        {"$ref": "#/$defs/AnthropicRef"},
                        {"$ref": "#/$defs/AzureOAIRef"},
                        {"$ref": "#/$defs/OpenAIRef"},
                        {"$ref": "#/$defs/TogetherAIRef"},
                    ],
                    "description": "LLM used by the agent for producing responses",
                    "title": "LLM",
                },
                "toolbox_1": {
                    "anyOf": [{"$ref": "#/$defs/ToolboxRef"}, {"type": "null"}],
                    "default": None,
                    "description": "Toolbox used by the agent for producing responses",
                    "title": "Toolbox",
                },
                "toolbox_2": {
                    "anyOf": [{"$ref": "#/$defs/ToolboxRef"}, {"type": "null"}],
                    "default": None,
                    "description": "Toolbox used by the agent for producing responses",
                    "title": "Toolbox",
                },
                "toolbox_3": {
                    "anyOf": [{"$ref": "#/$defs/ToolboxRef"}, {"type": "null"}],
                    "default": None,
                    "description": "Toolbox used by the agent for producing responses",
                    "title": "Toolbox",
                },
                "summarizer_llm": {
                    "anyOf": [
                        {"$ref": "#/$defs/AnthropicRef"},
                        {"$ref": "#/$defs/AzureOAIRef"},
                        {"$ref": "#/$defs/OpenAIRef"},
                        {"$ref": "#/$defs/TogetherAIRef"},
                    ],
                    "description": "This LLM will be used to generated summary of all pages visited",
                    "title": "Summarizer LLM",
                },
                "viewport_size": {
                    "default": 1024,
                    "description": "The viewport size of the browser",
                    "title": "Viewport Size",
                    "type": "integer",
                },
                "bing_api_key": {
                    "anyOf": [{"$ref": "#/$defs/BingAPIKeyRef"}, {"type": "null"}],
                    "default": None,
                    "description": "The Bing API key for the browser",
                },
            },
            "required": ["name", "llm", "summarizer_llm"],
            "title": "WebSurferAgent",
            "type": "object",
        }
        # print(f"{schema=}")
        assert schema == expected

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @parametrize_fixtures("websurfer_ref", get_by_tag("websurfer"))
    async def test_assistant_create_autogen(
        self,
        user_uuid: str,
        websurfer_ref: ObjectReference,
    ) -> None:
        def is_termination_msg(msg: Dict[str, Any]) -> bool:
            return "TERMINATE" in ["content"]

        ag_assistant, ag_toolkits = await create_autogen(
            model_ref=websurfer_ref,
            user_uuid=user_uuid,
            is_termination_msg=is_termination_msg,
        )
        assert isinstance(
            ag_assistant, autogen.agentchat.contrib.web_surfer.WebSurferAgent
        )
        assert len(ag_toolkits) == 0

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.llm()
    @parametrize_fixtures("websurfer_ref", get_by_tag("websurfer"))
    async def test_websurfer_end2end(
        self,
        user_uuid: str,
        websurfer_ref: ObjectReference,
        assistant_noapi_azure_oai_gpt4o_ref: ObjectReference,
    ) -> None:
        class FinalAnswer(BaseModel):
            task: str
            short_answer: str
            long_answer: str
            visited_links: List[HttpUrl]

        example_answer = FinalAnswer(
            task="What is the most popular QLED TV to buy on amazon.com?",
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

        for task in [
            "Visit https://en.wikipedia.org/wiki/Zagreb and tell me when Zagreb became a free royal city.",
            "What is the most expensive NVIDIA GPU on https://www.alternate.de/?",
        ]:
            assistant_system_message = f"""You are in charge of navigating the web_surfer agent to scrape the web.
web_surfer is able to CLICK on links, SCROLL down, and scrape the content of the web page. e.g. you cen tell him: "Click the 'Getting Started' result".
Each time you receive a reply from web_surfer, you need to tell him what to do next. e.g. "Click the TV link" or "Scroll down".
It is very important that you explore ONLY the page links relevant for the task!

GUIDELINES:
- Once you retrieve the content from the received url, you can tell web_surfer to CLICK on links, SCROLL down...
By using these capabilities, you will be able to retrieve MUCH BETTER information from the web page than by just scraping the given URL!
You MUST use these capabilities when you receive a task for a specific category/product etc.
- do NOT try to create a summary without clicking on any link, because you will be missing a lot of information!

Examples:
"Click the 'TVs' result" - This way you will navigate to the TVs section of the page and you will find more information about TVs.
"Click 'Electronics' link" - This way you will navigate to the Electronics section of the page and you will find more information about Electronics.
"Click the 'Next' button"

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
                    FinalAnswer.model_validate_json(msg["content"])
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
            for w in ["1242", "Zagreb", "free royal city"]:
                assert any(msg is not None and w in msg for msg in messages), (
                    w,
                    messages,
                )
            # for w in ["TERMINATE"]:
            #     assert not any(msg is not None and w in msg for msg in messages), (w, messages)

            final_answer = FinalAnswer.model_validate_json(messages[-1])
            print(f"{final_answer=}")  # noqa: T201

    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.llm()
    @parametrize_fixtures("websurfer_ref", get_by_tag("websurfer"))
    async def test_websurfer_and_toolkit_end2end(
        self,
        user_uuid: str,
        websurfer_ref: ObjectReference,
        assistant_weather_openai_oai_gpt35_ref: ObjectReference,
        openai_gpt35_turbo_16k_llm_config: Dict[str, Any],
    ) -> None:
        ag_websurfer, _ = await create_autogen(
            model_ref=websurfer_ref,
            user_uuid=user_uuid,
        )

        ag_assistant, ag_toolboxes = await create_autogen(
            model_ref=assistant_weather_openai_oai_gpt35_ref,
            user_uuid=user_uuid,
        )

        ag_user_proxy = autogen.agentchat.UserProxyAgent(
            name="user_proxy",
            human_input_mode="NEVER",
            max_consecutive_auto_reply=4,
        )

        ag_toolbox = ag_toolboxes[0]
        ag_toolbox.register_for_llm(ag_assistant)
        ag_toolbox.register_for_execution(ag_user_proxy)

        groupchat = autogen.GroupChat(
            agents=[ag_assistant, ag_websurfer, ag_user_proxy],
            messages=[],
        )

        manager = autogen.GroupChatManager(
            groupchat=groupchat,
            llm_config=openai_gpt35_turbo_16k_llm_config,
        )
        chat_result = manager.initiate_chat(
            recipient=manager,
            message="Find out what's the weather in Zagreb today and then visit https://www.infozagreb.hr/hr/dogadanja and check what would be the best way to spend an evening in Zagreb according to the weather forecast.",
        )

        messages = [msg["content"] for msg in chat_result.chat_history]
        assert messages

        # print("*" * 80)
        # print()
        # for msg in messages:
        #     print(msg)
        #     print()
        # print("*" * 80)

        # for w in ["sunny", "Zagreb", ]:
        #     assert any(msg is not None and w in msg for msg in messages), (w, messages)


# todo
class TestBingAPIKey:
    @pytest.mark.asyncio()
    @pytest.mark.db()
    async def test_bing_api_key_model_create_autogen(
        self,
        azure_gpt35_turbo_16k_llm_config: Dict[str, Any],
        user_uuid: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        # Add secret to database
        api_key = BingAPIKey(  # type: ignore [operator]
            api_key="dummy_bing_api_key",  # pragma: allowlist secret
            name="api_key_model_name",
        )
        api_key_model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="secret",
            model_name=BingAPIKey.__name__,  # type: ignore [attr-defined]
            model_uuid=api_key_model_uuid,
            model=api_key.model_dump(),
            background_tasks=BackgroundTasks(),
        )

        # Call create_autogen
        actual_api_key = await AzureOAIAPIKey.create_autogen(
            model_id=uuid.UUID(api_key_model_uuid),
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(actual_api_key, str)
        assert actual_api_key == api_key.api_key
