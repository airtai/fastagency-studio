import uuid

from fastagency.models.agents import AssistantAgent, WebSurferAgent


class TestAssistantAgent:
    def test_sistant_agent_model(self) -> None:
        llm_uuid = uuid.uuid4()
        agent_uuid = uuid.uuid4()
        agent = AssistantAgent(
            llm_uuid=llm_uuid,
            name="test agent",
            system_message="test system message",
            uuid=agent_uuid,
        )
        assert agent.name == "test agent"

    def test_agent_model_schema(self) -> None:
        schema = AssistantAgent.model_json_schema()
        assert schema


class TestWebSurferAgent:
    def test_web_surfer_agent_model(self) -> None:
        llm_uuid = uuid.uuid4()
        agent_uuid = uuid.uuid4()
        agent = WebSurferAgent(
            llm_uuid=llm_uuid,
            name="test agent",
            summarizer_llm_uuid=llm_uuid,
            uuid=agent_uuid,
        )
        assert agent.name == "test agent"
        assert agent.viewport_size == 1080
        assert agent.bing_api_key is None

    def test_web_surfer_agent_model_with_bing_api_key(self) -> None:
        llm_uuid = uuid.uuid4()
        agent_uuid = uuid.uuid4()
        agent = WebSurferAgent(
            llm_uuid=llm_uuid,
            name="test agent",
            summarizer_llm_uuid=llm_uuid,
            viewport_size=1080,
            bing_api_key="test",  # pragma: allowlist secret
            uuid=agent_uuid,
        )
        assert agent.name == "test agent"
        assert agent.viewport_size == 1080
        assert agent.bing_api_key == "test"  # pragma: allowlist secret
