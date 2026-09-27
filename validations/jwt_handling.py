from fastapi import HTTPException, Request, status
from datetime import datetime, timedelta
from typing import Optional
from config import setting
from jose import JWTError, ExpiredSignatureError, jwt

def create_access_token(subject: str, expires_delta: Optional[int] = None) -> str:
    if expires_delta is not None:
          expiration = datetime.now() + timedelta(minutes=expires_delta)
    else:
        expiration = datetime.now() + timedelta(minutes=setting.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expiration, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, setting.secret_key, setting.algorithm)
    return encoded_jwt

def decode_jwt(jwtoken: str)->str | None:
    try:
        payload = jwt.decode(jwtoken, setting.secret_key, setting.algorithm)
        return payload["sub"]
    except ExpiredSignatureError:
        return None
    except JWTError:
        return None


def get_current_user_id(request: Request) -> str:
    token = request.headers.get("Bearer-auth")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Bearer-auth header is required",
        )

    user_id = decode_jwt(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
    return user_id


