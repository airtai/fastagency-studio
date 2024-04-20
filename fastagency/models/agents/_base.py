from .._registry import Registry, UUIDModel

__all__ = ["UUIDModel", "register"]

register = Registry.get_default().register("agent")
