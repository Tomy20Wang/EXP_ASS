from dataclasses import dataclass
from typing import Any, Dict, Literal

TaskKind = Literal[
    "image_resize",
    "video_resize",
    "video_to_frames",
    "batch_image_resize",
    "batch_video_resize",
    "batch_video_to_frames",
]
Language = Literal["en", "zh"]
RESIZE_TASK_KINDS = {
    "image_resize",
    "video_resize",
    "batch_image_resize",
    "batch_video_resize",
}
SUPPORTED_TASK_KINDS = {
    "image_resize",
    "video_resize",
    "video_to_frames",
    "batch_image_resize",
    "batch_video_resize",
    "batch_video_to_frames",
}


def _read_key(data: Dict[str, Any], snake_case: str, camel_case: str) -> Any:
    if snake_case in data:
        return data[snake_case]
    return data.get(camel_case)


@dataclass(frozen=True)
class TaskSpec:
    task_kind: TaskKind
    input_path: str
    output_path: str
    language: Language = "en"
    width: int = 0
    height: int = 0
    keep_aspect: bool = False

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "TaskSpec":
        task_kind = _read_key(data, "task_kind", "taskKind")
        input_path = _read_key(data, "input_path", "inputPath")
        output_path = _read_key(data, "output_path", "outputPath")
        language = _read_key(data, "language", "language") or "en"
        width = _read_key(data, "width", "width")
        height = _read_key(data, "height", "height")
        keep_aspect = _read_key(data, "keep_aspect", "keepAspect")
        is_zh = language == "zh"

        if task_kind not in SUPPORTED_TASK_KINDS:
            raise ValueError(
                "taskKind 必须是 image_resize、video_resize、video_to_frames、batch_image_resize、batch_video_resize 或 batch_video_to_frames 之一。"
                if is_zh
                else "taskKind must be one of image_resize, video_resize, video_to_frames, batch_image_resize, batch_video_resize, or batch_video_to_frames."
            )

        if not input_path or not output_path:
            raise ValueError(
                "inputPath 和 outputPath 都是必填项。"
                if is_zh
                else "Both inputPath and outputPath are required."
            )

        normalized_width = 0 if width in {None, ""} else int(width)
        normalized_height = 0 if height in {None, ""} else int(height)

        if task_kind in RESIZE_TASK_KINDS:
            if normalized_width <= 0 or normalized_height <= 0:
                raise ValueError(
                    "宽度和高度都必须是正整数。"
                    if is_zh
                    else "Width and height must both be positive integers."
                )

        return cls(
            task_kind=task_kind,
            input_path=str(input_path),
            output_path=str(output_path),
            language=language,
            width=normalized_width,
            height=normalized_height,
            keep_aspect=False if keep_aspect is None else bool(keep_aspect),
        )
