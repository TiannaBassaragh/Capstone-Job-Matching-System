from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from dotenv import load_dotenv
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
  raise RuntimeError("SECRET_KEY is not set")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
  return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
  return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
  payload = data.copy()
  payload["exp"] = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
  return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
  try:
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
  except JWTError:
    raise ValueError("Invalid or expired token")