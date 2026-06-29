import os
from pathlib import Path
import sys

import pytest

LIVE_STORAGE_ENV_VARS = (
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_PUBLIC_BUCKET",
    "R2_PRIVATE_BUCKET",
    "UPSTASH_REDIS_REST_URL",
    "UPSTASH_REDIS_REST_TOKEN",
)

if os.getenv("ALLOW_LIVE_STORAGE_IN_TESTS") != "1":
    for env_var in LIVE_STORAGE_ENV_VARS:
        os.environ[env_var] = ""

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))


@pytest.fixture(autouse=True)
def block_live_diagram_storage(monkeypatch):
    from app.routers import generate

    monkeypatch.setattr(
        generate.diagram_state_repository,
        "persist_terminal_session_audit",
        lambda **kwargs: None,
    )
    monkeypatch.setattr(
        generate.diagram_state_repository,
        "save_successful_diagram_state",
        lambda **kwargs: None,
    )
    monkeypatch.setattr(
        generate.diagram_state_repository,
        "upsert_public_browse_index_entry",
        lambda **kwargs: None,
    )
