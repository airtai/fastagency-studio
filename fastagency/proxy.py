import inspect
import re
from functools import wraps
from typing import Any, Callable, Dict, List, Optional, Set, Tuple

import requests


def get_params(
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


class Proxy:
    def __init__(self, servers: List[Dict[str, Any]], **kwargs: Any) -> None:
        """Proxy class to generate client from OpenAPI schema."""
        self.servers = servers
        self.kwargs = kwargs

    def _process_params(
        self, path: str, func: Callable[[Any], Any], **kwargs: Any
    ) -> Tuple[str, Dict[str, Any], Dict[str, Any]]:
        q_params, path_params, body = get_params(path, func)

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
        self, method: str, path: str, **kwargs: Any
    ) -> Callable[..., Dict[str, Any]]:
        def decorator(func: Callable[..., Any]) -> Callable[..., Dict[str, Any]]:
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
