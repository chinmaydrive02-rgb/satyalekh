from types import SimpleNamespace
from unittest.mock import Mock

import pytest
from fastapi import HTTPException

from authentication import authenticate_user


USER_ID = "d2f5b917-9289-4f60-909b-1b829f43e47a"


def client_with_user(**overrides):
    values = dict(id=USER_ID, email=" Lawyer@Example.com ", email_confirmed_at="2026-10-03T00:00:00Z", is_anonymous=False)
    values.update(overrides)
    client = Mock()
    client.auth.get_user.return_value = SimpleNamespace(user=SimpleNamespace(**values))
    return client


def test_identity_is_verified_using_explicit_token_without_mutating_session():
    client = client_with_user(user_metadata={"email": "victim@example.com", "id": "other"})
    identity = authenticate_user("bEaReR signed-token", client)
    assert identity.user_id == USER_ID
    assert identity.email == "lawyer@example.com"
    client.auth.get_user.assert_called_once_with("signed-token")
    client.auth.set_session.assert_not_called()
    client.auth.get_session.assert_not_called()


@pytest.mark.parametrize("header", [None, "", "Bearer", "Basic token", "Bearer a b", "Bearer " + "x" * 8192])
def test_missing_or_malformed_token_never_contacts_provider(header):
    client = client_with_user()
    with pytest.raises(HTTPException) as caught:
        authenticate_user(header, client)
    assert caught.value.status_code == 401
    assert caught.value.headers["WWW-Authenticate"] == "Bearer"
    client.auth.get_user.assert_not_called()


@pytest.mark.parametrize("overrides", [dict(id="invalid"), dict(email=None), dict(email="invalid"), dict(email_confirmed_at=None), dict(is_anonymous=True), dict(deleted_at="2026-10-03")])
def test_unusable_identity_fails_closed(overrides):
    with pytest.raises(HTTPException) as caught:
        authenticate_user("Bearer token", client_with_user(**overrides))
    assert caught.value.status_code == 401


def test_missing_user_fails_closed():
    client = client_with_user()
    client.auth.get_user.return_value = SimpleNamespace(user=None)
    with pytest.raises(HTTPException) as caught:
        authenticate_user("Bearer token", client)
    assert caught.value.status_code == 401


@pytest.mark.parametrize("status,expected", [(400, 401), (401, 401), (403, 401), (422, 401), (429, 503), (500, 503)])
def test_provider_failures_are_classified_without_exposing_secrets(status, expected):
    client = client_with_user()
    exc = RuntimeError("token secret and lawyer@example.com")
    exc.status = status
    client.auth.get_user.side_effect = exc
    with pytest.raises(HTTPException) as caught:
        authenticate_user("Bearer token", client)
    assert caught.value.status_code == expected
    assert "secret" not in caught.value.detail
    assert "lawyer@example.com" not in caught.value.detail


def test_network_failure_and_unconfigured_verifier_are_unavailable():
    client = client_with_user()
    client.auth.get_user.side_effect = TimeoutError("sensitive token")
    for verifier in [client, None]:
        with pytest.raises(HTTPException) as caught:
            authenticate_user("Bearer token", verifier)
        assert caught.value.status_code == 503
