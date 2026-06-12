from pydantic import BaseModel


class GoogleAuthRequest(BaseModel):
    id_token: str


class RefreshRequest(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str | None = None
    all: bool = False


class UserProfile(BaseModel):
    id: str
    email: str
    display_name: str
    avatar_url: str | None = None


class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user: UserProfile


class RefreshResponse(BaseModel):
    access_token: str
    refresh_token: str
