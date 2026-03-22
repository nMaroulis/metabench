#!/usr/bin/env python3
"""
Script to list all model names from snapshot.json file.

This script reads the snapshot.json file and extracts all model names,
printing them in a clean format that's easy to copy and paste.
"""

import json
import os


def list_model_names(snapshot_path: str) -> list[str]:
    """Extract all model names from snapshot.json."""

    print(f"Reading snapshot from: {snapshot_path}")

    with open(snapshot_path, encoding="utf-8") as f:
        snapshot = json.load(f)

    models = snapshot.get("models", [])
    model_names = [model.get("name", "") for model in models if model.get("name")]

    return model_names


def print_model_names(model_names: list[str]) -> None:
    """Print model names in various formats for easy use."""

    print(f"Found {len(model_names)} models in snapshot\n")

    # Format 1: Simple list
    print("=== Simple List ===")
    for i, name in enumerate(model_names, 1):
        print(f"{i}. {name}")

    print()

    # Format 2: Python dictionary format (easy to copy/paste)
    print("=== Python Dictionary Format ===")
    print("model_params = {")
    for name in model_names:
        print(f'    "{name}": "",')
    print("}")

    print()

    # Format 3: Comma-separated (for spreadsheets)
    print("=== Comma Separated ===")
    print(", ".join(f'"{name}"' for name in model_names))

    print()

    # Format 4: Just names (for simple copy/paste)
    print("=== Plain Names (one per line) ===")
    for name in model_names:
        print(name)


def main():
    """Main function to list model names."""

    snapshot_path = "/Users/nick/windsurf_projects/metabench/snapshot.json"

    # Check if snapshot exists
    if not os.path.exists(snapshot_path):
        print(f"Error: Snapshot file not found at {snapshot_path}")
        return

    try:
        model_names = list_model_names(snapshot_path)
        print_model_names(model_names)

    except Exception as e:
        print(f"Error reading snapshot: {e}")
        return


if __name__ == "__main__":
    main()
