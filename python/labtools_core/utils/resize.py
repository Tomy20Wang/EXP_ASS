from typing import Tuple


def fit_within_box(
    source_width: int,
    source_height: int,
    target_width: int,
    target_height: int,
    *,
    even: bool = False,
) -> Tuple[int, int]:
    if source_width <= 0 or source_height <= 0:
        raise ValueError("Source width and height must both be positive.")

    scale = min(target_width / source_width, target_height / source_height)
    output_width = max(1, min(target_width, int(round(source_width * scale))))
    output_height = max(1, min(target_height, int(round(source_height * scale))))

    if even:
        output_width = _make_even(output_width)
        output_height = _make_even(output_height)

    return output_width, output_height


def _make_even(value: int) -> int:
    if value % 2 == 0:
        return value
    return max(2, value - 1)
