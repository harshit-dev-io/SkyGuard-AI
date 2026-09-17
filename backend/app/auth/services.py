import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.auth.models import User, UserRole
from app.auth.schemas import UserCreate
from app.config.settings import settings


class AuthService:
    @staticmethod
    def get_password_hash(password: str) -> str:
        salt = os.urandom(settings.PBKDF2_SALT_SIZE)
        key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            settings.PBKDF2_ITERATIONS,
        )
        return f"{settings.PBKDF2_ITERATIONS}${salt.hex()}${key.hex()}"

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        try:
            iterations_str, salt_hex, key_hex = hashed_password.split("$")
            iterations = int(iterations_str)
            salt = bytes.fromhex(salt_hex)
            expected_key = bytes.fromhex(key_hex)
        except (ValueError, AttributeError):
            return False

        computed_key = hashlib.pbkdf2_hmac(
            "sha256",
            plain_password.encode("utf-8"),
            salt,
            iterations,
        )
        return hmac.compare_digest(computed_key, expected_key)

    @staticmethod
    def create_access_token(subject: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
        now = datetime.now(timezone.utc)
        expire = now + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
        payload: dict[str, Any] = {
            "sub": subject,
            "role": role,
            "type": "access",
            "exp": expire,
            "iat": now,
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    @staticmethod
    def create_refresh_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
        now = datetime.now(timezone.utc)
        expire = now + (expires_delta or timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS))
        payload: dict[str, Any] = {
            "sub": subject,
            "type": "refresh",
            "exp": expire,
            "iat": now,
        }
        return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    @classmethod
    async def register_user(cls, db: AsyncSession, user_in: UserCreate) -> Optional[User]:
        stmt = select(User).where((User.email == user_in.email) | (User.username == user_in.username))
        existing_user = (await db.execute(stmt)).scalar_one_or_none()
        if existing_user:
            return None

        user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=cls.get_password_hash(user_in.password),
            role=user_in.role,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @classmethod
    async def authenticate_user(cls, db: AsyncSession, email: str, password: str) -> Optional[User]:
        stmt = select(User).where(User.email == email, User.is_active == True)
        user = (await db.execute(stmt)).scalar_one_or_none()
        if not user or not cls.verify_password(password, user.hashed_password):
            return None
        return user