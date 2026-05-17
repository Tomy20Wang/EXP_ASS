import { invoke } from "@tauri-apps/api/core";
import type { ResizeTaskRequest, ResizeTaskResponse } from "../types/tasks";

export async function runResizeTask(
  request: ResizeTaskRequest
): Promise<ResizeTaskResponse> {
  return invoke<ResizeTaskResponse>("run_resize_task", { request });
}
