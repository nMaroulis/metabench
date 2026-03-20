import os

from dotenv import load_dotenv
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader

load_dotenv()

ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY")

api_key_header = APIKeyHeader(name="Authorization", auto_error=False)


def verify_admin_key(api_key: str | None = Security(api_key_header)) -> bool:
    """Verify the admin API key provided in the Authorization header."""
    if not api_key:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing Authorization header")

    # Allow optional 'Bearer ' prefix
    token = api_key.replace("Bearer ", "") if api_key.startswith("Bearer ") else api_key

    print(f"DEBUG AUTH: token='{token}', expected='{ADMIN_SECRET_KEY}'")

    if token != ADMIN_SECRET_KEY:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin credentials")
    return True
