from pathlib import Path
from typing import Iterable, List, Sequence

from labtools_core.models.task_result import TaskResult
from labtools_core.models.task_spec import TaskSpec
from labtools_core.progress import emit_progress
from labtools_core.tasks.image_resize import run_image_resize
from labtools_core.tasks.video_resize import run_video_resize
from labtools_core.tasks.video_to_frames import FRAME_FILE_PATTERN, run_video_to_frames

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png"}
VIDEO_SUFFIXES = {".mp4"}


def _resolve_batch_directories(spec: TaskSpec) -> tuple[Path, Path, bool]:
    input_dir = Path(spec.input_path).expanduser()
    output_dir = Path(spec.output_path).expanduser()
    is_zh = spec.language == "zh"

    if not input_dir.exists():
        raise FileNotFoundError(
            f"输入文件夹不存在: {input_dir}"
            if is_zh
            else f"Input folder does not exist: {input_dir}"
        )

    if not input_dir.is_dir():
        raise NotADirectoryError(
            f"输入路径不是文件夹: {input_dir}"
            if is_zh
            else f"Input path is not a folder: {input_dir}"
        )

    if output_dir.exists() and not output_dir.is_dir():
        raise NotADirectoryError(
            f"输出路径不是文件夹: {output_dir}"
            if is_zh
            else f"Output path is not a folder: {output_dir}"
        )

    output_dir.mkdir(parents=True, exist_ok=True)
    return input_dir, output_dir, is_zh


def _collect_direct_files(input_dir: Path, suffixes: Sequence[str]) -> List[Path]:
    allowed = {suffix.lower() for suffix in suffixes}
    return sorted(
        [
            path
            for path in input_dir.iterdir()
            if path.is_file() and path.suffix.lower() in allowed
        ],
        key=lambda path: path.name.lower(),
    )


def _raise_if_empty(files: Iterable[Path], input_dir: Path, kind_label: str, is_zh: bool) -> List[Path]:
    items = list(files)
    if items:
        return items

    raise FileNotFoundError(
        f"在输入文件夹中没有找到可处理的{kind_label}: {input_dir}"
        if is_zh
        else f"No supported {kind_label} files were found in the input folder: {input_dir}"
    )


def run_batch_image_resize(spec: TaskSpec) -> TaskResult:
    input_dir, output_dir, is_zh = _resolve_batch_directories(spec)
    image_files = _raise_if_empty(
        _collect_direct_files(input_dir, IMAGE_SUFFIXES),
        input_dir,
        "图片文件" if is_zh else "image",
        is_zh,
    )

    total = len(image_files)
    emit_progress(
        task_kind="batch_image_resize",
        current=0,
        total=total,
        message=(
            f"准备处理 {total} 个图片文件。"
            if is_zh
            else f"Preparing to process {total} image files."
        ),
    )

    for index, image_file in enumerate(image_files, start=1):
        run_image_resize(
            TaskSpec(
                task_kind="image_resize",
                input_path=str(image_file),
                output_path=str(output_dir / image_file.name),
                language=spec.language,
                width=spec.width,
                height=spec.height,
                keep_aspect=spec.keep_aspect,
            )
        )
        emit_progress(
            task_kind="batch_image_resize",
            current=index,
            total=total,
            current_item=image_file.name,
            message=(
                f"已处理 {image_file.name}（{index}/{total}）。"
                if is_zh
                else f"Processed {image_file.name} ({index}/{total})."
            ),
        )

    mode_label = (
        "保持原始比例" if spec.keep_aspect else "强制缩放"
    ) if is_zh else ("aspect-preserving" if spec.keep_aspect else "forced")

    return TaskResult(
        success=True,
        message=(
            f"已经处理 {len(image_files)} 个图片文件，输出到 {output_dir}，模式为{mode_label}。"
            if is_zh
            else f"Processed {len(image_files)} image files into {output_dir} using {mode_label} resize."
        ),
        output_path=str(output_dir),
        metadata={
            "processedCount": len(image_files),
            "requestedWidth": spec.width,
            "requestedHeight": spec.height,
            "keepAspect": spec.keep_aspect,
        },
    )


