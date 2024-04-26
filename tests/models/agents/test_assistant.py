import pytest

from fastagency.models.agents.assistant import AssistantAgent


@pytest.mark.skip(reason="This test is not implemented.")
class TestAssistantAgent:
    def test_sistant_agent_model(self) -> None:
        pass
        # llm_uuid = uuid.uuid4()
        # agent_uuid = uuid.uuid4()
        # agent = AssistantAgent(
        #     llm_uuid=llm_uuid,
        #     name="test agent",
        #     system_message="test system message",
        #     uuid=agent_uuid,
        # )
        # assert agent.name == "test agent"

    def test_agent_model_schema(self) -> None:
        schema = AssistantAgent.model_json_schema()
        assert schema
