import tempfile
from pathlib import Path
from typing import Any, Dict, List, Union

import requests
from _pytest.monkeypatch import MonkeyPatch
from fastapi_code_generator.__main__ import generate_code

OPENAPI_FILE_PATH = (Path(__file__).parent / "openapi.json").resolve()
TEMPLATE_DIR = Path(__file__).parent.parent.parent / "templates"


class MockResponse:
    def __init__(
        self, json_data: Union[List[Dict[str, Any]], Dict[str, Any]], status_code: int
    ) -> None:
        """Mock response object for requests."""
        self.json_data = json_data
        self.status_code = status_code

    def json(self) -> Union[List[Dict[str, Any]], Dict[str, Any]]:
        """Return the json data."""
        return self.json_data


def test_fastapi_codegen_template(monkeypatch: MonkeyPatch) -> None:
    with tempfile.TemporaryDirectory() as temp_dir:
        td = Path(temp_dir)

        generate_code(
            input_name=OPENAPI_FILE_PATH.name,
            input_text=OPENAPI_FILE_PATH.read_text(),
            encoding="utf-8",
            output_dir=td,
            template_dir=TEMPLATE_DIR,
        )

        ldict: Dict[str, Any] = {}

        models = open(td / "models.py").read()  # noqa
        exec(models, globals(), ldict)

        main_content = open(td / "main.py").read()  # noqa
        exec(main_content, globals(), ldict)

        # import sys
        # sys.path.append(str(td))
        # from main import update_item_items__item_id__ships__ship__put

        app = ldict["app"]  # noqa
        # print(app.registered_funcs)

        update_item_items__item_id__ships__ship__put = ldict[
            "update_item_items__item_id__ships__ship__put"
        ]
        Item = ldict["Item"]  # noqa

        def mock_requests_put(
            url: str, params: Dict[str, Any], **body_dict: Any
        ) -> MockResponse:
            json_resp: Dict[str, Any] = {}
            return MockResponse(json_resp, 200)

        monkeypatch.setattr(requests, "put", mock_requests_put)
        response_json = update_item_items__item_id__ships__ship__put(
            item_id=1,
            ship="Marry Jane",
            q1="q1",
            q2=2,
            body=Item(name="name", description="description", price=1.0, tax=2.0),
        )
        assert response_json == {}
