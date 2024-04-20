from fastagency.models.llms._base import _llm_registry


def test_get_llm_schemas() -> None:
    schemas = _llm_registry.get_schemas()
    names = {schema.name for schema in schemas.schemas}
    assert names == {"OpenAI", "AzureOAI"}
