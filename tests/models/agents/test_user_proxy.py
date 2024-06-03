import os
import uuid
from typing import Any, Dict

import autogen
import pytest

from fastagency.app import add_model
from fastagency.models.agents.user_proxy import UserProxyAgent
from fastagency.models.base import Model
from fastagency.models.llms.azure import AzureOAI, AzureOAIAPIKey


class TestUserProxyAgent:
    @pytest.mark.asyncio()
    @pytest.mark.db()
    @pytest.mark.parametrize("llm_model,api_key_model", [(AzureOAI, AzureOAIAPIKey)])  # noqa: PT006
    async def test_user_proxy_model_create_autogen(
        self,
        llm_model: Model,
        api_key_model: Model,
        llm_config: Dict[str, Any],
        user_uuid: str,
        monkeypatch: pytest.MonkeyPatch,
    ) -> None:
        # Add secret, llm, agent to database
        api_key = api_key_model(  # type: ignore [operator]
            api_key=os.getenv("AZURE_OPENAI_API_KEY"),
            name="api_key_model_name",
        )
        api_key_model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="secret",
            model_name=api_key_model.__name__,  # type: ignore [attr-defined]
            model_uuid=api_key_model_uuid,
            model=api_key.model_dump(),
        )

        llm = llm_model(  # type: ignore [operator]
            name="llm_model_name",
            model=os.getenv("AZURE_GPT35_MODEL"),
            api_key=api_key.get_reference_model()(uuid=api_key_model_uuid),
            base_url=os.getenv("AZURE_API_ENDPOINT"),
            api_version=os.getenv("AZURE_API_VERSION"),
        )
        llm_model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="llm",
            model_name=llm_model.__name__,  # type: ignore [attr-defined]
            model_uuid=llm_model_uuid,
            model=llm.model_dump(),
        )

        user_proxy_model = UserProxyAgent(
            llm=llm.get_reference_model()(uuid=llm_model_uuid),
            name="Assistant",
            system_message="test system message",
        )
        user_proxy_model_uuid = str(uuid.uuid4())
        await add_model(
            user_uuid=user_uuid,
            type_name="agent",
            model_name=UserProxyAgent.__name__,
            model_uuid=user_proxy_model_uuid,
            model=user_proxy_model.model_dump(),
        )

        async def my_create_autogen(cls, model_id, user_id) -> Dict[str, Any]:  # type: ignore [no-untyped-def]
            return llm_config

        # Monkeypatch llm and call create_autogen
        monkeypatch.setattr(AzureOAI, "create_autogen", my_create_autogen)
        agent = await UserProxyAgent.create_autogen(
            model_id=uuid.UUID(user_proxy_model_uuid),
            user_id=uuid.UUID(user_uuid),
        )
        assert isinstance(agent, autogen.agentchat.UserProxyAgent)
