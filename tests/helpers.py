import inspect
import random
import types
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


def get_caller_globals() -> Dict[str, Any]:
    # Get the caller's frame
    caller_frame = inspect.stack()[2].frame

    # Set the global variable in the caller's module
    caller_globals = caller_frame.f_globals

    return caller_globals


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

        caller_globals = get_caller_globals()

        var_name = add_random_sufix(f"{fixture_type}_{name}")
        caller_globals[var_name] = wrapper

        return f

    return decorator


def rename_parameter(src_name: str, dst_name: str) -> Callable[[F], F]:
    def decorator(f: F) -> F:
        def wrapper(*args: Any, **kwargs: Any) -> Any:
            bound_args = new_signature.bind(*args, **kwargs)
            bound_args.apply_defaults()
            if dst_name in bound_args.arguments:
                bound_args.arguments[src_name] = bound_args.arguments.pop(dst_name)
            return f(*bound_args.args, **bound_args.kwargs)

        original_signature = inspect.signature(f)
        parameters = list(original_signature.parameters.values())
        new_parameters = [
            param.replace(name=dst_name) if param.name == src_name else param
            for param in parameters
        ]
        new_signature = original_signature.replace(parameters=new_parameters)
        new_function = types.FunctionType(
            wrapper.__code__,
            wrapper.__globals__,
            name=f.__name__,
            argdefs=wrapper.__defaults__,
            closure=wrapper.__closure__,
        )
        new_function.__signature__ = new_signature  # type: ignore[attr-defined]
        new_function.__doc__ = f.__doc__
        new_function.__annotations__ = f.__annotations__

        return new_function  # type: ignore[return-value]

    return decorator


def parametrized_fixture(
    target_type_name: str,
    src_types: List[str],
    placeholder_name: str = "placeholder",
) -> Callable[[F], F]:
    def decorator(f: F) -> F:
        for src_type in src_types:
            name = f"{target_type_name}_{src_type}"

            f = rename_parameter(placeholder_name, src_type)(f)
            f = fixture(target_type_name, name=name)(f)

            caller_globals = get_caller_globals()
            caller_globals[name] = f

        return f

    return decorator
