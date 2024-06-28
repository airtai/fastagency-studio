import functools
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
        # Get the original signature of the function
        sig = inspect.signature(f)

        # Create a new parameter list with src_name replaced by dst_name
        params = [
            inspect.Parameter(
                dst_name if param.name == src_name else param.name,
                param.kind,
                default=param.default,
                annotation=param.annotation,
            )
            for param in sig.parameters.values()
        ]

        # Create a new signature with the modified parameters
        new_sig = sig.replace(parameters=params)

        # Define the body of the new function
        def wrapper(*args, **kwargs):  # type: ignore[no-untyped-def]
            bound_args = new_sig.bind(*args, **kwargs)
            bound_args.apply_defaults()
            arguments = bound_args.arguments

            if dst_name in arguments:
                arguments[src_name] = arguments.pop(dst_name)

            return f(**arguments)

        # Create the new function with the modified signature
        new_func = types.FunctionType(
            wrapper.__code__,
            globals(),
            name=f.__name__,
            argdefs=wrapper.__defaults__,
            closure=wrapper.__closure__,
        )
        new_func.__signature__ = new_sig  # type: ignore[attr-defined]
        functools.update_wrapper(new_func, f)
        return new_func  # type: ignore

    return decorator


def expand_fixture(
    dst_fixture_prefix: str,
    src_fixtures_names: List[str],
    placeholder_name: str,
) -> Callable[[F], F]:
    def decorator(f: F) -> F:
        for src_type in src_fixtures_names:
            name = f"{dst_fixture_prefix}_{src_type}"

            f_renamed = rename_parameter(placeholder_name, src_type)(f)
            f_fixture = fixture(dst_fixture_prefix, name=name)(f_renamed)

            caller_globals = get_caller_globals()
            caller_globals[name] = f_fixture

        return f_fixture

    return decorator