def run_batch_video_resize(spec: TaskSpec) -> TaskResult:
    input_dir, output_dir, is_zh = _resolve_batch_directories(spec)
    video_files = _raise_if_empty(
        _collect_direct_files(input_dir, VIDEO_SUFFIXES),
        input_dir,
        "视频文件" if is_zh else "video",
        is_zh,
    )

    total = len(video_files)
    emit_progress(
        task_kind="batch_video_resize",
        current=0,
        total=total,
        message=(
            f"准备处理 {total} 个视频文件。"
            if is_zh
            else f"Preparing to process {total} video files."
        ),
    )

    for index, video_file in enumerate(video_files, start=1):
        run_video_resize(
            TaskSpec(
                task_kind="video_resize",
                input_path=str(video_file),
                output_path=str(output_dir / video_file.name),
                language=spec.language,
                width=spec.width,
                height=spec.height,
                keep_aspect=spec.keep_aspect,
            )
        )
        emit_progress(
            task_kind="batch_video_resize",
            current=index,
            total=total,
            current_item=video_file.name,
            message=(
                f"已处理 {video_file.name}（{index}/{total}）。"
                if is_zh
                else f"Processed {video_file.name} ({index}/{total})."
            ),
        )

    mode_label = (
        "保持原始比例" if spec.keep_aspect else "强制缩放"
    ) if is_zh else ("aspect-preserving" if spec.keep_aspect else "forced")

    return TaskResult(
        success=True,
        message=(
            f"已经处理 {len(video_files)} 个视频文件，输出到 {output_dir}，模式为{mode_label}。"
            if is_zh
            else f"Processed {len(video_files)} video files into {output_dir} using {mode_label} resize."
        ),
        output_path=str(output_dir),
        metadata={
            "processedCount": len(video_files),
            "requestedWidth": spec.width,
            "requestedHeight": spec.height,
            "keepAspect": spec.keep_aspect,
        },
    )


def run_batch_video_to_frames(spec: TaskSpec) -> TaskResult:
    input_dir, output_dir, is_zh = _resolve_batch_directories(spec)
    video_files = _raise_if_empty(
        _collect_direct_files(input_dir, VIDEO_SUFFIXES),
        input_dir,
        "视频文件" if is_zh else "video",
        is_zh,
    )

    total = len(video_files)
    emit_progress(
        task_kind="batch_video_to_frames",
        current=0,
        total=total,
        message=(
            f"准备为 {total} 个视频导出全部帧。"
            if is_zh
            else f"Preparing to extract frames for {total} videos."
        ),
    )

    ffmpeg_bin = ""
    for index, video_file in enumerate(video_files, start=1):
        result = run_video_to_frames(
            TaskSpec(
                task_kind="video_to_frames",
                input_path=str(video_file),
                output_path=str(output_dir / video_file.stem),
                language=spec.language,
            )
        )
        ffmpeg_bin = str(result.metadata.get("ffmpeg", ""))
        emit_progress(
            task_kind="batch_video_to_frames",
            current=index,
            total=total,
            current_item=video_file.name,
            message=(
                f"已完成 {video_file.name} 的抽帧（{index}/{total}）。"
                if is_zh
                else f"Extracted frames for {video_file.name} ({index}/{total})."
            ),
        )

    return TaskResult(
        success=True,
        message=(
            f"已经为 {len(video_files)} 个视频导出全部帧，并在 {output_dir} 下按视频名创建子文件夹。"
            if is_zh
            else f"Extracted all frames for {len(video_files)} videos into per-video folders under {output_dir}."
        ),
        output_path=str(output_dir),
        metadata={
            "processedCount": len(video_files),
            "filePattern": FRAME_FILE_PATTERN,
            "ffmpeg": ffmpeg_bin,
        },
    )
