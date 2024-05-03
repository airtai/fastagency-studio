import uuid

import pytest
from fastapi.testclient import TestClient

from fastagency.app import app
from fastagency.models.llms.azure import AzureOAIAPIKey

client = TestClient(app)


class TestModelRoutes:
    @pytest.mark.asyncio()
    async def test_get_all_models(
        self, user_id: int, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        key_uuid = uuid.uuid4().hex
        azure_oai_api_key = AzureOAIAPIKey(api_key="whatever")
        type_name = "secret"
        model_name = "AzureOAIAPIKey"

        # Create model
        response = client.post(
            f"/user/{user_id}/models/{type_name}/{model_name}/{key_uuid}",
            json=azure_oai_api_key.model_dump(),
        )
        assert response.status_code == 200

        response = client.get(f"/user/{user_id}/models")
        assert response.status_code == 200

        expected = [
            {
                "json_string": {"api_key": "whatever"},  # pragma: allowlist secret
                "model_uuid": key_uuid,
                "type_name": "secret",
                "model_name": "AzureOAIAPIKey",
                "userId": user_id,
            }
        ]
        actual = response.json()
        assert len(actual) == len(expected)
        for i in range(len(expected)):
            for key in expected[i]:
                assert actual[i][key] == expected[i][key]

    @pytest.mark.asyncio()
    async def test_add_model(self, user_id: int) -> None:
        model_uuid = uuid.uuid4().hex
        azure_oai_api_key = AzureOAIAPIKey(api_key="whatever")
        response = client.post(
            f"/user/{user_id}/models/secret/AzureOAIAPIKey/{model_uuid}",
            json=azure_oai_api_key.model_dump(),
        )

        assert response.status_code == 200
        expected = {"api_key": "whatever"}  # pragma: allowlist secret
        actual = response.json()
        assert actual == expected

    @pytest.mark.asyncio()
    async def test_update_model(
        self, user_id: int, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        key_uuid = uuid.uuid4().hex
        azure_oai_api_key = AzureOAIAPIKey(api_key="who cares")
        type_name = "secret"
        model_name = "AzureOAIAPIKey"

        # Create model
        response = client.post(
            f"/user/{user_id}/models/{type_name}/{model_name}/{key_uuid}",
            json=azure_oai_api_key.model_dump(),
        )
        assert response.status_code == 200

        response = client.put(
            f"/user/{user_id}/models/secret/AzureOAIAPIKey/{key_uuid}",
            json=azure_oai_api_key.model_dump(),
        )

        assert response.status_code == 200
        expected = {"api_key": "who cares"}  # pragma: allowlist secret
        actual = response.json()
        assert actual == expected

    @pytest.mark.asyncio()
    async def test_delete_model(
        self, user_id: int, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        key_uuid = uuid.uuid4().hex
        azure_oai_api_key = AzureOAIAPIKey(api_key="whatever")
        type_name = "secret"
        model_name = "AzureOAIAPIKey"

        # Create model
        response = client.post(
            f"/user/{user_id}/models/{type_name}/{model_name}/{key_uuid}",
            json=azure_oai_api_key.model_dump(),
        )
        assert response.status_code == 200

        response = client.delete(f"/user/{user_id}/models/secret/{key_uuid}")

        assert response.status_code == 200
        expected = {"api_key": "whatever"}  # pragma: allowlist secret
        actual = response.json()
        assert actual == expected
