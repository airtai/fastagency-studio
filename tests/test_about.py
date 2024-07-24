from fastagency_studio.__about__ import __version__
from fastagency_studio.help import help


def test_version() -> None:
    assert __version__ == "0.0.0dev0"


def test_help() -> None:
    expected = "Hello, this is a help string"
    actual = help()

    assert actual == expected
