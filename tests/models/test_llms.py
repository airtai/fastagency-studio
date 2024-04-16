from fastagency.models.llms import AzureOAI, OpenAI


class TestOpenAI:
    def test_openai_model(self) -> None:
        model = OpenAI(api_key="sk-1234567890abcdef1234567890abcdef")
        assert model.api_key

    def test_openai_model_schema(self) -> None:
        schema = OpenAI.model_json_schema()
        assert schema
        # print(schema)


class TestAzureOAI:
    def test_azureoai_model(self) -> None:
        model = AzureOAI(api_key="sk-1234567890abcdef1234567890abcdef")
        assert model.api_key

    def test_openai_model_schema(self) -> None:
        schema = AzureOAI.model_json_schema()
        assert schema
        # print(schema)
