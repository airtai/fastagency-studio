"""A repository of open-source AI agents."""

from .__about__ import __version__  # noqa: F401
from .models.llms import get_llm_registry

__all__ = ["get_llm_registry"]
