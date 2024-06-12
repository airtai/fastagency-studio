from fastapi.testclient import TestClient

from fastagency.app import app
from fastagency.models.registry import Schemas

client = TestClient(app)


class TestGetSchema:
    def test_return_all(self) -> None:
        response = client.get("/models/schemas")
        assert response.status_code == 200

        schemas = Schemas(**response.json())

        types = {schemas.name: schemas.schemas for schemas in schemas.list_of_schemas}
        assert set(types.keys()) == {
            "secret",
            "llm",
            "agent",
            "team",
            "toolbox",
            "application",
        }

        model_names = {
            type_name: {model.name for model in model_schema_list}
            for type_name, model_schema_list in types.items()
        }
        expected = {
            "secret": {
                "AzureOAIAPIKey",
                "OpenAIAPIKey",
                "BingAPIKey",
                "OpenAPIAuth",
                "TogetherAIAPIKey",
            },
            "llm": {"AzureOAI", "OpenAI", "TogetherAI"},
            "agent": {"AssistantAgent", "WebSurferAgent", "UserProxyAgent"},
            # "team": {"TwoAgentTeam", "MultiAgentTeam"},
            "team": {"TwoAgentTeam"},
            "toolbox": {"Toolbox"},
            "application": {"Application"},
        }
        assert model_names == expected, f"{model_names}!={expected}"
