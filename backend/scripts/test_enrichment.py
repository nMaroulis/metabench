import json

from services.enrichment import enrich_model_metadata


def test_enrichment():
    model_name = "GPT-4o"
    provider = "OpenAI"
    print(f"Testing enrichment for {model_name}...")
    result = enrich_model_metadata(model_name, provider)
    if result:
        print("Enrichment successful!")
        print(json.dumps(result.model_dump(), indent=2))
    else:
        print("Enrichment failed.")


if __name__ == "__main__":
    test_enrichment()
