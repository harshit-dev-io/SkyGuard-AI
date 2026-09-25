from fastapi import APIRouter, Depends, HTTPException, status
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.models import User
from app.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    TokenRefreshRequest,
    TokenResponse,
    UserCreate,
    UserResponse,
)
from app.auth.services import AuthService
from app.config.database import get_db_session
from app.config.settings import settings
from app.core.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db_session)):
    user = await AuthService.register_user(db, user_in)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email or username already exists.",
        )
    return user


@router.post("/login", response_model=TokenResponse)
async def login(credentials: LoginRequest, db: AsyncSession = Depends(get_db_session)):
    user = await AuthService.authenticate_user(db, credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    return TokenResponse(
        access_token=AuthService.create_access_token(subject=user.email, role=user.role.value),
        refresh_token=AuthService.create_refresh_token(subject=user.email),
        role=user.role,
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_in: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db_session),
):
    try:
        payload = jwt.decode(
            refresh_in.refresh_token,
            settings.SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        email: str = payload.get("sub")
        token_type: str = payload.get("type")
        if not email or token_type != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type.",
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired.",
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token.",
        )

    stmt = select(User).where(User.email == email, User.is_active == True)
    user = (await db.execute(stmt)).scalar_one_or_none()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive.",
        )

    return TokenResponse(
        access_token=AuthService.create_access_token(subject=user.email, role=user.role.value),
        refresh_token=AuthService.create_refresh_token(subject=user.email),
        role=user.role,
    )


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(user: User = Depends(get_current_user)):
    return user


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    payload: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session),
):
    if not AuthService.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password verification failed.",
        )

    current_user.hashed_password = AuthService.get_password_hash(payload.new_password)
    await db.commit()
    return {"status": "password_updated", "detail": "Password successfully updated."}