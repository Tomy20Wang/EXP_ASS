#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::{BufRead, BufReader, Read, Write};
use std::path::PathBuf;
use std::process::{Command, Stdio};

use serde::{Deserialize, Serialize};
use tauri::Emitter;

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ToolTaskRequest {
    request_id: Option<String>,
    task_kind: String,
    input_path: String,
    output_path: String,
    language: Option<String>,
    width: Option<u32>,
    height: Option<u32>,
    keep_aspect: Option<bool>,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ToolTaskResponse {
    success: bool,
    message: String,
    output_path: String,
    metadata: serde_json::Value,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
struct ToolTaskProgress {
    task_kind: String,
    current: u32,
    total: u32,
    percent: f64,
    message: String,
    current_item: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
struct ToolTaskProgressEvent {
    request_id: Option<String>,
    task_kind: String,
    current: u32,
    total: u32,
    percent: f64,
    message: String,
    current_item: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(tag = "type", content = "data", rename_all = "snake_case")]
enum RunnerMessage {
    Progress(ToolTaskProgress),
    Result(ToolTaskResponse),
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
fn run_tool_task(app: tauri::AppHandle, request: ToolTaskRequest) -> Result<ToolTaskResponse, String> {
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
        .env("EXP_ASS_STREAM_OUTPUT", "1")
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

    let stdout = child
        .stdout
        .take()
        .ok_or_else(|| "Failed to capture Python stdout".to_string())?;
    let stderr = child
        .stderr
        .take()
        .ok_or_else(|| "Failed to capture Python stderr".to_string())?;

    let mut final_result: Option<ToolTaskResponse> = None;
    let stdout_reader = BufReader::new(stdout);

    for line in stdout_reader.lines() {
        let line = line.map_err(|error| format!("Failed to read Python stdout: {error}"))?;
        if line.trim().is_empty() {
            continue;
        }

        let message = serde_json::from_str::<RunnerMessage>(&line)
            .map_err(|error| format!("Failed to parse Python runner message: {error}. line: {line}"))?;

        match message {
            RunnerMessage::Progress(progress) => {
                app.emit(
                    "tool-task-progress",
                    ToolTaskProgressEvent {
                        request_id: request.request_id.clone(),
                        task_kind: progress.task_kind,
                        current: progress.current,
                        total: progress.total,
                        percent: progress.percent,
                        message: progress.message,
                        current_item: progress.current_item,
                    },
                )
                .map_err(|error| format!("Failed to emit tool progress event: {error}"))?;
            }
            RunnerMessage::Result(result) => {
                final_result = Some(result);
            }
        }
    }

    let mut stderr_output = String::new();
    BufReader::new(stderr)
        .read_to_string(&mut stderr_output)
        .map_err(|error| format!("Failed to read Python stderr: {error}"))?;

    let status = child
        .wait()
        .map_err(|error| format!("Failed to wait for Python runner: {error}"))?;

    if let Some(result) = final_result {
        return Ok(result);
    }

    Err(format!(
        "Python runner returned no result. status: {status}. stderr: {stderr_output}"
    ))
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![run_tool_task])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
