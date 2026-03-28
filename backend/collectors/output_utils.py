from __future__ import annotations

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Union

from pydantic import BaseModel


OUTPUT_DIR = Path(__file__).parent.parent / "output"


def save_collector_output(city: str, source_name: str, data: Union[BaseModel, dict]) -> Path:
    """Persist a collector's output to the temp output folder.

    Args:
        city: City key (e.g. "orlando")
        source_name: Collector name (e.g. "pharmacy", "pollen")
        data: Pydantic model or dict to serialize

    Returns:
        Path to the written JSON file.
    """
    city_dir = OUTPUT_DIR / city.lower().replace(" ", "_")
    city_dir.mkdir(parents=True, exist_ok=True)

    if isinstance(data, BaseModel):
        payload = data.model_dump(mode="json")
    else:
        payload = data

    filepath = city_dir / f"{source_name}.json"
    with open(filepath, "w") as f:
        json.dump(payload, f, indent=2, default=str)

    return filepath


def clear_output(city: str | None = None) -> None:
    """Clear output folder. If city is given, clear only that city."""
    import shutil
    if city:
        target = OUTPUT_DIR / city.lower().replace(" ", "_")
        if target.exists():
            shutil.rmtree(target)
    elif OUTPUT_DIR.exists():
        shutil.rmtree(OUTPUT_DIR)
