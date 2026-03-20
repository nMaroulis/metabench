import hmac
import os

from dotenv import load_dotenv
from fastapi import HTTPException, Security, status
from fastapi.security import APIKeyHeader
from utils.logger import get_logger

logger = get_logger("auth")

load_dotenv()

ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY")

api_key_header = APIKeyHeader(name="Authorization", auto_error=False)


def verify_admin_key(api_key: str | None = Security(api_key_header)) -> bool:
    """Verify the admin API key provided in the Authorization header."""
    if not ADMIN_SECRET_KEY or len(ADMIN_SECRET_KEY) < 8:
        logger.error("ADMIN_SECRET_KEY is not securely configured in environment.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Server authentication is not properly configured.",
        )

    if not api_key:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Missing Authorization header")

    # Allow optional 'Bearer ' prefix
    token = api_key.replace("Bearer ", "") if api_key.startswith("Bearer ") else api_key

    # Use constant-time comparison to prevent timing attacks
    if not hmac.compare_digest(token, ADMIN_SECRET_KEY):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid admin credentials")
    return True
