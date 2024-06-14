import uuid
from typing import Optional

import pytest
from pydantic import BaseModel

from fastagency.app import add_model
from fastagency.helpers import get_model_by_ref
from fastagency.models.base import ObjectReference
from fastagency.models.toolboxes.toolbox import (
    Client,
    OpenAPIAuth,
    Toolbox,
)


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
        actual = await OpenAPIAuth.create_autogen(
            model_id=uuid.UUID(model_uuid),
            user_id=uuid.UUID(user_uuid),
        )

        expected = ("test", "password")
        assert actual == expected


class TestToolbox:
    @pytest.mark.asyncio()
    async def test_toolbox_fixture(
        self, toolbox_ref: ObjectReference, fastapi_openapi_url: str, user_uuid: str
    ) -> None:
        toolbox: Toolbox = await get_model_by_ref(  # type: ignore[assignment]
            model_ref=toolbox_ref
        )
        assert toolbox
        assert isinstance(toolbox, Toolbox)
        assert toolbox.name == "test_toolbox"
        assert str(toolbox.openapi_url) == fastapi_openapi_url

        client: Client = await Toolbox.create_autogen(
            user_id=uuid.UUID(user_uuid), model_id=toolbox_ref.uuid
        )
        assert client
        assert isinstance(client, Client)

    @pytest.mark.db()
    @pytest.mark.asyncio()
    async def test_toolbox_create_autogen(
        self,
        toolbox_ref: ObjectReference,
        user_uuid: str,
    ) -> None:
        client = await Toolbox.create_autogen(
            model_id=toolbox_ref.uuid,
            user_id=uuid.UUID(user_uuid),
        )

        assert len(client.registered_funcs) == 3

        expected = {
            "create_item_items_post": "Create Item",
            "read_item_items__item_id__get": "Read Item",
            "read_root__get": "Read Root",
        }

        actual = {
            x.__name__: x._description  # type: ignore[attr-defined]
            for x in client.registered_funcs
        }

        assert actual == expected, actual

        # actual = function_infos[0].function()
        actual = client.registered_funcs[0]()
        expected = {"Hello": "World"}
        assert actual == expected, actual

        # actual = function_infos[2].function(item_id=1, q="test")
        actual = client.registered_funcs[2](item_id=1, q="test")
        expected = {"item_id": 1, "q": "test"}  # type: ignore[dict-item]
        assert actual == expected, actual

        class Item(BaseModel):
            name: str
            description: Optional[str] = None
            price: float
            tax: Optional[float] = None

        # actual = function_infos[1].function(body=Item(name="item", price=1.0))
        actual = client.registered_funcs[1](body=Item(name="item", price=1.0))
        expected = {"name": "item", "description": None, "price": 1.0, "tax": None}  # type: ignore[dict-item]
        assert actual == expected, actual
