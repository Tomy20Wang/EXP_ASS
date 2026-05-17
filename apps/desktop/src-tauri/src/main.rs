#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::Write;
use std::path::PathBuf;
use std::process::{Command, Stdio};

use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ResizeTaskRequest {
    task_kind: String,
    input_path: String,
    output_path: String,
    width: u32,
    height: u32,
    keep_aspect: bool,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ResizeTaskResponse {
    success: bool,
    message: String,
    output_path: String,
    metadata: serde_json::Value,
}

fn resolve_project_root() -> Result<PathBuf, String> {
    if let Ok(root) = std::env::var("EXP_ASS_PROJECT_ROOT") {
        return Ok(PathBuf::from(root));
    }

    let manifest_dir = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    manifest_dir
        .join("../../..")
        .canonicalize()
        .map_err(|error| format!("Failed to resolve project root: {error}"))
}

fn resolve_python_bin() -> String {
    if let Ok(python_bin) = std::env::var("EXP_ASS_PYTHON_BIN") {
        return python_bin;
    }

    if let Ok(project_root) = resolve_project_root() {
        let venv_python = project_root.join(".venv").join("bin").join("python");
        if venv_python.exists() {
            return venv_python.to_string_lossy().into_owned();
        }

        let venv_python3 = project_root.join(".venv").join("bin").join("python3");
        if venv_python3.exists() {
            return venv_python3.to_string_lossy().into_owned();
        }
    }

    "python3".to_string()
}

#[tauri::command]
fn run_resize_task(request: ResizeTaskRequest) -> Result<ResizeTaskResponse, String> {
    let project_root = resolve_project_root()?;
    let runner_path = project_root.join("python").join("desktop_runner.py");

    if !runner_path.exists() {
        return Err(format!(
            "Python runner not found at {}",
            runner_path.display()
        ));
    }

    let request_json =
        serde_json::to_vec(&request).map_err(|error| format!("Serialize request failed: {error}"))?;

    let mut child = Command::new(resolve_python_bin())
        .arg(runner_path)
        .current_dir(&project_root)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("Failed to start Python runner: {error}"))?;

    if let Some(mut stdin) = child.stdin.take() {
        stdin
            .write_all(&request_json)
            .map_err(|error| format!("Failed to write request to Python stdin: {error}"))?;
    }

    let output = child
        .wait_with_output()
        .map_err(|error| format!("Failed to wait for Python runner: {error}"))?;

    let stdout = String::from_utf8(output.stdout)
        .map_err(|error| format!("Python stdout was not valid UTF-8: {error}"))?;
    let stderr = String::from_utf8_lossy(&output.stderr);

    if stdout.trim().is_empty() {
        return Err(format!("Python runner returned no output. stderr: {stderr}"));
    }

    serde_json::from_str::<ResizeTaskResponse>(&stdout)
        .map_err(|error| format!("Failed to parse Python response: {error}. stderr: {stderr}"))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![run_resize_task])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
