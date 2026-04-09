"""Auth request/response schemas."""

from pydantic import BaseModel


class LoginRequest(BaseModel):
    email: str
    password: str
    totp_code: str | None = None  # Required when user has 2FA enabled


class LogoutRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TotpSetupResponse(BaseModel):
    secret: str
    provisioning_uri: str
