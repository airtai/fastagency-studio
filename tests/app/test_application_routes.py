import uuid

import pytest
from fastapi.testclient import TestClient

from fastagency.app import app

client = TestClient(app)


@pytest.mark.db()
class TestApplicationRoutes:
    @pytest.mark.asyncio()
    async def test_add_application(self, user_uuid: str) -> None:
        application_uuid = str(uuid.uuid4())
        team_uuid = str(uuid.uuid4())
        response = client.post(
            f"/user/{user_uuid}/application/{application_uuid}",
            json={
                "team_uuid": team_uuid,
                "json_str": {
                    "name": "whatever",
                },
            },
        )
        assert response.status_code == 200

    @pytest.mark.asyncio()
    async def test_application_chat_404(self) -> None:
        application_uuid = str(uuid.uuid4())
        response = client.post(
            f"/application/{application_uuid}/chat",
        )
        assert response.status_code == 404
        assert response.json() == {
            "detail": f"application_uuid {application_uuid} not found"
        }

    @pytest.mark.asyncio()
    async def test_get_all_applications(self, user_uuid: str) -> None:
        response = client.get(
            f"/user/{user_uuid}/applications",
        )
        assert response.status_code == 200

    # @pytest.mark.asyncio()
    # async def test_application_chat(self, user_uuid, monkeypatch: pytest.MonkeyPatch) -> None:
    #     team_uuid = str(uuid.uuid4())
    #     application_uuid = str(uuid.uuid4())

    #     # Mocking the find_application_using_raw function
    #     mock_find_application = AsyncMock(return_value={
    #         "user_uuid": user_uuid,
    #         "team_uuid": team_uuid,
    #     })
    #     monkeypatch.setattr(
    #         "fastagency.db.helpers.find_application_using_raw", mock_find_application
    #     )

    #     # Mocking the find_model_with_uuid_only_using_raw function
    #     mock_find_model = AsyncMock(return_value={
    #         "json_str": {"name": "whatever"},
    #     })
    #     monkeypatch.setattr(
    #         "fastagency.db.helpers.find_model_with_uuid_only_using_raw", mock_find_model
    #     )

    #     response = client.post(
    #         f"/application/{application_uuid}/chat",
    #     )

    #     assert response.status_code == 200
    #     assert response.json() == {
    #         "team_status": "inprogress",
    #         "team_name": "whatever",
    #         "team_uuid": team_uuid,
    #         "conversation_name": "New Chat",
    #     }
