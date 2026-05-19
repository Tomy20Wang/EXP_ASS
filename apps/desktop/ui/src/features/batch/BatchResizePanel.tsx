import { useMemo, useState } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { getAppText, type Language } from "../../i18n";
import { listenToTaskProgress, runDesktopTask } from "../../services/desktopApi";
import { TaskProgressPanel } from "../shared/TaskProgressPanel";
import type {
  BatchResizeTaskKind,
  DesktopTaskProgressEvent,
  DesktopTaskResponse,
} from "../../types/tasks";

interface BatchResizePanelProps {
  language: Language;
  taskKind: BatchResizeTaskKind;
  title: string;
  description: string;
  acceptedExtensions: string[];
  outputHint: string;
  submitLabel: string;
  runningLabel: string;
}

function buildFolderSuggestion(inputPath: string, suffix: string) {
  if (!inputPath) {
    return "";
  }

  return `${inputPath}${suffix}`;
}

export function BatchResizePanel({
  language,
  taskKind,
  title,
  description,
  acceptedExtensions,
  outputHint,
  submitLabel,
  runningLabel,
}: BatchResizePanelProps) {
  const text = getAppText(language);
  const resizeText = text.forms.resize;
  const batchText = text.forms.batch;
  const outputLabel = text.forms.output;
  const [inputPath, setInputPath] = useState("");
  const [outputPath, setOutputPath] = useState("");
  const [width, setWidth] = useState(1280);
  const [height, setHeight] = useState(720);
  const [keepAspect, setKeepAspect] = useState(false);
  const [status, setStatus] = useState<DesktopTaskResponse | null>(null);
  const [progress, setProgress] = useState<DesktopTaskProgressEvent | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const fileLabel = useMemo(
    () => acceptedExtensions.map((item) => `.${item}`).join(", "),
    [acceptedExtensions]
  );
  const targetLabel = `${width}x${height}`;
  const suggestionSuffix = taskKind === "batch_image_resize" ? "_images_resized" : "_videos_resized";

  async function handleBrowseInput() {
    const selected = await open({
      multiple: false,
      directory: true,
    });

    if (typeof selected === "string") {
      setInputPath(selected);
      setOutputPath((current) => current || buildFolderSuggestion(selected, suggestionSuffix));
    }
  }

  async function handleBrowseOutput() {
    const selected = await open({
      multiple: false,
      directory: true,
      defaultPath: outputPath || buildFolderSuggestion(inputPath, suggestionSuffix),
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

    if (width <= 0 || height <= 0) {
      setStatus({
        success: false,
        message: resizeText.invalidSize,
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
        : `${taskKind}-${Date.now()}`;

    const unlisten = await listenToTaskProgress((payload) => {
      if (payload.requestId === requestId) {
        setProgress(payload);
      }
    });

    try {
      const response = await runDesktopTask({
        requestId,
        taskKind,
        inputPath,
        outputPath,
        width,
        height,
        keepAspect,
        language,
      });
      setStatus(response);
      const processedCount = Number(response.metadata.processedCount ?? 0);
      if (processedCount > 0) {
        setProgress({
          requestId,
          taskKind,
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
          <label htmlFor={`${taskKind}-input`}>{batchText.inputFolder}</label>
          <div className="path-picker">
            <input
              id={`${taskKind}-input`}
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
          <label htmlFor={`${taskKind}-output`}>{batchText.outputFolder}</label>
          <div className="path-picker">
            <input
              id={`${taskKind}-output`}
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

        <div className="field-row">
          <div className="field">
            <label htmlFor={`${taskKind}-width`}>{resizeText.width}</label>
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
            <label htmlFor={`${taskKind}-height`}>{resizeText.height}</label>
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
          {resizeText.preserveAspect}
        </label>
        <p className="hint">
          {resizeText.preserveAspectHint.replace("{size}", targetLabel)}
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
