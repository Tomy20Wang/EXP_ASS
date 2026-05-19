import { useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { runDesktopTask } from "../../services/desktopApi";
import type { DesktopTaskResponse } from "../../types/tasks";
import { getAppText, type Language } from "../../i18n";

const VIDEO_EXTENSIONS = ["mp4", "mov", "mkv", "avi", "webm"];
const FRAME_PATTERN = "frame_%05d.png";

interface VideoFramesPanelProps {
  language: Language;
}

function buildOutputFolderSuggestion(inputPath: string) {
  if (!inputPath) {
    return "";
  }

  return inputPath.replace(/(\.[^./\\]+)?$/, "_frames");
}

export function VideoFramesPanel({ language }: VideoFramesPanelProps) {
  const text = getAppText(language);
  const videoFramesText = text.forms.videoFrames;
  const outputLabel = text.forms.output;
  const [inputPath, setInputPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [status, setStatus] = useState<DesktopTaskResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const fileLabel = useMemo(
    () => VIDEO_EXTENSIONS.map((item) => `.${item}`).join(", "),
    []
  );

  async function handleBrowseInput() {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: language === "zh" ? "视频" : "Videos",
          extensions: VIDEO_EXTENSIONS
        }
      ]
    });

    if (typeof selected === "string") {
      setInputPath(selected);
      setOutputPath((current) => current || buildOutputFolderSuggestion(selected));
    }
  }

  async function handleBrowseOutput() {
    const selected = await open({
      multiple: false,
      directory: true,
      defaultPath: outputPath || buildOutputFolderSuggestion(inputPath)
    });

    if (typeof selected === "string") {
      setOutputPath(selected);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    if (!inputPath.trim() || !outputPath.trim()) {
      setStatus({
        success: false,
        message: videoFramesText.missingPaths,
        outputPath: "",
        metadata: {}
      });
      return;
    }

    setIsRunning(true);

    try {
      const response = await runDesktopTask({
        taskKind: "video_to_frames",
        inputPath,
        outputPath,
        language
      });
      setStatus(response);
    } catch (error) {
      setStatus({
        success: false,
        message: error instanceof Error ? error.message : String(error),
        outputPath: "",
        metadata: {}
      });
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <div>
        <h2>{language === "zh" ? "视频转图片帧" : "Video to Frames"}</h2>
        <p className="panel-copy">
          {language === "zh"
            ? "把视频的每一帧提取出来，并以 PNG 图片形式保存到输出文件夹。"
            : "Extract every frame from a video and save PNG images into an output folder."}
        </p>
      </div>

      <div className="field-group">
        <div className="field">
          <label htmlFor="video-to-frames-input">{videoFramesText.inputVideo}</label>
          <div className="path-picker">
            <input
              id="video-to-frames-input"
              type="text"
              value={inputPath}
              onChange={(event) => setInputPath(event.target.value)}
              placeholder={videoFramesText.selectLocalVideo}
            />
            <button className="secondary-button" type="button" onClick={handleBrowseInput}>
              {text.forms.browse}
            </button>
          </div>
          <p className="hint">
            {videoFramesText.acceptedTypes}: {fileLabel}
          </p>
        </div>

        <div className="field">
          <label htmlFor="video-to-frames-output">{videoFramesText.outputFolder}</label>
          <div className="path-picker">
            <input
              id="video-to-frames-output"
              type="text"
              value={outputPath}
              onChange={(event) => setOutputPath(event.target.value)}
              placeholder={videoFramesText.chooseFolder}
            />
            <button className="secondary-button" type="button" onClick={handleBrowseOutput}>
              {text.forms.browse}
            </button>
          </div>
          <p className="hint">
            {videoFramesText.framePatternHint.replace("{pattern}", FRAME_PATTERN)}
          </p>
        </div>
      </div>

      <button className="primary-button" type="submit" disabled={isRunning}>
        {isRunning ? videoFramesText.running : videoFramesText.run}
      </button>

      {status ? (
        <p
          className="status"
          data-success={status.success || undefined}
          data-error={!status.success || undefined}
        >
          {status.message}
          {status.outputPath ? `\n${outputLabel}: ${status.outputPath}` : ""}
        </p>
      ) : null}
    </form>
  );
}
