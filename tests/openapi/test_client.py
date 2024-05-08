from pathlib import Path

from fastagency.openapi.client import Client


class TestClient:
    def test_create(self) -> None:
        json_path = Path(__file__).parent / "templates" / "openapi.json"
        assert json_path.exists(), json_path.resolve()

        openapi_json = json_path.read_text()
        client = Client.create(openapi_json)

        assert client is not None
        assert isinstance(client, Client)

        assert len(client.registered_funcs) == 1
        assert (
            client.registered_funcs[0].__name__
            == "update_item_items__item_id__ships__ship__put"
        )
        assert (
            client.registered_funcs[0].__doc__
            == """
    Update Item
    """
        )
