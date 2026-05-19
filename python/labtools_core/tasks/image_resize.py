from pathlib import Path

from PIL import Image

from labtools_core.models.task_result import TaskResult
from labtools_core.models.task_spec import TaskSpec
from labtools_core.utils.paths import ensure_parent_dir
from labtools_core.utils.resize import fit_within_box


def _normalize_for_save(image: Image.Image, output_path: Path) -> Image.Image:
    if output_path.suffix.lower() in {".jpg", ".jpeg"} and image.mode in {"RGBA", "LA", "P"}:
        return image.convert("RGB")
    return image


def run_image_resize(spec: TaskSpec) -> TaskResult:
    input_path = Path(spec.input_path).expanduser()
    output_path = Path(spec.output_path).expanduser()
    is_zh = spec.language == "zh"

    if not input_path.exists():
        raise FileNotFoundError(
            f"输入图片不存在: {input_path}" if is_zh else f"Input image does not exist: {input_path}"
        )

    ensure_parent_dir(output_path)

    with Image.open(input_path) as source:
        if spec.keep_aspect:
            output_width, output_height = fit_within_box(
                source.width,
                source.height,
                spec.width,
                spec.height,
            )
            resized = source.resize((output_width, output_height), Image.Resampling.LANCZOS)
        else:
            resized = source.resize((spec.width, spec.height), Image.Resampling.LANCZOS)

        final_image = _normalize_for_save(resized, output_path)
        final_image.save(output_path)

    mode_label = (
        "并保持原始比例" if spec.keep_aspect else "并执行强制缩放"
    ) if is_zh else ("while preserving aspect ratio" if spec.keep_aspect else "with forced resize")

    return TaskResult(
        success=True,
        message=(
            f"图片已输出为 {final_image.width}x{final_image.height}，{mode_label}。"
            if is_zh
            else f"Resized image to {final_image.width}x{final_image.height} {mode_label}."
        ),
        output_path=str(output_path),
        metadata={
            "requestedWidth": spec.width,
            "requestedHeight": spec.height,
            "outputWidth": final_image.width,
            "outputHeight": final_image.height,
            "keepAspect": spec.keep_aspect,
        },
    )
