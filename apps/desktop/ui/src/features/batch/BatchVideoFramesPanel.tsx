import { useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getAppText, type Language } from "../../i18n";
import { listenToTaskProgress, runDesktopTask } from "../../services/desktopApi";
import { TaskProgressPanel } from "../shared/TaskProgressPanel";
import type {
  DesktopTaskProgressEvent,
  DesktopTaskResponse,
} from "../../types/tasks";

const VIDEO_EXTENSIONS = ["mp4"];
const FRAME_PATTERN = "frame_%05d.png";

interface BatchVideoFramesPanelProps {
  language: Language;
  title: string;
  description: string;
  outputHint: string;
  submitLabel: string;
  runningLabel: string;
}

function buildOutputFolderSuggestion(inputPath: string) {
  if (!inputPath) {
    return "";
  }

  return `${inputPath}_frames`;
}

export function BatchVideoFramesPanel({
  language,
  title,
  description,
  outputHint,
  submitLabel,
  runningLabel,
}: BatchVideoFramesPanelProps) {
  const text = getAppText(language);
  const batchText = text.forms.batch;
  const outputLabel = text.forms.output;
  const [inputPath, setInputPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [status, setStatus] = useState<DesktopTaskResponse | null>(null);
  const [progress, setProgress] = useState<DesktopTaskProgressEvent | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const fileLabel = useMemo(
    () => VIDEO_EXTENSIONS.map((item) => `.${item}`).join(", "),
    []
  );

  async function handleBrowseInput() {
    const selected = await open({
      multiple: false,
      directory: true,
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
      defaultPath: outputPath || buildOutputFolderSuggestion(inputPath),
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
        message: batchText.missingPaths,
        outputPath: "",
        metadata: {},
      });
      return;
    }

    setIsRunning(true);
    setProgress(null);

    const requestId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `batch-video-to-frames-${Date.now()}`;

    const unlisten = await listenToTaskProgress((payload) => {
      if (payload.requestId === requestId) {
        setProgress(payload);
      }
    });

    try {
      const response = await runDesktopTask({
        requestId,
        taskKind: "batch_video_to_frames",
        inputPath,
        outputPath,
        language,
      });
      setStatus(response);
      const processedCount = Number(response.metadata.processedCount ?? 0);
      if (processedCount > 0) {
        setProgress({
          requestId,
          taskKind: "batch_video_to_frames",
          current: processedCount,
          total: processedCount,
          percent: 100,
          message: response.message,
          currentItem: null,
        });
      }
    } catch (error) {
      setStatus({
        success: false,
        message: error instanceof Error ? error.message : String(error),
        outputPath: "",
        metadata: {},
      });
    } finally {
      unlisten();
      setIsRunning(false);
    }
  }

  return (
    <form className="panel" onSubmit={handleSubmit}>
      <div>
        <h2>{title}</h2>
        <p className="panel-copy">{description}</p>
      </div>

      <div className="field-group">
        <div className="field">
          <label htmlFor="batch-video-frames-input">{batchText.inputFolder}</label>
          <div className="path-picker">
            <input
              id="batch-video-frames-input"
              type="text"
              value={inputPath}
              onChange={(event) => setInputPath(event.target.value)}
              placeholder={batchText.selectInputFolder}
            />
            <button className="secondary-button" type="button" onClick={handleBrowseInput}>
              {text.forms.browse}
            </button>
          </div>
          <p className="hint">
            {batchText.acceptedTypes}: {fileLabel}
          </p>
        </div>

        <div className="field">
          <label htmlFor="batch-video-frames-output">{batchText.outputFolder}</label>
          <div className="path-picker">
            <input
              id="batch-video-frames-output"
              type="text"
              value={outputPath}
              onChange={(event) => setOutputPath(event.target.value)}
              placeholder={batchText.selectOutputFolder}
            />
            <button className="secondary-button" type="button" onClick={handleBrowseOutput}>
              {text.forms.browse}
            </button>
          </div>
          <p className="hint">{outputHint}</p>
        </div>

        <p className="hint">{batchText.directChildrenHint}</p>
        <p className="hint">
          {language === "zh"
            ? `每个视频都会在输出目录下创建一个同名子文件夹，帧文件命名为 ${FRAME_PATTERN}。`
            : `Each video creates a same-name subfolder inside the output directory, with frames written as ${FRAME_PATTERN}.`}
        </p>
      </div>

      <button className="primary-button" type="submit" disabled={isRunning}>
        {isRunning ? runningLabel : submitLabel}
      </button>

      {progress ? (
        <TaskProgressPanel
          label={batchText.progress}
          currentItemLabel={batchText.currentItem}
          progress={progress}
        />
      ) : null}

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
