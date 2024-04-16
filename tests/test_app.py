from fastapi.testclient import TestClient

from fastagency.app import app
from fastagency.models.llms import AzureOAI, LLMSchema, OpenAI

client = TestClient(app)


class TestValidateOpenAI:
    def test_get_openai_schema(self) -> None:
        response = client.get("/models/llms/schemas")
        assert response.status_code == 200

        expected = {
            "properties": {
                "model": {
                    "default": "gpt-3.5-turbo",
                    "description": "The model to use for the OpenAI API, e.g. 'gpt-3.5-turbo'",
                    "enum": ["gpt-4", "gpt-3.5-turbo"],
                    "title": "Model",
                    "type": "string",
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
        llm_schema = [  # noqa: RUF015
            LLMSchema(**json)
            for json in response.json()["schemas"]
            if json["name"] == "OpenAI"
        ][0]

        # print(f"{llm_schema=}")
        assert llm_schema.json_schema == expected

    def test_validate_success(self) -> None:
        response = client.post(
            f"/models/llms/{OpenAI.__name__}/validate",
            json={
                "api_key": "sk-1234567890abcdef1234567890abcdef",  # pragma: allowlist secret
                "model": "gpt-3.5-turbo",
                "base_url": "https://api.openai.com/v1",
                "api_type": "openai",
            },
        )
        assert response.status_code == 200

    def test_validate_missing_key(self) -> None:
        response = client.post(
            f"/models/llms/{OpenAI.__name__}/validate",
            json={
                "model": "gpt-3.5-turbo",
                "base_url": "https://api.openai.com/v1",
                "api_type": "openai",
            },
        )
        assert response.status_code == 422
        msg_dict = response.json()["detail"][0]
        msg_dict.pop("input")
        msg_dict.pop("url")
        expected = {
            "type": "missing",
            "loc": ["body", "api_key"],
            "msg": "Field required",
        }
        assert msg_dict == expected

    def test_validate_incorrect_model(self) -> None:
        response = client.post(
            f"/models/llms/{OpenAI.__name__}/validate",
            json={
                "api_key": "sk-1234567890abcdef1234567890abcdef",  # pragma: allowlist secret
                "model": "gpt-3.14-turbo_gti_diesel",
                "base_url": "https://api.openai.com/v1",
                "api_type": "openai",
            },
        )
        assert response.status_code == 422
        msg_dict = response.json()["detail"][0]
        msg_dict.pop("input")
        msg_dict.pop("url")
        expected = {
            "type": "literal_error",
            "loc": ["body", "model"],
            "msg": "Input should be 'gpt-4' or 'gpt-3.5-turbo'",
            "ctx": {"expected": "'gpt-4' or 'gpt-3.5-turbo'"},
        }
        # print(f"{msg_dict=}")
        assert msg_dict == expected

    def test_validate_incorrect_base_url(self) -> None:
        response = client.post(
            f"/models/llms/{OpenAI.__name__}/validate",
            json={
                "api_key": "sk-1234567890abcdef1234567890abcdef",  # pragma: allowlist secret
                "model": "gpt-3.5-turbo",
                "base_url": "mailto://api.openai.com/v1",
                "api_type": "openai",
            },
        )
        assert response.status_code == 422
        msg_dict = response.json()["detail"][0]
        msg_dict.pop("input")
        msg_dict.pop("url")
        expected = {
            "ctx": {"expected_schemes": "'http' or 'https'"},
            "loc": ["body", "base_url"],
            "msg": "URL scheme should be 'http' or 'https'",
            "type": "url_scheme",
        }
        assert msg_dict == expected


class TestValidateAzureOAI:
    def test_get_azure_schema(self) -> None:
        response = client.get("/models/llms/schemas")
        assert response.status_code == 200

        expected = {
            "properties": {
                "model": {
                    "default": "gpt-3.5-turbo",
                    "description": "The model to use for the Azure OpenAI API, e.g. 'gpt-3.5-turbo'",
                    "title": "Model",
                    "type": "string",
                },
                "api_key": {
                    "description": "The API key for the Azure OpenAI API, e.g. 'sk-1234567890abcdef1234567890abcdef'",
                    "title": "API Key",
                    "type": "string",
                },
                "base_url": {
                    "default": "https://api.openai.com/v1",
                    "description": "The base URL of the Azure OpenAI API",
                    "format": "uri",
                    "maxLength": 2083,
                    "minLength": 1,
                    "title": "Base Url",
                    "type": "string",
                },
                "api_type": {
                    "const": "azure",
                    "default": "azure",
                    "description": "The type of the API, must be 'azure'",
                    "enum": ["azure"],
                    "title": "API type",
                    "type": "string",
                },
                "api_version": {
                    "default": "latest",
                    "description": "The version of the Azure OpenAI API, e.g. '2024-02-15-preview' or 'latest",
                    "enum": ["2024-02-15-preview", "latest"],
                    "title": "Api Version",
                    "type": "string",
                },
            },
            "required": ["api_key"],
            "title": "AzureOAI",
            "type": "object",
        }
        llm_schema = [  # noqa: RUF015
            LLMSchema(**json)
            for json in response.json()["schemas"]
            if json["name"] == "AzureOAI"
        ][0]
        # print(f"{llm_schema=}")
        assert llm_schema.json_schema == expected

    def test_validate_success(self) -> None:
        response = client.post(
            f"/models/llms/{AzureOAI.__name__}/validate",
            json={
                "api_key": "sk-1234567890abcdef1234567890abcdef",  # pragma: allowlist secret
                "model": "gpt-3.5-turbo",
                "base_url": "https://api.openai.com/v1",
                "api_type": "azure",
            },
        )
        assert response.status_code == 200