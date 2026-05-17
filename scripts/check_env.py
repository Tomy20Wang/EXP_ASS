#!/usr/bin/env python3
from __future__ import annotations

import shutil
import subprocess
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent
HOME_DIR = Path.home()


def resolve_local_python() -> Path | None:
    candidates = [
        PROJECT_ROOT / ".venv" / "bin" / "python",
        PROJECT_ROOT / ".venv" / "bin" / "python3",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def describe_command(name: str) -> tuple[bool, str]:
    discovered = shutil.which(name)
    if not discovered:
        if name == "cargo":
            cargo = HOME_DIR / ".cargo" / "bin" / "cargo"
            if cargo.exists():
                return True, str(cargo)
        return False, "missing"
    return True, discovered


def command_version(command: list[str]) -> str:
    completed = subprocess.run(
        command,
        capture_output=True,
        text=True,
        check=False,
    )
    if completed.returncode != 0:
        return (completed.stderr or completed.stdout or "unknown error").strip()

    output = (completed.stdout or completed.stderr).strip()
    first_line = output.splitlines()[0] if output else "version unavailable"
    return first_line


def print_status(label: str, ok: bool, detail: str) -> None:
    mark = "OK" if ok else "MISSING"
    print(f"[{mark:<7}] {label:<14} {detail}")


def main() -> None:
    local_python = resolve_local_python()
    if local_python:
        print_status("local venv", True, str(local_python))
        print_status("venv python", True, command_version([str(local_python), "--version"]))
    else:
        print_status("local venv", False, "Create it with: python3 -m venv .venv")

    version_commands = {
        "node": ["node", "--version"],
        "npm": ["npm", "--version"],
        "ffmpeg": ["ffmpeg", "-version"],
        "cargo": [str(HOME_DIR / ".cargo" / "bin" / "cargo"), "--version"],
    }

    for command, version_command in version_commands.items():
        ok, detail = describe_command(command)
        if ok:
            print_status(command, True, command_version(version_command))
        else:
            print_status(command, False, detail)

    if not shutil.which("cargo"):
        print("\nRust/Cargo is required for Tauri.")
        print("Suggested next step on macOS:")
        print("  brew install rustup-init && rustup-init")


if __name__ == "__main__":
    main()
