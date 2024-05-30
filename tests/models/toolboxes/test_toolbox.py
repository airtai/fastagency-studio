import uuid

import pytest
from asyncer import asyncify

from fastagency.app import add_model
from fastagency.models.secrets.openapi_auth import OpenAPIAuth, OpenAPIAuthRef
from fastagency.models.toolboxes.toolbox import Toolbox
from fastagency.openapi.client import Client


class TestToolbox:
    def test_toolbox_constructor(self, fastapi_openapi_url: str) -> None:
        auth_uuid = uuid.uuid4()
        openapi_auth_ref = OpenAPIAuthRef(uuid=auth_uuid)

        toolbox = Toolbox(
            name="test_toolbox_constructor",
            openapi_url=fastapi_openapi_url,
            openapi_auth=openapi_auth_ref,
        )

        assert toolbox
        assert toolbox.name == "test_toolbox_constructor"
        assert str(toolbox.openapi_url) == fastapi_openapi_url
        assert toolbox.openapi_auth.uuid == auth_uuid  # type: ignore[union-attr]

    @pytest.mark.db()
    @pytest.mark.asyncio()
    async def test_toolbox_create_autogen(
        self,
        user_uuid: str,
        fastapi_openapi_url: str,
    ) -> None:
        openapi_auth = OpenAPIAuth(
            name="openapi_auth_secret",
            username="test",
            password="password",  # pragma: allowlist secret
        )
        openapi_auth_model_uuid = str(uuid.uuid4())

        await add_model(
            user_uuid=user_uuid,
            type_name="secret",
            model_name=OpenAPIAuth.__name__,  # type: ignore [attr-defined]
            model_uuid=openapi_auth_model_uuid,
            model=openapi_auth.model_dump(),
        )

        model_uuid = str(uuid.uuid4())
        toolbox = Toolbox(
            name="test_toolbox_constructor",
            openapi_url=fastapi_openapi_url,
            openapi_auth=openapi_auth.get_reference_model()(
                uuid=openapi_auth_model_uuid
            ),
        )

        await add_model(
            user_uuid=user_uuid,
            type_name="toolbox",
            model_name=Toolbox.__name__,  # type: ignore [attr-defined]
            model_uuid=model_uuid,
            model=toolbox.model_dump(),
        )

        actual_client = await asyncify(Toolbox.create_autogen)(
            model_id=uuid.UUID(model_uuid),
            user_id=uuid.UUID(user_uuid),
        )

        assert isinstance(actual_client, Client)
        # print(dir(actual_client))

        # resp = actual_client.get("/")
        # print(resp)

        # ToDo: Add test case which makes request
