"""Tests."""

from fastagency import __version__ as version


def test_me() -> None:
    """Test."""
    assert isinstance(version, str)
