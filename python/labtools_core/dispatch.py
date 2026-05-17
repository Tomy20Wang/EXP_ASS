from labtools_core.models.task_result import TaskResult
from labtools_core.models.task_spec import ResizeTaskSpec
from labtools_core.tasks.image_resize import run_image_resize
from labtools_core.tasks.video_resize import run_video_resize


def run_task(spec: ResizeTaskSpec) -> TaskResult:
    if spec.task_kind == "image_resize":
        return run_image_resize(spec)

    if spec.task_kind == "video_resize":
        return run_video_resize(spec)

    raise ValueError(f"Unsupported task kind: {spec.task_kind}")
