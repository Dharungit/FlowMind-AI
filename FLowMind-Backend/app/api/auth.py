import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings
from app.database import get_db
from app.schemas.auth import AuthResponse, GoogleAuthRequest, LogoutRequest, RefreshRequest, RefreshResponse, UserProfile
from app.services.session import SessionService
from app.services.token import TokenService
from app.services.user import UserService

logger = logging.getLogger("flowmind")

router = APIRouter(prefix="/v1/auth")


def get_settings(request: Request) -> Settings:
    return request.app.state.settings


def get_token_service(request: Request) -> TokenService:
    return request.app.state.token_service


async def get_user_service(db: AsyncSession = Depends(get_db)) -> UserService:
    return UserService(db)


async def get_session_service(db: AsyncSession = Depends(get_db)) -> SessionService:
    return SessionService(db)


def _auth_error(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail={
            "message": detail,
            "type": "authentication_error",
            "code": 401,
        },
    )


@router.post("/google", response_model=AuthResponse)
async def google_auth(
    body: GoogleAuthRequest,
    settings: Settings = Depends(get_settings),
    token_service: TokenService = Depends(get_token_service),
    user_service: UserService = Depends(get_user_service),
    session_service: SessionService = Depends(get_session_service),
):
    token_prefix = body.id_token[:20] + "..." if body.id_token and len(body.id_token) > 20 else "none"
    logger.info("google auth request received", extra={"id_token_prefix": token_prefix})

    if not settings.google_client_id:
        logger.error("GOOGLE_CLIENT_ID is not configured")
        raise _auth_error("Google OAuth is not configured")

    logger.info("google client id present, proceeding with token verification")

    try:
        req = google_requests.Request()
        info = id_token.verify_oauth2_token(body.id_token, req, settings.google_client_id)
        logger.info("google token verified successfully", extra={"audience": info.get("aud"), "issuer": info.get("iss")})
    except ValueError as e:
        logger.warning("google token verification failed", extra={"error": str(e)})
        raise _auth_error(str(e))

    google_sub = info.get("sub")
    email = info.get("email", "")
    name = info.get("name", email.split("@")[0] if email else "User")
    picture = info.get("picture")

    logger.info("google token payload extracted", extra={"sub": google_sub, "email": email, "has_picture": picture is not None})

    user = await user_service.find_or_create_by_google_profile(
        google_sub=google_sub,
        email=email,
        display_name=name,
        avatar_url=picture,
    )

    logger.info("user resolved", extra={"user_id": str(user.id), "is_new": user.created_at == user.updated_at})

    access_token = token_service.generate_access_token(str(user.id), user.email)
    refresh_token = token_service.generate_refresh_token()
    refresh_token_hash = token_service.hash_refresh_token(refresh_token)
    expires_at = token_service.get_refresh_token_expiry()

    await session_service.create(str(user.id), refresh_token_hash, expires_at)

    logger.info("session created, returning auth response", extra={"user_id": str(user.id)})

    return AuthResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserProfile(
            id=str(user.id),
            email=user.email,
            display_name=user.display_name,
            avatar_url=user.avatar_url,
        ),
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh(
    body: RefreshRequest,
    token_service: TokenService = Depends(get_token_service),
    session_service: SessionService = Depends(get_session_service),
):
    token_hash = token_service.hash_refresh_token(body.refresh_token)
    session = await session_service.find_by_refresh_token_hash(token_hash)

    if not session:
        raise _auth_error("Invalid or expired refresh token")

    await session_service.invalidate(str(session.id))

    new_access_token = token_service.generate_access_token(str(session.user.id), session.user.email)
    new_refresh_token = token_service.generate_refresh_token()
    new_token_hash = token_service.hash_refresh_token(new_refresh_token)
    new_expires_at = token_service.get_refresh_token_expiry()

    await session_service.create(str(session.user.id), new_token_hash, new_expires_at)

    return RefreshResponse(
        access_token=new_access_token,
        refresh_token=new_refresh_token,
    )


@router.post("/logout")
async def logout(
    body: LogoutRequest,
    request: Request,
    token_service: TokenService = Depends(get_token_service),
    session_service: SessionService = Depends(get_session_service),
):
    if body.all:
        user_id = request.state.user_id
        await session_service.invalidate_all_for_user(user_id)
    elif body.refresh_token:
        token_hash = token_service.hash_refresh_token(body.refresh_token)
        session = await session_service.find_by_refresh_token_hash(token_hash)
        if session:
            await session_service.invalidate(str(session.id))
    else:
        raise _auth_error("Provide refresh_token or set all=true")

    return {"status": "ok"}


@router.get("/me", response_model=UserProfile)
async def me(
    request: Request,
    user_service: UserService = Depends(get_user_service),
):
    user_id = request.state.user_id
    user = await user_service.get_by_id(user_id)

    if not user:
        raise _auth_error("User not found")

    return UserProfile(
        id=str(user.id),
        email=user.email,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
    )
