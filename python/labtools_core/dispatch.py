from labtools_core.models.task_result import TaskResult
from labtools_core.models.task_spec import TaskSpec
from labtools_core.tasks.batch_tasks import (
    run_batch_image_resize,
    run_batch_video_resize,
    run_batch_video_to_frames,
)
from labtools_core.tasks.image_resize import run_image_resize
from labtools_core.tasks.video_to_frames import run_video_to_frames
from labtools_core.tasks.video_resize import run_video_resize


def run_task(spec: TaskSpec) -> TaskResult:
    if spec.task_kind == "image_resize":
        return run_image_resize(spec)

    if spec.task_kind == "video_resize":
        return run_video_resize(spec)

    if spec.task_kind == "video_to_frames":
        return run_video_to_frames(spec)

    if spec.task_kind == "batch_image_resize":
        return run_batch_image_resize(spec)

    if spec.task_kind == "batch_video_resize":
        return run_batch_video_resize(spec)

    if spec.task_kind == "batch_video_to_frames":
        return run_batch_video_to_frames(spec)

    raise ValueError(f"Unsupported task kind: {spec.task_kind}")
