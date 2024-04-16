from fastapi.testclient import TestClient

from fastagency.app import app
from fastagency.models.llms import AzureOAI, OpenAI

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
                "uuid": {
                    "description": "The unique identifier for the model instance",
                    "format": "uuid",
                    "title": "UUID",
                    "type": "string",
                },
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
            "required": ["uuid", "api_key"],
            "title": "OpenAI",
            "type": "object",
        }
        assert response.json() == expected


class TestValidateOpenAI:
    def test_validate_success(self) -> None:
        response = client.post(
            f"/models/llms/{OpenAI.__name__}/validate",
            json={
                "uuid": "12345678-1234-5678-1234-567812345678",
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
                "uuid": "12345678-1234-5678-1234-567812345678",
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
                "uuid": "12345678-1234-5678-1234-567812345678",
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
        assert msg_dict == expected

    def test_validate_incorrect_base_url(self) -> None:
        response = client.post(
            f"/models/llms/{OpenAI.__name__}/validate",
            json={
                "uuid": "12345678-1234-5678-1234-567812345678",
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

    def test_validate_incorrect_uuid(self) -> None:
        response = client.post(
            f"/models/llms/{OpenAI.__name__}/validate",
            json={
                "uuid": "12345678-123",
                "api_key": "sk-1234567890abcdef1234567890abcdef",  # pragma: allowlist secret
                "model": "gpt-3.5-turbo",
                "base_url": "https://api.openai.com/v1",
                "api_type": "openai",
            },
        )
        assert response.status_code == 422
        msg_dict = response.json()["detail"][0]
        msg_dict.pop("input")
        msg_dict.pop("url")
        excepted = {
            "type": "uuid_parsing",
            "loc": ["body", "uuid"],
            "msg": "Input should be a valid UUID, invalid group count: expected 5, found 2",
            "ctx": {"error": "invalid group count: expected 5, found 2"},
        }
        assert msg_dict == excepted


class TestValidateAzureOAI:
    def test_validate_success(self) -> None:
        response = client.post(
            f"/models/llms/{AzureOAI.__name__}/validate",
            json={
                "uuid": "12345678-1234-5678-1234-567812345678",
                "api_key": "sk-1234567890abcdef1234567890abcdef",  # pragma: allowlist secret
                "model": "gpt-3.5-turbo",
                "base_url": "https://api.openai.com/v1",
                "api_type": "azure",
            },
        )
        assert response.status_code == 200


class TestAgents:
    def test_get_agent_schema(self) -> None:
        response = client.get("/models/agents")
        assert response.status_code == 200
        expected = {
            "properties": {
                "uuid": {
                    "description": "The unique identifier for agent instance",
                    "format": "uuid",
                    "title": "UUID",
                    "type": "string",
                },
                "model_uuid": {
                    "description": "The unique identifier for the model instance",
                    "format": "uuid",
                    "title": "UUID",
                    "type": "string",
                },
                "name": {
                    "description": "The name of the agent",
                    "title": "Name",
                    "type": "string",
                },
                "system_message": {
                    "description": "The system message of the agent. This message is used to inform the agent about his role in the conversation",
                    "title": "System Message",
                    "type": "string",
                },
            },
            "required": ["uuid", "model_uuid", "name", "system_message"],
            "title": "Agent",
            "type": "object",
        }
        assert response.json() == expected

    def test_validate_agent_success(self) -> None:
        response = client.post(
            "/models/agents/validate",
            json={
                "uuid": "12345678-1234-5678-1234-567812345678",
                "model_uuid": "87654321-1234-5678-1234-567812345678",
                "name": "test agent",
                "system_message": "test system message",
            },
        )
        assert response.status_code == 200

    def test_validate_agent_missing_model_uuid(self) -> None:
        response = client.post(
            "/models/agents/validate",
            json={
                "uuid": "12345678-1234-5678-1234-567812345678",
                "name": "test agent",
                "system_message": "test system message",
            },
        )
        assert response.status_code == 422
        msg_dict = response.json()["detail"][0]
        msg_dict.pop("input")
        msg_dict.pop("url")
        excepted = {
            "type": "missing",
            "loc": ["body", "model_uuid"],
            "msg": "Field required",
        }
        assert msg_dict == excepted

    def test_validate_agent_invalid_model_uuid(self) -> None:
        response = client.post(
            "/models/agents/validate",
            json={
                "model_uuid": "87654321-1234-5678",
                "uuid": "12345678-1234-5678-1234-567812345678",
                "name": "test agent",
                "system_message": "test system message",
            },
        )
        assert response.status_code == 422
        msg_dict = response.json()["detail"][0]
        msg_dict.pop("input")
        msg_dict.pop("url")
        excepted = {
            "type": "uuid_parsing",
            "loc": ["body", "model_uuid"],
            "msg": "Input should be a valid UUID, invalid group count: expected 5, found 3",
            "ctx": {"error": "invalid group count: expected 5, found 3"},
        }
        assert msg_dict == excepted
