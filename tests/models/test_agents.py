import uuid

from fastagency.models.agents import Agent


class TestAgents:
    def test_agent_model(self) -> None:
        llm_uuid = uuid.uuid4()
        agent_uuid = uuid.uuid4()
        agent = Agent(
            llm_uuid=llm_uuid,
            name="test agent",
            system_message="test system message",
            uuid=agent_uuid,
        )
        assert agent.name == "test agent"

    def test_agent_model_schema(self) -> None:
        schema = Agent.model_json_schema()
        assert schema
