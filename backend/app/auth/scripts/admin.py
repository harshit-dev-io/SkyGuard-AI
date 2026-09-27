from app.auth.schemas import UserCreate
from app.config.settings import settings
from app.auth.models import User
from app.config.database import async_session_factory
import asyncio
import os
import hashlib

def get_password_hash(password: str) -> str:
        salt = os.urandom(settings.PBKDF2_SALT_SIZE)
        key = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt,
            settings.PBKDF2_ITERATIONS,
        )
        return f"{settings.PBKDF2_ITERATIONS}${salt.hex()}${key.hex()}"

async def create_admin():
    user_in = UserCreate(
    email="luciddeveloper15@gmail.com",
    username="ADMIN_1",
    password="adminpass123",
    role="admin"
)
    async with async_session_factory() as db:
        user = User(
            email=user_in.email,
            username=user_in.username,
            hashed_password=get_password_hash(user_in.password),
            role=user_in.role,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        print("admin created successfully")
        return user

user_in = UserCreate(
    email="luciddeveloper15@gmail.com",
    username="ADMIN_1",
    password="adminpass123",
    role="admin"
)

asyncio.run(create_admin())
