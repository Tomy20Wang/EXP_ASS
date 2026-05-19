from pathlib import Path

from labtools_core.adapters.ffmpeg import get_video_dimensions, resolve_ffmpeg_bin, run_ffmpeg
from labtools_core.models.task_result import TaskResult
from labtools_core.models.task_spec import TaskSpec
from labtools_core.utils.paths import ensure_parent_dir
from labtools_core.utils.resize import fit_within_box


def _build_filter(output_width: int, output_height: int) -> str:
    # Reset SAR to 1 so media players display the resized pixel dimensions directly.
    return f"scale={output_width}:{output_height},setsar=1"


def run_video_resize(spec: TaskSpec) -> TaskResult:
    input_path = Path(spec.input_path).expanduser()
    output_path = Path(spec.output_path).expanduser()
    is_zh = spec.language == "zh"

    if not input_path.exists():
        raise FileNotFoundError(
            f"输入视频不存在: {input_path}" if is_zh else f"Input video does not exist: {input_path}"
        )

    ensure_parent_dir(output_path)

    ffmpeg_bin = resolve_ffmpeg_bin()
    if spec.keep_aspect:
        input_width, input_height = get_video_dimensions(input_path)
        output_width, output_height = fit_within_box(
            input_width,
            input_height,
            spec.width,
            spec.height,
            even=True,
        )
    else:
        output_width, output_height = spec.width, spec.height

    filter_expression = _build_filter(output_width, output_height)

    run_ffmpeg(
        [
            "-y",
            "-i",
            str(input_path),
            "-vf",
            filter_expression,
            "-c:a",
            "copy",
            str(output_path),
        ]
    )

    mode_label = (
        "并保持原始比例" if spec.keep_aspect else "并执行强制缩放"
    ) if is_zh else ("while preserving aspect ratio" if spec.keep_aspect else "with forced resize")

    return TaskResult(
        success=True,
        message=(
            f"视频已输出为 {output_width}x{output_height}，{mode_label}。"
            if is_zh
            else f"Resized video to {output_width}x{output_height} {mode_label}."
        ),
        output_path=str(output_path),
        metadata={
            "requestedWidth": spec.width,
            "requestedHeight": spec.height,
            "outputWidth": output_width,
            "outputHeight": output_height,
            "keepAspect": spec.keep_aspect,
            "ffmpeg": ffmpeg_bin,
        },
    )
