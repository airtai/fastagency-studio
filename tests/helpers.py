import functools
import inspect
import random
import types
from typing import Any, Callable, Dict, List, TypeVar

import pytest

__all__ = ["add_random_sufix", "parametrize_fixtures", "tag", "tag_list"]


def add_random_sufix(prefix: str) -> str:
    return f"{prefix}_{random.randint(0, 1_000_000_000):09d}"


F = TypeVar("F", bound=Callable[..., Any])

# fixtures: Dict[str, List[str]] = {}

tags: Dict[str, List[str]] = {}


def tag(tag_symbol: str) -> Callable[[F], F]:
    def decorator(f: F, tag_symbol: str = tag_symbol) -> F:
        global tags
        if not hasattr(f, "_pytestfixturefunction"):
            raise ValueError(f"function {f.__name__} is not a fixture")

        name = f._pytestfixturefunction.name
        if name is None:
            name = f.__name__

        if tag_symbol in tags:
            tags[tag_symbol].append(name)
        else:
            tags[tag_symbol] = [name]

        return f

    return decorator


def tag_list(tag_symbol: str) -> Callable[[List[F]], List[F]]:
    def decorator(fs: List[F], tag_symbol: str = tag_symbol) -> List[F]:
        return [tag(tag_symbol)(f) for f in fs]

    return decorator


def get_by_tag(tag_symbol: str) -> List[str]:
    return tags.get(tag_symbol, [])


def get_tags() -> List[str]:
    return list(tags.keys())


def get_caller_globals() -> Dict[str, Any]:
    # Get the caller's frame
    caller_frame = inspect.stack()[2].frame

    # Set the global variable in the caller's module
    caller_globals = caller_frame.f_globals

    return caller_globals


def parametrize_fixtures(
    parameter_name: str, src_fixtures: List[str]
) -> Callable[[F], F]:
    def decorator(f: F, parameter_name: str = parameter_name) -> F:
        f = pytest.mark.parametrize(parameter_name, src_fixtures, indirect=True)(f)

        # this is needed to make the fixture available in the caller's module
        @pytest.fixture(name=parameter_name)
        def wrapper(request: Any) -> Any:
            return request.getfixturevalue(request.param)

        caller_globals = get_caller_globals()

        var_name = add_random_sufix(f"parametrized_fixtures_{parameter_name}")
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
) -> Callable[[F], List[F]]:
    def decorator(f: F) -> List[F]:
        retval: List[F] = []
        for src_type in src_fixtures_names:
            name = f"{dst_fixture_prefix}_{src_type}"

            f_renamed = rename_parameter(placeholder_name, src_type)(f)
            f_fixture = pytest.fixture(name=name)(f_renamed)

            caller_globals = get_caller_globals()
            caller_globals[name] = f_fixture

            retval.append(f_fixture)

        return retval

    return decorator
