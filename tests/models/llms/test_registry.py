from fastagency.models.llms._registry import get_llm_schemas


def test_get_llm_schemas() -> None:
    schemas = get_llm_schemas()
    names = {schema.name for schema in schemas.schemas}
    assert names == {"OpenAI", "AzureOAI"}
