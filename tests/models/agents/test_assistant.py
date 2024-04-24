import uuid

from fastagency.models.agents._assistant import AssistantAgent


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
