import type { Language } from "../i18n";

export type ResizeTaskKind = "image_resize" | "video_resize";
export type BatchResizeTaskKind = "batch_image_resize" | "batch_video_resize";
export type VideoFramesTaskKind = "video_to_frames";
export type BatchVideoFramesTaskKind = "batch_video_to_frames";
export type DesktopTaskKind =
  | ResizeTaskKind
  | BatchResizeTaskKind
  | VideoFramesTaskKind
  | BatchVideoFramesTaskKind;

interface BaseTaskRequest {
  requestId?: string;
  taskKind: DesktopTaskKind;
  inputPath: string;
  outputPath: string;
  language?: Language;
}

export interface ResizeTaskRequest extends BaseTaskRequest {
  taskKind: ResizeTaskKind | BatchResizeTaskKind;
  width: number;
  height: number;
  keepAspect: boolean;
}

export interface VideoFramesTaskRequest extends BaseTaskRequest {
  taskKind: VideoFramesTaskKind | BatchVideoFramesTaskKind;
}

export type DesktopTaskRequest = ResizeTaskRequest | VideoFramesTaskRequest;

export interface DesktopTaskResponse {
  success: boolean;
  message: string;
  outputPath: string;
  metadata: Record<string, string | number | boolean | null>;
}

export interface DesktopTaskProgressEvent {
  requestId?: string;
  taskKind: DesktopTaskKind;
  current: number;
  total: number;
  percent: number;
  message: string;
  currentItem?: string | null;
}
