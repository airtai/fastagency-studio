from .._registry import Registry, UUIDModel

__all__ = ["UUIDModel", "get_llm_registry"]

_llm_registry = Registry("llm_registry")


def get_llm_registry() -> Registry:
    """Get the LLM registry.

    Returns:
        Registry: The LLM registry
    """
    return _llm_registry
