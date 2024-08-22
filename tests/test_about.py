import pytest

from fastagency_studio.__about__ import __version__
from fastagency_studio.help import help


def test_version() -> None:
    assert __version__ == "0.0.0dev0"


def test_help() -> None:
    expected = "Hello, this is a help string"
    actual = help()

    assert actual == expected


@pytest.mark.anthropic
def test_anthropic() -> None:
    assert 1 == 1


@pytest.mark.azure_oai
def test_azure_aoi() -> None:
    assert 1 == 1


@pytest.mark.openai
def test_openai() -> None:
    assert 1 == 1


@pytest.mark.togetherai
def test_togetherai() -> None:
    assert 1 == 1


@pytest.mark.llm
def test_llm() -> None:
    assert 1 == 1
