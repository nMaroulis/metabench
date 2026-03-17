from datetime import datetime, timedelta

from clients.artificial_analysis import ArtificialAnalysisAPIClient
from utils.logger import get_logger

logger = get_logger("fetch_models")

# Fetch models released within this many days
MAX_MODEL_AGE_DAYS = 600


client = ArtificialAnalysisAPIClient()


def get_models(limit: int = -1):
    """
    Fetches models from Artificial Analysis, filtering out models older than MAX_MODEL_AGE_DAYS.
    """
    models = client.get_models()

    # Compute the cutoff date
    cutoff = datetime.now() - timedelta(days=MAX_MODEL_AGE_DAYS)

    filtered = []
    for m in models:
        release = m.get("release_date")
        if not release:
            continue  # skip models with no release date
        try:
            release_dt = datetime.strptime(release, "%Y-%m-%d")
        except (ValueError, TypeError):
            continue
        if release_dt >= cutoff:
            filtered.append(m)

    if limit > 0:
        filtered = filtered[:limit]
    logger.info(f"Fetched {len(filtered)} models.")
    return filtered


if __name__ == "__main__":
    models = get_models()
    logger.info(f"Fetched {len(models)} models (max age: {MAX_MODEL_AGE_DAYS} days)")
    if models:
        logger.info(models[0]["name"])
