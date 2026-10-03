"""Server-verified account identity; never trust a submitted email or decoded JWT.

The caller supplies a Supabase client and scopes data operations to ``user_id``.
This function does not change that client's session or database authorization.
"""

from dataclasses import dataclass
import re
from typing import Optional
from uuid import UUID

from fastapi import HTTPException


@dataclass(frozen=True)
class AuthenticatedUser:
    user_id: str
    email: str


def _unauthorized() -> HTTPException:
    return HTTPException(
        status_code=401,
        detail="Sign in with a verified account to continue.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def authenticate_user(authorization: Optional[str], supabase_client) -> AuthenticatedUser:
    """Validate a bearer access token with Supabase Auth's get_user endpoint.

    Missing/invalid credentials fail with 401. An unavailable verifier fails
    with 503; neither case falls back to typed email, local JWT claims or demo.
    A confirmed email is required for the transitional email-keyed tables.
    """
    if not isinstance(authorization, str) or len(authorization) > 8192:
        raise _unauthorized()
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer" or not parts[1]:
        raise _unauthorized()
    if supabase_client is None:
        raise HTTPException(status_code=503, detail="Account verification is unavailable. Please try again later.")
    try:
        # Explicit token verification, never get_session() or set_session().
        response = supabase_client.auth.get_user(parts[1])
    except Exception as exc:
        # Auth API rejection differs from a network/provider failure. Never
        # include provider exception text: it may contain credentials or PII.
        if str(getattr(exc, "status", getattr(exc, "status_code", ""))) in {"400", "401", "403", "422"}:
            raise _unauthorized() from None
        raise HTTPException(status_code=503, detail="Account verification is unavailable. Please try again later.") from None

    user = getattr(response, "user", None)
    if user is None or getattr(user, "is_anonymous", False):
        raise _unauthorized()
    try:
        user_id = str(UUID(str(user.id)))
    except (AttributeError, ValueError, TypeError):
        raise _unauthorized() from None
    email = getattr(user, "email", None)
    if not isinstance(email, str):
        raise _unauthorized()
    email = email.strip().lower()
    if len(email) > 254 or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise _unauthorized()
    if not getattr(user, "email_confirmed_at", None) or getattr(user, "deleted_at", None):
        raise _unauthorized()
    return AuthenticatedUser(user_id=user_id, email=email)
