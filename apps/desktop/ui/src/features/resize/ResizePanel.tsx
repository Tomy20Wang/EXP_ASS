import { useMemo, useState } from "react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { runResizeTask } from "../../services/desktopApi";
import type { ResizeTaskKind, ResizeTaskResponse } from "../../types/tasks";

interface ResizePanelProps {
  taskKind: ResizeTaskKind;
  title: string;
  description: string;
  acceptedExtensions: string[];
  outputHint: string;
}

function buildOutputSuggestion(inputPath: string, taskKind: ResizeTaskKind) {
  if (!inputPath) {
    return "";
  }

  const ext = taskKind === "video_resize" ? ".mp4" : "";
  const replaced = inputPath.replace(/(\.[^./\\]+)?$/, "_resized$1");
  return taskKind === "video_resize" && !/\.[^./\\]+$/.test(replaced)
    ? `${replaced}${ext}`
    : replaced;
}

export function ResizePanel({
  taskKind,
  title,
  description,
  acceptedExtensions,
  outputHint
}: ResizePanelProps) {
  const [inputPath, setInputPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [keepAspect, setKeepAspect] = useState(false);
  const [status, setStatus] = useState<ResizeTaskResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const fileLabel = useMemo(
    () => acceptedExtensions.map((item) => `.${item}`).join(", "),
    [acceptedExtensions]
  );
  const targetLabel = `${width}x${height}`;

  async function handleBrowseInput() {
    const selected = await open({
      multiple: false,
      directory: false,
      filters: [
        {
          name: taskKind === "image_resize" ? "Images" : "Videos",
          extensions: acceptedExtensions
        }
      ]
    });

    if (typeof selected === "string") {
      setInputPath(selected);
      setOutputPath((current) => current || buildOutputSuggestion(selected, taskKind));
    }
  }

  async function handleBrowseOutput() {
    const selected = await save({
      defaultPath: outputPath || buildOutputSuggestion(inputPath, taskKind)
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
        message: "Please choose both an input path and an output path.",
        outputPath: "",
        metadata: {}
      });
      return;
    }

    if (width <= 0 || height <= 0) {
      setStatus({
        success: false,
        message: "Width and height must both be positive integers.",
        outputPath: "",
        metadata: {}
      });
      return;
    }

    setIsRunning(true);

    try {
      const response = await runResizeTask({
        taskKind,
        inputPath,
        outputPath,
        width,
        height,
        keepAspect
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
        <h2>{title}</h2>
        <p className="panel-copy">{description}</p>
      </div>

      <div className="field-group">
        <div className="field">
          <label htmlFor={`${taskKind}-input`}>Input Path</label>
          <div className="path-picker">
            <input
              id={`${taskKind}-input`}
              type="text"
              value={inputPath}
              onChange={(event) => setInputPath(event.target.value)}
              placeholder="Select a local file"
            />
            <button
              className="secondary-button"
              type="button"
              onClick={handleBrowseInput}
            >
              Browse
            </button>
          </div>
          <p className="hint">Accepted types: {fileLabel}</p>
        </div>

        <div className="field">
          <label htmlFor={`${taskKind}-output`}>Output Path</label>
          <div className="path-picker">
            <input
              id={`${taskKind}-output`}
              type="text"
              value={outputPath}
              onChange={(event) => setOutputPath(event.target.value)}
              placeholder={outputHint}
            />
            <button
              className="secondary-button"
              type="button"
              onClick={handleBrowseOutput}
            >
              Browse
            </button>
          </div>
          <p className="hint">{outputHint}</p>
        </div>

        <div className="field-row">
          <div className="field">
            <label htmlFor={`${taskKind}-width`}>Width</label>
            <input
              id={`${taskKind}-width`}
              type="number"
              min={1}
              step={1}
              value={width}
              onChange={(event) => setWidth(Number(event.target.value))}
            />
          </div>

          <div className="field">
            <label htmlFor={`${taskKind}-height`}>Height</label>
            <input
              id={`${taskKind}-height`}
              type="number"
              min={1}
              step={1}
              value={height}
              onChange={(event) => setHeight(Number(event.target.value))}
            />
          </div>
        </div>

        <label className="field-inline" htmlFor={`${taskKind}-keep-aspect`}>
          <input
            id={`${taskKind}-keep-aspect`}
            type="checkbox"
            checked={keepAspect}
            onChange={(event) => setKeepAspect(event.target.checked)}
          />
          Preserve aspect ratio
        </label>
        <p className="hint">
          Unchecked: force exact {targetLabel} output and allow distortion.
          Checked: fit inside the target box without padding, using the long edge as the limiting side.
        </p>
      </div>

      <button className="primary-button" type="submit" disabled={isRunning}>
        {isRunning ? "Processing..." : "Run Resize"}
      </button>

      {status ? (
        <p
          className="status"
          data-success={status.success || undefined}
          data-error={!status.success || undefined}
        >
          {status.message}
          {status.outputPath ? `\nOutput: ${status.outputPath}` : ""}
        </p>
      ) : null}
    </form>
  );
}
