import inspect
import random
from asyncio import iscoroutinefunction
from functools import wraps
from typing import Any, Callable, Dict, List, TypeVar

import pytest
import pytest_asyncio

__all__ = ["add_random_sufix", "fixture", "parametrize_fixtures"]


def add_random_sufix(prefix: str) -> str:
    return f"{prefix}_{random.randint(0, 1_000_000_000):09d}"


F = TypeVar("F", bound=Callable[..., Any])

fixtures: Dict[str, List[str]] = {}


def fixture(fixture_type: str, **kwargs: Any) -> Callable[[F], F]:
    def decorator(
        f: F, fixture_type: str = fixture_type, kwargs: Dict[str, Any] = kwargs
    ) -> F:
        global fixtures
        if iscoroutinefunction(f):

            @pytest_asyncio.fixture()  # type: ignore[misc]
            @wraps(f)
            async def wrapper(*args: Any, **kwargs: Any) -> Any:
                return await f(*args, **kwargs)
        else:

            @pytest.fixture()  # type: ignore[misc]
            @wraps(f)
            def wrapper(*args: Any, **kwargs: Any) -> Any:
                return f(*args, **kwargs)

        name = kwargs.get("name", f.__name__)
        if fixture_type in fixtures:
            fixtures[fixture_type].append(name)
        else:
            fixtures[fixture_type] = [name]

        return wrapper  # type: ignore[no-any-return]

    return decorator


def parametrize_fixtures(name: str, fixture_type: str) -> Callable[[F], F]:
    def decorator(f: F, name: str = name) -> F:
        if fixture_type not in fixtures:
            raise ValueError(f"fixture type {fixture_type} not found")

        params = fixtures[fixture_type]

        f = pytest.mark.parametrize(name, params, indirect=True)(f)

        # this is needed to make the fixture available in the caller's module
        @pytest.fixture(name=name)
        def wrapper(request: Any) -> Any:
            return request.getfixturevalue(request.param)

        # Get the caller's frame
        caller_frame = inspect.stack()[1].frame

        # Set the global variable in the caller's module
        caller_globals = caller_frame.f_globals

        var_name = add_random_sufix(f"{fixture_type}_{name}")
        caller_globals[var_name] = wrapper

        return f

    return decorator
