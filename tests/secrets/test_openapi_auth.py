import uuid

import pytest
from asyncer import asyncify

from fastagency.app import add_model
from fastagency.models.secrets.openapi_auth import OpenAPIAuth


class TestOpenAPIAuth:
    def test_openapi_auth(self) -> None:
        model = OpenAPIAuth(
            name="openapi_auth_secret",
            username="test",
            password="password",  # pragma: allowlist secret
        )

        expected = {
            "name": "openapi_auth_secret",
            "username": "test",
            "password": "password",
        }
        assert model.model_dump() == expected

    @pytest.mark.db()
    @pytest.mark.asyncio()
    async def test_azure_api_key_model_create_autogen(
        self,
        user_uuid: str,
    ) -> None:
        # Add secret to database
        openapi_auth = OpenAPIAuth(  # type: ignore [operator]
            name="openapi_auth_secret", username="test", password="password"
        )
        model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="secret",
            model_name=OpenAPIAuth.__name__,  # type: ignore [attr-defined]
            model_uuid=model_uuid,
            model=openapi_auth.model_dump(),
        )

        # Call create_autogen
        actual = await asyncify(OpenAPIAuth.create_autogen)(
            model_id=uuid.UUID(model_uuid),
            user_id=uuid.UUID(user_uuid),
        )

        expected = ("test", "password")
        assert actual == expected
