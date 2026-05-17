# EXP_ASS

An extensible research utility toolkit for experiment and paper workflows.

## Current scope

The current MVP targets **scene 1** only: a local desktop application that runs on your own machine.

Implemented first-wave tools:

- Image resize
- Video resize

Planned later:

- Remote Ubuntu CLI support
- Video frame extraction
- FPS conversion
- Batch task queues

## Project layout

```text
EXP_ASS/
├─ apps/
│  └─ desktop/
│     ├─ package.json
│     ├─ src-tauri/
│     └─ ui/
├─ python/
│  ├─ desktop_runner.py
│  └─ labtools_core/
└─ pyproject.toml
```

## Architecture

- `apps/desktop/ui`: React-based desktop UI
- `apps/desktop/src-tauri`: Tauri shell and Rust-to-Python bridge
- `python/labtools_core`: shared Python processing engine
- `python/desktop_runner.py`: local entrypoint called by Tauri

## Documentation

- `docs/core-features.md`: user-readable explanation of each core feature and its implementation logic

The desktop app sends structured resize requests from the UI to Tauri, then Tauri starts Python locally and returns structured results back to the UI.

## Local development

### 1. Install prerequisites

- Node.js 20+
- Python 3.9+
- Rust and Cargo
- `ffmpeg` available in `PATH`

On macOS, the current blocker for running the desktop app is Rust/Cargo. If `npm run tauri:dev` reports `cargo metadata` not found, install Rust first:

```bash
brew install rustup-init
rustup-init
```

### 2. Install Python dependencies

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

This project is intended to use the repository-local virtual environment instead of your macOS system Python. The Tauri bridge will automatically prefer `.venv/bin/python` when it exists.

### 3. Install desktop dependencies

```bash
cd apps/desktop
npm install
```

### 4. Check the environment

```bash
python scripts/check_env.py
```

### 5. Run the desktop app

```bash
cd apps/desktop
npm run tauri:dev
```

Or from the project root:

```bash
./scripts/dev_desktop.sh
```

## Environment overrides

- `EXP_ASS_PYTHON_BIN`: use a specific Python executable for the Tauri bridge
- `FFMPEG_BIN`: use a specific `ffmpeg` executable
- `EXP_ASS_PROJECT_ROOT`: override project-root discovery if needed

## Notes

- The current bridge uses your local Python environment, which keeps the first version simple.
- Packaging Python into the final desktop build can be handled later once the workflow stabilizes.
