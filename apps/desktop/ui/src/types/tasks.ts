export type ResizeTaskKind = "image_resize" | "video_resize";

export interface ResizeTaskRequest {
  taskKind: ResizeTaskKind;
  inputPath: string;
  outputPath: string;
  width: number;
  height: number;
  keepAspect: boolean;
}

export interface ResizeTaskResponse {
  success: boolean;
  message: string;
  outputPath: string;
  metadata: Record<string, string | number | boolean | null>;
}
