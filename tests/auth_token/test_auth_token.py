import uuid
from typing import Any, Dict

import pytest
from fastapi import HTTPException

import fastagency.auth_token.auth
from fastagency.auth_token.auth import (
    create_deployment_auth_token,
    generate_auth_token,
    hash_auth_token,
    verify_auth_token,
)


def test_generate_auth_token() -> None:
    token = generate_auth_token()
    assert isinstance(token, str)
    assert len(token) == 32


def test_hash_auth_token() -> None:
    token = generate_auth_token()
    hashed_token = hash_auth_token(token)
    assert isinstance(hashed_token, str)
    assert len(hashed_token) == 97
    assert ":" in hashed_token


def test_verify_auth_token() -> None:
    token = generate_auth_token()
    hashed_token = hash_auth_token(token)
    assert verify_auth_token(token, hashed_token)
    assert not verify_auth_token(token, "wrong_hash")
    assert not verify_auth_token("wrong_token", hashed_token)
    assert not verify_auth_token("wrong_token", "wrong_hash")


@pytest.mark.db()
@pytest.mark.asyncio()
async def test_create_deployment_token(
    user_uuid: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    deployment_uuid = str(uuid.uuid4())

    async def mock_find_model_using_raw(*args: Any, **kwargs: Any) -> Dict[str, str]:
        return {
            "user_uuid": user_uuid,
            "uuid": deployment_uuid,
        }

    monkeypatch.setattr(
        fastagency.auth_token.auth, "find_model_using_raw", mock_find_model_using_raw
    )

    token = await create_deployment_auth_token(user_uuid, deployment_uuid)
    assert isinstance(token.auth_token, str)
    assert len(token.auth_token) == 32, token.auth_token


@pytest.mark.db()
@pytest.mark.asyncio()
async def test_create_deployment_token_with_wrong_user_uuid(
    user_uuid: str, monkeypatch: pytest.MonkeyPatch
) -> None:
    deployment_uuid = str(uuid.uuid4())

    async def mock_find_model_using_raw(*args: Any, **kwargs: Any) -> Dict[str, str]:
        return {
            "user_uuid": "random_wrong_uuid",
            "uuid": deployment_uuid,
        }

    monkeypatch.setattr(
        fastagency.auth_token.auth, "find_model_using_raw", mock_find_model_using_raw
    )

    with pytest.raises(HTTPException) as e:
        await create_deployment_auth_token(user_uuid, deployment_uuid)

    assert e.value.status_code == 403
    assert e.value.detail == "User does not have access to this deployment"
