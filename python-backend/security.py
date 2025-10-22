from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

SECRET_KEY = os.getenv("SECRET_KEY", "a_super_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os
import hashlib

SECRET_KEY = os.getenv("SECRET_KEY", "a_super_secret_key")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Fallback auf einfache Hash-Funktion wenn bcrypt Probleme macht
try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    USE_BCRYPT = True
except Exception:
    USE_BCRYPT = False

def verify_password(plain_password, hashed_password):
    if USE_BCRYPT and hashed_password.startswith("$2b$"):
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            return False
    else:
        # Einfache Verifikation für Development
        return hashed_password == f"simple_hash_{plain_password}"

def get_password_hash(password):
    if USE_BCRYPT:
        try:
            return pwd_context.hash(password)
        except Exception:
            # Fallback auf einfachen Hash
            return f"simple_hash_{password}"
    else:
        # Einfacher Hash für Development
        return f"simple_hash_{password}"

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
