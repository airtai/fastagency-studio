import uuid
from typing import List, Optional
from unittest.mock import AsyncMock

import pytest
from fastapi.testclient import TestClient

from fastagency.app import app
from fastagency.models.llms.azure import AzureOAIAPIKey

client = TestClient(app)


class Function:
    def __init__(self, arguments: str, name: str):
        """Function class."""
        self.arguments = arguments
        self.name = name


class ChatCompletionMessageToolCall:
    def __init__(self, id: str, function: Function, type: str):
        """ChatCompletionMessageToolCall class."""
        self.id = id
        self.function = function
        self.type = type


class ChatCompletionMessage:
    def __init__(
        self,
        content: Optional[str],
        role: str,
        function_call: Optional[str],
        tool_calls: List[ChatCompletionMessageToolCall],
    ):
        """ChatCompletionMessage class."""
        self.content = content
        self.role = role
        self.function_call = function_call
        self.tool_calls = tool_calls


class Choice:
    def __init__(self, message: ChatCompletionMessage):
        """Choice class."""
        self.message = message


class MockChatCompletion:
    def __init__(self, id: str, choices: List[Choice]):
        """MockChatCompletion class."""
        self.id = id
        self.choices = choices


@pytest.mark.db()
class TestModelRoutes:
    @pytest.mark.asyncio()
    async def test_get_all_models(
        self, user_uuid: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        key_uuid = str(uuid.uuid4())
        azure_oai_api_key = AzureOAIAPIKey(api_key="whatever", name="whatever")
        type_name = "secret"
        model_name = "AzureOAIAPIKey"

        # Create model
        response = client.post(
            f"/user/{user_uuid}/models/{type_name}/{model_name}/{key_uuid}",
            json=azure_oai_api_key.model_dump(),
        )
        assert response.status_code == 200

        response = client.get(f"/user/{user_uuid}/models")
        assert response.status_code == 200

        expected = [
            {
                "json_str": {
                    "api_key": "whatever",  # pragma: allowlist secret
                    "name": "whatever",
                },
                "uuid": key_uuid,
                "type_name": "secret",
                "model_name": "AzureOAIAPIKey",
                "user_uuid": user_uuid,
            }
        ]
        actual = response.json()
        assert len(actual) == len(expected)
        for i in range(len(expected)):
            for key in expected[i]:
                assert actual[i][key] == expected[i][key]

    @pytest.mark.asyncio()
    async def test_add_model(self, user_uuid: str) -> None:
        model_uuid = str(uuid.uuid4())
        azure_oai_api_key = AzureOAIAPIKey(api_key="whatever", name="who cares?")
        response = client.post(
            f"/user/{user_uuid}/models/secret/AzureOAIAPIKey/{model_uuid}",
            json=azure_oai_api_key.model_dump(),
        )

        assert response.status_code == 200
        expected = {
            "api_key": "whatever",  # pragma: allowlist secret
            "name": "who cares?",
        }
        actual = response.json()
        assert actual == expected

    @pytest.mark.asyncio()
    async def test_update_model(
        self, user_uuid: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        key_uuid = str(uuid.uuid4())
        azure_oai_api_key = AzureOAIAPIKey(api_key="who cares", name="whatever")
        type_name = "secret"
        model_name = "AzureOAIAPIKey"

        # Create model
        response = client.post(
            f"/user/{user_uuid}/models/{type_name}/{model_name}/{key_uuid}",
            json=azure_oai_api_key.model_dump(),
        )
        assert response.status_code == 200

        response = client.put(
            f"/user/{user_uuid}/models/secret/AzureOAIAPIKey/{key_uuid}",
            json=azure_oai_api_key.model_dump(),
        )

        assert response.status_code == 200
        expected = {
            "api_key": "who cares",  # pragma: allowlist secret
            "name": "whatever",
        }
        actual = response.json()
        assert actual == expected

    @pytest.mark.asyncio()
    async def test_delete_model(
        self, user_uuid: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        key_uuid = str(uuid.uuid4())
        azure_oai_api_key = AzureOAIAPIKey(api_key="whatever", name="whatever")
        type_name = "secret"
        model_name = "AzureOAIAPIKey"

        # Create model
        response = client.post(
            f"/user/{user_uuid}/models/{type_name}/{model_name}/{key_uuid}",
            json=azure_oai_api_key.model_dump(),
        )
        assert response.status_code == 200

        response = client.delete(f"/user/{user_uuid}/models/secret/{key_uuid}")

        assert response.status_code == 200
        expected = {
            "api_key": "whatever",  # pragma: allowlist secret
            "name": "whatever",
        }
        actual = response.json()
        assert actual == expected

    @pytest.mark.asyncio()
    async def test_chat_with_no_function_calling(
        self, user_uuid: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        model_uuid = str(uuid.uuid4())
        model_name = "MultiAgentTeam"
        # Mocking the aclient.chat.completions.create function
        mock_create = AsyncMock()
        monkeypatch.setattr(
            "fastagency.app.aclient.chat.completions.create", mock_create
        )

        # Define the mock return value
        mock_create.return_value = AsyncMock(
            choices=[AsyncMock(message=AsyncMock(tool_calls=None))]
        )

        # Define the request body
        request_body = {
            "message": [{"role": "user", "content": "Hello"}],
            "chat_id": 123,
            "user_id": 456,
        }

        # Define the expected response
        expected_response = {
            "team_status": "inprogress",
            "team_name": "456_123",
            "team_id": 123,
            "customer_brief": "Some customer brief",
            "conversation_name": "Hello",
        }

        response = client.post(
            f"/user/{user_uuid}/chat/{model_name}/{model_uuid}", json=request_body
        )

        # Assert the status code and the response body
        assert response.status_code == 200
        assert response.json() == expected_response

        # Assert the mock was called with the correct arguments
        mock_create.assert_called_once()

    @pytest.mark.asyncio()
    async def test_chat_error(
        self, user_uuid: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        model_uuid = str(uuid.uuid4())
        model_name = "MultiAgentTeam"

        mock_create = AsyncMock()
        monkeypatch.setattr(
            "fastagency.app.aclient.chat.completions.create", mock_create
        )
        mock_create.side_effect = Exception("Error creating chat completion")

        # Define the request body
        request_body = {
            "message": [{"role": "user", "content": "Hello"}],
            "chat_id": 123,
            "user_id": 456,
        }

        # Define the expected response
        expected_response = {
            "team_status": "inprogress",
            "team_name": "456_123",
            "team_id": 123,
            "customer_brief": "Some customer brief",
            "conversation_name": "Hello",
        }

        response = client.post(
            f"/user/{user_uuid}/chat/{model_name}/{model_uuid}", json=request_body
        )

        # Assert the status code and the response body
        assert response.status_code == 200
        assert response.json() == expected_response

        # Assert the mock was called with the correct arguments
        mock_create.assert_called_once()

    @pytest.mark.asyncio()
    async def test_chat_with_function_calling(
        self, user_uuid: str, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        model_uuid = str(uuid.uuid4())
        model_name = "MultiAgentTeam"

        mock_create = AsyncMock()
        monkeypatch.setattr(
            "fastagency.app.aclient.chat.completions.create", mock_create
        )

        function = Function(
            arguments='{\n  "chat_name": "Calculate 2 * 2"\n}',
            name="generate_chat_name",
        )
        tool_call = ChatCompletionMessageToolCall(
            id="1", function=function, type="function"
        )
        message = ChatCompletionMessage(
            content=None, role="assistant", function_call=None, tool_calls=[tool_call]
        )
        choice = Choice(message=message)
        chat_completion = MockChatCompletion(id="1", choices=[choice])

        mock_create.return_value = chat_completion

        # Define the request body
        request_body = {
            "message": [{"role": "user", "content": "Hello"}],
            "chat_id": 123,
            "user_id": 456,
        }

        # Define the expected response
        expected_response = {
            "team_status": "inprogress",
            "team_name": "456_123",
            "team_id": 123,
            "customer_brief": "Some customer brief",
            "conversation_name": "Calculate 2 * 2",
        }

        response = client.post(
            f"/user/{user_uuid}/chat/{model_name}/{model_uuid}", json=request_body
        )

        # Assert the status code and the response body
        assert response.status_code == 200
        assert response.json() == expected_response

        # Assert the mock was called with the correct arguments
        mock_create.assert_called_once()