interface PlaceholderPanelProps {
  readyLabel: string;
  title: string;
  description: string;
  notes: string[];
}

export function PlaceholderPanel({
  readyLabel,
  title,
  description,
  notes,
}: PlaceholderPanelProps) {
  return (
    <section className="panel">
      <div>
        <h2>{title}</h2>
        <p className="panel-copy">{description}</p>
      </div>

      <div className="field-group">
        <p className="hint">{readyLabel}</p>
        <ul className="placeholder-list">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
