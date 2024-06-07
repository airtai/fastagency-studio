from typing import Annotated, Any, Dict, List, Optional

import pytest
from autogen.agentchat import AssistantAgent, UserProxyAgent

from fastagency.models.teams.base import register_toolbox_functions
from fastagency.models.toolboxes.toolbox import FunctionInfo


class TestRegisterToolboxFunctions:
    @pytest.fixture()
    def function_infos(self) -> List[FunctionInfo]:
        def f(i: int, s: str) -> str:
            return str(i) + s

        def g(i: int, s: str, f: Optional[float]) -> str:
            return str(i) + s

        def h(name: Annotated[str, "Name of the person"]) -> str:
            return name

        return [
            FunctionInfo(name="f", description="Function f", function=f),
            FunctionInfo(name="g", description="Function g", function=g),
            FunctionInfo(name="h", description="Function h", function=h),
        ]

    def llm_config(self) -> Dict[str, Any]:
        dummy_openai_api_key = "sk-sUeBP9asw6GiYHXqtg70T3BlbkFJJuLwJFco90bOpU0Ntest"  # pragma: allowlist secret

        return {
            "config_list": [
                {
                    "model": "gpt-3.5-turbo",
                    "api_key": dummy_openai_api_key,
                    "base_url": "https://api.openai.com/v1",
                    "api_type": "openai",
                }
            ],
            "temperature": 0,
        }

    def test_register_toolbox_functions(
        self, function_infos: List[FunctionInfo], llm_config: Dict[str, Any]
    ) -> None:
        agent = AssistantAgent(name="agent 007", llm_config=llm_config)
        execution_agents = [
            AssistantAgent(name="agent 008", llm_config=llm_config),
            UserProxyAgent(name="agent 009", code_execution_config=False),
        ]

        register_toolbox_functions(agent, execution_agents, function_infos)

        expected = [
            {
                "type": "function",
                "function": {
                    "description": "Function f",
                    "name": "f",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "i": {"type": "integer", "description": "i"},
                            "s": {"type": "string", "description": "s"},
                        },
                        "required": ["i", "s"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "description": "Function g",
                    "name": "g",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "i": {"type": "integer", "description": "i"},
                            "s": {"type": "string", "description": "s"},
                            "f": {
                                "anyOf": [{"type": "number"}, {"type": "null"}],
                                "description": "f",
                            },
                        },
                        "required": ["i", "s", "f"],
                    },
                },
            },
            {
                "type": "function",
                "function": {
                    "description": "Function h",
                    "name": "h",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "name": {
                                "type": "string",
                                "description": "Name of the person",
                            }
                        },
                        "required": ["name"],
                    },
                },
            },
        ]
        assert agent.llm_config["tools"] == expected

        expected_2 = {
            function_info.name: function_info.function
            for function_info in function_infos
        }
        for execution_agent in execution_agents:
            actual = {k: f._origin for k, f in execution_agent._function_map.items()}
            assert actual == expected_2
