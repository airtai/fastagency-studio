import random
import uuid
from typing import Iterator

import pytest
from fastapi.testclient import TestClient

from fastagency.app import ModelResponse, app
from fastagency.models.llms.azure import AzureOAIAPIKey

client = TestClient(app)


class TestModelRoutes:
    @pytest.fixture(autouse=True)
    def _setup_and_teardown(self) -> Iterator[None]:
        try:
            self.user_id = random.randint(1, 1_000_000)
            yield
        finally:
            pass

    def test_get_all_models(self, monkeypatch: pytest.MonkeyPatch) -> None:
        key_uuid = uuid.uuid4().hex
        model_response = ModelResponse(
            uuid=key_uuid,
            model=AzureOAIAPIKey(api_key="whatever"),
            type_name="secret",
            model_name="AzureOAIAPIKey",
            user_id=self.user_id,
        )
        monkeypatch.setattr("fastagency.app.all_models", [model_response])

        response = client.get(f"/user/{self.user_id}/models")
        assert response.status_code == 200

        expected = [
            {
                "model": {"api_key": "whatever"},  # pragma: allowlist secret
                "uuid": key_uuid,
                "type_name": "secret",
                "model_name": "AzureOAIAPIKey",
                "user_id": self.user_id,
            }
        ]
        actual = response.json()
        assert actual == expected

    def test_add_model(self) -> None:
        model_uuid = uuid.uuid4().hex
        azure_oai_api_key = AzureOAIAPIKey(api_key="whatever")
        response = client.post(
            f"/user/{self.user_id}/models/secret/AzureOAIAPIKey/{model_uuid}",
            json=azure_oai_api_key.model_dump(),
        )

        assert response.status_code == 200
        expected = {"api_key": "whatever"}  # pragma: allowlist secret
        actual = response.json()
        assert actual == expected

    def test_update_model(self, monkeypatch: pytest.MonkeyPatch) -> None:
        key_uuid = uuid.uuid4().hex
        model_response = ModelResponse(
            uuid=key_uuid,
            model=AzureOAIAPIKey(api_key="whatever"),
            type_name="secret",
            model_name="AzureOAIAPIKey",
            user_id=self.user_id,
        )
        monkeypatch.setattr("fastagency.app.all_models", [model_response])

        azure_oai_api_key = AzureOAIAPIKey(api_key="who cares")
        response = client.put(
            f"/user/{self.user_id}/models/secret/AzureOAIAPIKey/{key_uuid}",
            json=azure_oai_api_key.model_dump(),
        )

        assert response.status_code == 200
        expected = {"api_key": "who cares"}  # pragma: allowlist secret
        actual = response.json()
        assert actual == expected

    def test_delete_model(self, monkeypatch: pytest.MonkeyPatch) -> None:
        key_uuid = uuid.uuid4().hex
        model_response = ModelResponse(
            uuid=key_uuid,
            model=AzureOAIAPIKey(api_key="whatever"),
            type_name="secret",
            model_name="AzureOAIAPIKey",
            user_id=self.user_id,
        )
        monkeypatch.setattr("fastagency.app.all_models", [model_response])

        response = client.delete(f"/user/{self.user_id}/models/secret/{key_uuid}")

        assert response.status_code == 200
        expected = {"api_key": "whatever"}  # pragma: allowlist secret
        actual = response.json()
        assert actual == expected
