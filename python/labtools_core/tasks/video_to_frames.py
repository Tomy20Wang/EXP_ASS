from pathlib import Path

from labtools_core.adapters.ffmpeg import resolve_ffmpeg_bin, run_ffmpeg
from labtools_core.models.task_result import TaskResult
from labtools_core.models.task_spec import TaskSpec

FRAME_FILE_PATTERN = "frame_%05d.png"


def run_video_to_frames(spec: TaskSpec) -> TaskResult:
    input_path = Path(spec.input_path).expanduser()
    output_dir = Path(spec.output_path).expanduser()
    is_zh = spec.language == "zh"

    if not input_path.exists():
        raise FileNotFoundError(
            f"输入视频不存在: {input_path}" if is_zh else f"Input video does not exist: {input_path}"
        )

    output_dir.mkdir(parents=True, exist_ok=True)

    frame_pattern_path = output_dir / FRAME_FILE_PATTERN
    ffmpeg_bin = resolve_ffmpeg_bin()

    run_ffmpeg(
        [
            "-y",
            "-i",
            str(input_path),
            "-start_number",
            "1",
            "-vsync",
            "0",
            str(frame_pattern_path),
        ]
    )

    message = (
        f"已经把视频帧导出到目标文件夹，命名规则为 {FRAME_FILE_PATTERN}。"
        if is_zh
        else f"Extracted video frames into the selected folder using the {FRAME_FILE_PATTERN} naming pattern."
    )

    return TaskResult(
        success=True,
        message=message,
        output_path=str(output_dir),
        metadata={
            "filePattern": FRAME_FILE_PATTERN,
            "ffmpeg": ffmpeg_bin,
        },
    )
