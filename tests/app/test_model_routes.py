import uuid

import pytest
from fastapi.testclient import TestClient

from fastagency.app import app
from fastagency.models.llms.azure import AzureOAIAPIKey

client = TestClient(app)


@pytest.mark.db()
class TestModelRoutes:
    @pytest.mark.asyncio()
    async def test_get_all_models(
        self, user_uuid: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        key_uuid = str(uuid.uuid4())
        azure_oai_api_key = AzureOAIAPIKey(api_key="whatever", name="whatever")
        type_name = "secret"
        model_name = "AzureOAIAPIKey"

        # Create model
        response = client.post(
            f"/user/{user_uuid}/models/{type_name}/{model_name}/{key_uuid}",
            json=azure_oai_api_key.model_dump(),
        )
        assert response.status_code == 200

        response = client.get(f"/user/{user_uuid}/models")
        assert response.status_code == 200

        expected = [
            {
                "json_str": {
                    "api_key": "whatever",  # pragma: allowlist secret
                    "name": "whatever",
                },
                "uuid": key_uuid,
                "type_name": "secret",
                "model_name": "AzureOAIAPIKey",
                "user_uuid": user_uuid,
            }
        ]
        actual = response.json()
        assert len(actual) == len(expected)
        for i in range(len(expected)):
            for key in expected[i]:
                assert actual[i][key] == expected[i][key]

    @pytest.mark.asyncio()
    async def test_add_model(self, user_uuid: str) -> None:
        model_uuid = str(uuid.uuid4())
        azure_oai_api_key = AzureOAIAPIKey(api_key="whatever", name="who cares?")
        response = client.post(
            f"/user/{user_uuid}/models/secret/AzureOAIAPIKey/{model_uuid}",
            json=azure_oai_api_key.model_dump(),
        )

        assert response.status_code == 200
        expected = {
            "api_key": "whatever",  # pragma: allowlist secret
            "name": "who cares?",
        }
        actual = response.json()
        assert actual == expected

    @pytest.mark.asyncio()
    async def test_update_model(
        self, user_uuid: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        key_uuid = str(uuid.uuid4())
        azure_oai_api_key = AzureOAIAPIKey(api_key="who cares", name="whatever")
        type_name = "secret"
        model_name = "AzureOAIAPIKey"

        # Create model
        response = client.post(
            f"/user/{user_uuid}/models/{type_name}/{model_name}/{key_uuid}",
            json=azure_oai_api_key.model_dump(),
        )
        assert response.status_code == 200

        response = client.put(
            f"/user/{user_uuid}/models/secret/AzureOAIAPIKey/{key_uuid}",
            json=azure_oai_api_key.model_dump(),
        )

        assert response.status_code == 200
        expected = {
            "api_key": "who cares",  # pragma: allowlist secret
            "name": "whatever",
        }
        actual = response.json()
        assert actual == expected

    @pytest.mark.asyncio()
    async def test_delete_model(
        self, user_uuid: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        key_uuid = str(uuid.uuid4())
        azure_oai_api_key = AzureOAIAPIKey(api_key="whatever", name="whatever")
        type_name = "secret"
        model_name = "AzureOAIAPIKey"

        # Create model
        response = client.post(
            f"/user/{user_uuid}/models/{type_name}/{model_name}/{key_uuid}",
            json=azure_oai_api_key.model_dump(),
        )
        assert response.status_code == 200

        response = client.delete(f"/user/{user_uuid}/models/secret/{key_uuid}")

        assert response.status_code == 200
        expected = {
            "api_key": "whatever",  # pragma: allowlist secret
            "name": "whatever",
        }
        actual = response.json()
        assert actual == expected
