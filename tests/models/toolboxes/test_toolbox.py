from typing import Optional

import pytest
from pydantic import BaseModel

from fastagency_studio.helpers import create_autogen, get_model_by_ref
from fastagency_studio.models.base import ObjectReference
from fastagency_studio.models.toolboxes.toolbox import (
    OpenAPI,
    Toolbox,
)


@pytest.mark.skip("Functionality is not implemented yet")
class TestOpenAPIAuth:
    pass


class TestToolbox:
    @pytest.mark.db
    @pytest.mark.asyncio
    async def test_toolbox_constructor(
        self, toolbox_ref: ObjectReference, fastapi_openapi_url: str, user_uuid: str
    ) -> None:
        toolbox: Toolbox = await get_model_by_ref(  # type: ignore[assignment]
            model_ref=toolbox_ref
        )
        assert toolbox
        assert isinstance(toolbox, Toolbox)
        assert toolbox.name == "test_toolbox"
        assert str(toolbox.openapi_url) == fastapi_openapi_url

    @pytest.mark.db
    @pytest.mark.asyncio
    async def test_toolbox_create_autogen(
        self,
        toolbox_ref: ObjectReference,
        user_uuid: str,
    ) -> None:
        api: OpenAPI = await create_autogen(
            model_ref=toolbox_ref,
            user_uuid=user_uuid,
        )
        assert api
        assert isinstance(api, OpenAPI)

        assert len(api.registered_funcs) == 3

        expected = {
            "create_item_items_post": "Create Item",
            "read_item_items__item_id__get": "Read Item",
            "read_root__get": "Read Root",
        }

        actual = {
            x.__name__: x._description  # type: ignore[attr-defined]
            for x in api.registered_funcs
        }

        assert actual == expected, actual

        # actual = function_infos[0].function()
        actual = api.registered_funcs[0]()
        expected = {"Hello": "World"}
        assert actual == expected, actual

        # actual = function_infos[2].function(item_id=1, q="test")
        actual = api.registered_funcs[2](item_id=1, q="test")
        expected = {"item_id": 1, "q": "test"}  # type: ignore[dict-item]
        assert actual == expected, actual

        class Item(BaseModel):
            name: str
            description: Optional[str] = None
            price: float
            tax: Optional[float] = None

        # actual = function_infos[1].function(body=Item(name="item", price=1.0))
        actual = api.registered_funcs[1](body=Item(name="item", price=1.0))
        expected = {"name": "item", "description": None, "price": 1.0, "tax": None}  # type: ignore[dict-item]
        assert actual == expected, actual
