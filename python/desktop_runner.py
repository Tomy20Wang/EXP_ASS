import json
import os
import sys
from typing import Any, Dict

from labtools_core.dispatch import run_task
from labtools_core.models.task_result import TaskResult
from labtools_core.models.task_spec import TaskSpec


def emit(result: TaskResult) -> None:
    if os.environ.get("EXP_ASS_STREAM_OUTPUT") == "1":
        json.dump({"type": "result", "data": result.to_dict()}, sys.stdout)
        sys.stdout.write("\n")
        sys.stdout.flush()
        return

    json.dump(result.to_dict(), sys.stdout)


def main() -> None:
    try:
        payload: Dict[str, Any] = json.load(sys.stdin)
        spec = TaskSpec.from_dict(payload)
        result = run_task(spec)
        emit(result)
    except Exception as error:  # pragma: no cover - defensive bridge handling
        emit(
            TaskResult(
                success=False,
                message=str(error),
                output_path="",
                metadata={},
            )
        )


if __name__ == "__main__":
    main()
