"""Export OpenAPI schema from FastAPI app to openapi/openapi.yaml and openapi/openapi.json."""

import json
import logging
import sys
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

import yaml

# apps/admin-api/scripts/ → apps/admin-api/ → repo root
ROOT = Path(__file__).resolve().parent.parent.parent
OPENAPI_DIR = ROOT / "openapi"


def main() -> None:
    # Import after path is set so app can load
    sys.path.insert(0, str(ROOT / "apps" / "admin-api"))
    from app.main import app

    schema = app.openapi()
    OPENAPI_DIR.mkdir(parents=True, exist_ok=True)

    with open(OPENAPI_DIR / "openapi.json", "w", encoding="utf-8") as f:
        json.dump(schema, f, indent=2, ensure_ascii=False)

    with open(OPENAPI_DIR / "openapi.yaml", "w", encoding="utf-8") as f:
        yaml.dump(schema, f, default_flow_style=False, allow_unicode=True, sort_keys=False)

    logger.info("Exported openapi/openapi.json and openapi/openapi.yaml")


if __name__ == "__main__":
    main()
