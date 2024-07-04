from fastagency.helpers import generate_auth_token, hash_auth_token, verify_auth_token


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
