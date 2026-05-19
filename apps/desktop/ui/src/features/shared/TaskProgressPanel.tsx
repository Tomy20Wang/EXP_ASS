import type { DesktopTaskProgressEvent } from "../../types/tasks";

interface TaskProgressPanelProps {
  label: string;
  currentItemLabel: string;
  progress: DesktopTaskProgressEvent;
}

export function TaskProgressPanel({
  label,
  currentItemLabel,
  progress,
}: TaskProgressPanelProps) {
  return (
    <section className="task-progress-card">
      <div className="task-progress-head">
        <p className="meta-label">{label}</p>
        <span className="task-progress-count">
          {progress.current} / {progress.total}
        </span>
      </div>

      <div className="task-progress-track" aria-hidden="true">
        <div
          className="task-progress-fill"
          style={{ width: `${Math.max(0, Math.min(progress.percent, 100))}%` }}
        />
      </div>

      <p className="meta-copy">{progress.message}</p>

      {progress.currentItem ? (
        <p className="hint">
          {currentItemLabel}: {progress.currentItem}
        </p>
      ) : null}
    </section>
  );
}
