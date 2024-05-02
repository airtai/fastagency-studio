import tempfile
from pathlib import Path

from fastapi_code_generator.__main__ import generate_code

from pydantic import Field

OPENAPI_FILE_PATH = (Path(__file__).parent / "openapi.json").resolve()
TEMPLATE_DIR = Path(__file__).parent.parent.parent / "templates"

def test_fastapi_codegen_template():
    with tempfile.TemporaryDirectory() as temp_dir:
        td = Path(temp_dir)
        print(td)
        print(OPENAPI_FILE_PATH)
        print(TEMPLATE_DIR)
        print(OPENAPI_FILE_PATH.name)

        generate_code(
            input_name=OPENAPI_FILE_PATH.name,
            input_text=OPENAPI_FILE_PATH.read_text(),
            encoding="utf-8",
            output_dir=td,
            template_dir=TEMPLATE_DIR,
        )

        # from fastagency.proxy import Proxy

        print("models.py")
        models = open(td / "models.py").read()
        print(models)
        exec(models)
        print("*"*100)
        print("main.py")
        main_content = open(td / "main.py").read()
        print(main_content)
        exec(main_content)

        # import sys
        # sys.path.append(str(td))
        # from main import update_item_items__item_id__ships__ship__put
        print(locals())
        update_item_items__item_id__ships__ship__put(item_id=1, ship="Marry Jane", q1="q1", q2=2, body=Item(name="name", description="description", price=1.0, tax=2.0))

        