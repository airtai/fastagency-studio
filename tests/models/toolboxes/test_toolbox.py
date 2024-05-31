import uuid

import pytest
from asyncer import asyncify

from fastagency.app import add_model
from fastagency.models.toolboxes.toolbox import OpenAPIAuth, OpenAPIAuthRef, Toolbox
from fastagency.openapi.client import Client


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
            "password": "password",  # pragma: allowlist secret
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
            name="openapi_auth_secret",
            username="test",
            password="password",  # pragma: allowlist secret
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
        assert len(actual_client.registered_funcs) == 3, actual_client.registered_funcs

        actual = [x.__name__ for x in actual_client.registered_funcs]
        expected = [
            "read_root__get",
            "create_item_items__post",
            "read_item_items__item_id__get",
        ]
        assert actual == expected

        # ToDo: Add test case which makes request

        # route_1_resp = actual_client.registered_funcs[0]()
        # assert route_1_resp == {"Hello": "World"}
