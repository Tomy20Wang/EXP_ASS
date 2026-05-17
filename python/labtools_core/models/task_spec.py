from dataclasses import dataclass
from typing import Any, Dict, Literal

ResizeTaskKind = Literal["image_resize", "video_resize"]


def _read_key(data: Dict[str, Any], snake_case: str, camel_case: str) -> Any:
    if snake_case in data:
        return data[snake_case]
    return data.get(camel_case)


@dataclass(frozen=True)
class ResizeTaskSpec:
    task_kind: ResizeTaskKind
    input_path: str
    output_path: str
    width: int
    height: int
    keep_aspect: bool = False

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ResizeTaskSpec":
        task_kind = _read_key(data, "task_kind", "taskKind")
        input_path = _read_key(data, "input_path", "inputPath")
        output_path = _read_key(data, "output_path", "outputPath")
        width = _read_key(data, "width", "width")
        height = _read_key(data, "height", "height")
        keep_aspect = _read_key(data, "keep_aspect", "keepAspect")

        if task_kind not in {"image_resize", "video_resize"}:
            raise ValueError("taskKind must be 'image_resize' or 'video_resize'.")

        if not input_path or not output_path:
            raise ValueError("Both inputPath and outputPath are required.")

        width = int(width)
        height = int(height)

        if width <= 0 or height <= 0:
            raise ValueError("Width and height must both be positive integers.")

        return cls(
            task_kind=task_kind,
            input_path=str(input_path),
            output_path=str(output_path),
            width=width,
            height=height,
            keep_aspect=False if keep_aspect is None else bool(keep_aspect),
        )
