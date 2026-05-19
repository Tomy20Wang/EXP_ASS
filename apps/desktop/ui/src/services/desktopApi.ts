import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import type {
  DesktopTaskProgressEvent,
  DesktopTaskRequest,
  DesktopTaskResponse,
} from "../types/tasks";

export async function runDesktopTask(
  request: DesktopTaskRequest
): Promise<DesktopTaskResponse> {
  return invoke<DesktopTaskResponse>("run_tool_task", { request });
}

export async function listenToTaskProgress(
  handler: (payload: DesktopTaskProgressEvent) => void
): Promise<UnlistenFn> {
  return listen<DesktopTaskProgressEvent>("tool-task-progress", (event) => {
    handler(event.payload);
  });
}
