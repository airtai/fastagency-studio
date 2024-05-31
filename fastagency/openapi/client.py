import importlib
import inspect
import re
import shutil
import sys
import tempfile
from functools import wraps
from pathlib import Path
from typing import Any, Callable, Dict, List, Literal, Optional, Set, Tuple

import requests
from fastapi_code_generator.__main__ import generate_code

__all__ = ["Client"]


class Client:
    def __init__(
        self, servers: List[Dict[str, Any]], title: Optional[str] = None, **kwargs: Any
    ) -> None:
        """Proxy class to generate client from OpenAPI schema."""
        self.servers = servers
        self.title = title
        self.kwargs = kwargs
        self.registered_funcs: List[Callable[..., Any]] = []

    @staticmethod
    def _get_params(
        path: str, func: Callable[..., Any]
    ) -> Tuple[Set[str], Set[str], Optional[str]]:
        sig = inspect.signature(func)

        params_names = set(sig.parameters.keys())

        path_params = set(re.findall(r"\{(.+?)\}", path))
        if not path_params.issubset(params_names):
            raise ValueError(f"Path params {path_params} not in {params_names}")

        body = "body" if "body" in params_names else None

        q_params = set(params_names) - path_params - {body}

        return q_params, path_params, body

    def _process_params(
        self, path: str, func: Callable[[Any], Any], **kwargs: Any
    ) -> Tuple[str, Dict[str, Any], Dict[str, Any]]:
        q_params, path_params, body = Client._get_params(path, func)

        expanded_path = path.format(**{p: kwargs[p] for p in path_params})

        url = self.servers[0]["url"] + expanded_path

        body_dict = (
            {
                "json": kwargs[body].model_dump()
                if hasattr(kwargs[body], "model_dump")
                else kwargs[body].dict()
            }
            if body
            else {}
        )
        body_dict["headers"] = {"Content-Type": "application/json"}

        params = {k: v for k, v in kwargs.items() if k in q_params}

        return url, params, body_dict

    def _request(
        self, method: Literal["put", "get", "post", "delete"], path: str, **kwargs: Any
    ) -> Callable[..., Dict[str, Any]]:
        def decorator(func: Callable[..., Any]) -> Callable[..., Dict[str, Any]]:
            self.registered_funcs.append(func)

            @wraps(func)
            def wrapper(*args: Any, **kwargs: Any) -> Dict[str, Any]:
                url, params, body_dict = self._process_params(path, func, **kwargs)
                response = getattr(requests, method)(url, params=params, **body_dict)
                return response.json()  # type: ignore [no-any-return]

            return wrapper

        return decorator  # type: ignore [return-value]

    def put(self, path: str, **kwargs: Any) -> Callable[..., Dict[str, Any]]:
        return self._request("put", path, **kwargs)

    def get(self, path: str, **kwargs: Any) -> Callable[..., Dict[str, Any]]:
        return self._request("get", path, **kwargs)

    def post(self, path: str, **kwargs: Any) -> Callable[..., Dict[str, Any]]:
        return self._request("post", path, **kwargs)

    def delete(self, path: str, **kwargs: Any) -> Callable[..., Dict[str, Any]]:
        return self._request("delete", path, **kwargs)

    @classmethod
    def _get_template_dir(cls) -> Path:
        path = Path(__file__).parents[2] / "templates"
        if not path.exists():
            raise RuntimeError(f"Template directory {path.resolve()} not found.")
        return path

    @classmethod
    def create(cls, openapi_json: str, *, name: Optional[str] = None) -> "Client":
        if name is None:
            name = "openapi.json"

        with tempfile.TemporaryDirectory() as temp_dir:
            td = Path(temp_dir)

            generate_code(
                input_name=name,
                input_text=openapi_json,
                encoding="utf-8",
                output_dir=td,
                template_dir=cls._get_template_dir(),
            )
            # Use unique file name for main.py
            main_name = f"main_{td.name}"
            main_path = td / f"{main_name}.py"
            shutil.move(td / "main.py", main_path)

            # Change "from models import" to "from models_unique_name import"
            with open(main_path) as f:  # noqa: PTH123
                main_py_code = f.read()
            main_py_code = main_py_code.replace(
                "from .models import", f"from models_{td.name} import"
            )
            with open(main_path, "w") as f:  # noqa: PTH123
                f.write(main_py_code)

            # Use unique file name for models.py
            models_name = f"models_{td.name}"
            models_path = td / f"{models_name}.py"
            shutil.move(td / "models.py", models_path)

            # add td to sys.path
            try:
                sys.path.append(str(td))
                main = importlib.import_module(main_name, package=td.name)  # nosemgrep
            finally:
                sys.path.remove(str(td))

            client: Client = main.app  # type: ignore [attr-defined]
            return client
