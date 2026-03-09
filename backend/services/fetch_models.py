from clients.artificial_analysis import ArtificialAnalysisAPIClient


client = ArtificialAnalysisAPIClient()


def get_models(limit: int = -1):
    """
    Fetches all models from Artificial Analysis.
    """
    models = client.get_models()
    if limit > 0:
        models = models[:limit]
    return models


if __name__ == "__main__":
    models = get_models()
    print(models)
    print(models[0]["name"])
