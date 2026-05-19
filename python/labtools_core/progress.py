import json
import os
import sys
from typing import Optional


def emit_progress(
    *,
    task_kind: str,
    current: int,
    total: int,
    message: str,
    current_item: Optional[str] = None,
) -> None:
    if os.environ.get("EXP_ASS_STREAM_OUTPUT") != "1":
        return

    payload = {
        "type": "progress",
        "data": {
            "taskKind": task_kind,
            "current": current,
            "total": total,
            "percent": 0 if total <= 0 else round((current / total) * 100, 2),
            "message": message,
            "currentItem": current_item,
        },
    }
    json.dump(payload, sys.stdout)
    sys.stdout.write("\n")
    sys.stdout.flush()
