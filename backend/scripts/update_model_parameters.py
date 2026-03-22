#!/usr/bin/env python3
"""
Script to update model parameters and descriptions in snapshot.json file.

This script reads a snapshot.json file and updates the 'parameters' and/or 'description'
fields for each model based on provided dictionaries of model names to values.

Usage:
    python update_model_parameters.py --update-params
    python update_model_parameters.py --update-descs
    python update_model_parameters.py --update-params --update-descs
"""

import argparse
import json
import os


def update_snapshot_fields(
    snapshot_path: str, model_params: dict[str, str] | None = None, model_descs: dict[str, str] | None = None
) -> None:
    """
    Update the parameters and/or description fields for models in snapshot.json.

    Args:
        snapshot_path: Path to the snapshot.json file
        model_params: dictionary mapping model names to parameter strings
        model_descs: dictionary mapping model names to description strings
    """

    # Read the snapshot file
    print(f"Reading snapshot from: {snapshot_path}")
    with open(snapshot_path, encoding="utf-8") as f:
        snapshot = json.load(f)

    # Track updates
    params_updated = 0
    params_skipped = 0
    params_not_found = 0
    descs_updated = 0
    descs_skipped = 0
    descs_not_found = 0

    print(f"Found {len(snapshot['models'])} models in snapshot")
    if model_params:
        print(f"Have {len(model_params)} parameter updates to apply")
    if model_descs:
        print(f"Have {len(model_descs)} description updates to apply")

    # Update each model's fields if found
    for model in snapshot["models"]:
        model_name = model.get("name")

        if not model_name:
            continue

        # Update parameters
        if model_params and model_name in model_params:
            new_params = model_params[model_name]
            old_params = model.get("parameters", "")

            # Only update if the parameters are different
            if old_params != new_params:
                print(f"Updating parameters for '{model_name}': '{old_params}' -> '{new_params}'")
                model["parameters"] = new_params
                params_updated += 1
            else:
                print(f"Skipping parameters for '{model_name}': already match")
                params_skipped += 1
        elif model_params:
            params_not_found += 1

        # Update descriptions
        if model_descs and model_name in model_descs:
            new_desc = model_descs[model_name]
            old_desc = model.get("description", "")

            # Always update descriptions (replace existing values)
            print(f"Updating description for '{model_name}': '{old_desc}' -> '{new_desc}'")
            model["description"] = new_desc
            descs_updated += 1
        elif model_descs:
            descs_not_found += 1

    # Write the updated snapshot back to file
    print(f"\nWriting updated snapshot to: {snapshot_path}")
    with open(snapshot_path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2, ensure_ascii=False)

    # Print summary
    print("\n=== Update Summary ===")
    if model_params:
        print(f"📊 Parameters Updated: {params_updated}")
        print(f"⏭️  Parameters Skipped (already correct): {params_skipped}")
        print(f"❌ Parameters Not found in dictionary: {params_not_found}")
    if model_descs:
        print(f"� Descriptions Updated: {descs_updated}")
        print(f"⏭️  Descriptions Skipped (already correct): {descs_skipped}")
        print(f"❌ Descriptions Not found in dictionary: {descs_not_found}")
    print(f"� Total models in snapshot: {len(snapshot['models'])}")


def main():
    """Main function to run the parameter and description updates."""

    # Parse command line arguments
    parser = argparse.ArgumentParser(
        description="Update model parameters and/or descriptions in snapshot.json",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python update_model_parameters.py --update-params
  python update_model_parameters.py --update-descs
  python update_model_parameters.py --update-params --update-descs
        """,
    )
    parser.add_argument("--update-params", action="store_true", help="Update model parameters")
    parser.add_argument("--update-descs", action="store_true", help="Update model descriptions")

    args = parser.parse_args()

    # Validate arguments
    if not args.update_params and not args.update_descs:
        print("Error: Must specify at least one of --update-params or --update-descs")
        print("Use --help for more information.")
        return

    # Path to snapshot.json
    snapshot_path = "/Users/nick/windsurf_projects/metabench/snapshot.json"

    # Check if snapshot exists
    if not os.path.exists(snapshot_path):
        print(f"Error: Snapshot file not found at {snapshot_path}")
        return

    # YOUR MODEL PARAMETERS DICTIONARY GOES HERE
    # Replace this with your actual dictionary
    model_params = {
        # Example format:
        # "gpt-4": "1.76T parameters",
        # "claude-3-opus": "Unknown",
        # "llama-2-70b": "70B",
        # Add your model name -> parameter string mappings here
        # The key should exactly match the model name in snapshot.json
    }

    # YOUR MODEL DESCRIPTIONS DICTIONARY GOES HERE
    # Replace this with your actual dictionary
    model_descs = {
        # Example format:
        # "gpt-4": "GPT-4 is a large multimodal model by OpenAI",
        # "claude-3-opus": "Claude 3 Opus is Anthropic's most capable model",
        # "llama-2-70b": "Llama 2 70B is Meta's open-source large language model",
        # Add your model name -> description string mappings here
        # The key should exactly match the model name in snapshot.json
    }

    # Validate dictionaries
    if args.update_params and not model_params:
        print("Error: --update-params specified but model_params dictionary is empty!")
        print("Please edit this script and add your model parameter mappings.")
        return

    if args.update_descs and not model_descs:
        print("Error: --update-descs specified but model_descs dictionary is empty!")
        print("Please edit this script and add your model description mappings.")
        return

    # Confirm before proceeding
    print("=== Model Field Update Script ===")
    print(f"Target file: {snapshot_path}")
    if args.update_params:
        print(f"Parameter updates to apply: {len(model_params)}")
    if args.update_descs:
        print(f"Description updates to apply: {len(model_descs)}")

    response = input("\nDo you want to proceed? (y/N): ").strip().lower()
    if response not in ["y", "yes"]:
        print("Operation cancelled.")
        return

    # Run the update
    try:
        update_snapshot_fields(
            snapshot_path, model_params if args.update_params else None, model_descs if args.update_descs else None
        )
        print("\n✅ Update completed successfully!")
    except Exception as e:
        print(f"\n❌ Error during update: {e}")
        return


if __name__ == "__main__":
    main()
