import json
import os
import shutil
import subprocess
from pathlib import Path
from typing import List, Tuple


def resolve_ffmpeg_bin() -> str:
    configured = os.environ.get("FFMPEG_BIN")
    if configured:
        return configured

    discovered = shutil.which("ffmpeg")
    if discovered:
        return discovered

    raise RuntimeError(
        "ffmpeg was not found. Install it or set the FFMPEG_BIN environment variable."
    )


def resolve_ffprobe_bin() -> str:
    ffmpeg_path = Path(resolve_ffmpeg_bin())
    sibling_ffprobe = ffmpeg_path.with_name("ffprobe")
    if sibling_ffprobe.exists():
        return str(sibling_ffprobe)

    discovered = shutil.which("ffprobe")
    if discovered:
        return discovered

    raise RuntimeError(
        "ffprobe was not found. Install it or make sure it is available next to ffmpeg."
    )


def run_ffmpeg(args: List[str]) -> None:
    command = [resolve_ffmpeg_bin(), *args]
    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
    )

    if completed.returncode != 0:
        stderr = completed.stderr.strip() or completed.stdout.strip()
        raise RuntimeError(f"ffmpeg failed with exit code {completed.returncode}: {stderr}")


def get_video_dimensions(input_path: Path) -> Tuple[int, int]:
    completed = subprocess.run(
        [
            resolve_ffprobe_bin(),
            "-v",
            "error",
            "-select_streams",
            "v:0",
            "-show_entries",
            "stream=width,height",
            "-of",
            "json",
            str(input_path),
        ],
        capture_output=True,
        text=True,
        check=False,
    )

    if completed.returncode != 0:
        stderr = completed.stderr.strip() or completed.stdout.strip()
        raise RuntimeError(f"ffprobe failed with exit code {completed.returncode}: {stderr}")

    payload = json.loads(completed.stdout)
    streams = payload.get("streams") or []
    if not streams:
        raise RuntimeError(f"No video stream metadata found for {input_path}")

    stream = streams[0]
    return int(stream["width"]), int(stream["height"])
