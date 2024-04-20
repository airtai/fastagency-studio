import pytest
from fastapi.testclient import TestClient

from fastagency.app import app
from fastagency.models import ModelSchemas

client = TestClient(app)


class TestGetSchema:
    @pytest.mark.parametrize(
        ("type_name", "expected"),
        [
            ("llm", ("OpenAI", "AzureOAI")),
            ("agent", ("AssistantAgent", "WebSurferAgent")),
        ],
    )
    def test_return_all(self, type_name: str, expected: tuple[str]) -> None:
        response = client.get("/models/schemas")
        assert response.status_code == 200

        schemas = [
            ModelSchemas(**json)
            for json in response.json()["schemas"]
            if json["name"] == type_name
        ]
        assert len(schemas) == 1
        schema = schemas[0]

        schemas_names = [schema.name for schema in schema.schemas]
        assert set(schemas_names) == set(expected)
