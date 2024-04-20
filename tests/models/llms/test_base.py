from fastagency.models._registry import Registry


def test_get_llm_schemas() -> None:
    registry = Registry.get_default()
    schemas = registry.get_schemas_for_type("llm")
    names = {schema.name for schema in schemas.schemas}
    assert names == {"OpenAI", "AzureOAI"}
