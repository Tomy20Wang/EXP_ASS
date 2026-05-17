import json
import sys
from typing import Any, Dict

from labtools_core.dispatch import run_task
from labtools_core.models.task_result import TaskResult
from labtools_core.models.task_spec import ResizeTaskSpec


def emit(result: TaskResult) -> None:
    json.dump(result.to_dict(), sys.stdout)


def main() -> None:
    try:
        payload: Dict[str, Any] = json.load(sys.stdin)
        spec = ResizeTaskSpec.from_dict(payload)
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
