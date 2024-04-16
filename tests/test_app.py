from fastapi.testclient import TestClient

from fastagency.app import app

client = TestClient(app)


class TestApp:
    def test_list_llms(self) -> None:
        response = client.get("/models/llms")
        assert response.status_code == 200
        expected = ["OpenAI", "AzureOAI"]
        assert response.json() == expected

    def test_get_openai_schema(self) -> None:
        response = client.get("/models/llms/OpenAI")
        assert response.status_code == 200
        expected = {
            "properties": {
                "model": {
                    "const": ["gpt-4", "gpt-3.5-turbo"],
                    "default": "gpt-3.5-turbo",
                    "description": "The model to use for the OpenAI API, e.g. 'gpt-3.5-turbo'",
                    "enum": [["gpt-4", "gpt-3.5-turbo"]],
                    "title": "Model",
                    "type": "array",
                },
                "api_key": {
                    "description": "The API key for the OpenAI API, e.g. 'sk-1234567890abcdef1234567890abcdef'",
                    "title": "API Key",
                    "type": "string",
                },
                "base_url": {
                    "default": "https://api.openai.com/v1",
                    "description": "The base URL of the OpenAI API",
                    "format": "uri",
                    "maxLength": 2083,
                    "minLength": 1,
                    "title": "Base Url",
                    "type": "string",
                },
                "api_type": {
                    "const": "openai",
                    "default": "openai",
                    "description": "The type of the API, must be 'openai'",
                    "enum": ["openai"],
                    "title": "API Type",
                    "type": "string",
                },
            },
            "required": ["api_key"],
            "title": "OpenAI",
            "type": "object",
        }
        # print(response.json())
        assert response.json() == expected
