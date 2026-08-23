const LENGTHS = ["short", "medium", "long"];

export default function SummaryView({
  fileName,
  result,
  length,
  onLengthChange,
  onReset,
  usedLLM,
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted font-mono">Summary of</p>
          <h2 className="font-display text-xl text-paper-100">{fileName}</h2>
        </div>
        <button
          onClick={onReset}
          className="text-sm text-muted hover:text-paper-100 font-body underline underline-offset-4"
        >
          New document
        </button>
      </div>

      <div className="flex gap-1 rounded-full bg-ink-800 p-1 w-fit">
        {LENGTHS.map((l) => (
          <button
            key={l}
            onClick={() => onLengthChange(l)}
            className={`rounded-full px-4 py-1.5 text-sm font-body capitalize transition-colors
              ${length === l ? "bg-scan text-ink-950 font-medium" : "text-muted hover:text-paper-100"}`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="rounded-lg bg-paper-100 p-6 text-ink-900">
        <p className="font-display text-base leading-relaxed whitespace-pre-line">
          {result.summary}
        </p>
        {result.compressionRatio !== undefined && !usedLLM && (
          <p className="mt-4 text-xs text-ink-600 font-mono">
            {result.sentenceCount} sentences kept · {Math.round(result.compressionRatio * 100)}%
            of original
          </p>
        )}
      </div>

      {result.keyPoints?.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-wider text-muted font-mono mb-2">Key points</p>
          <ul className="flex flex-col gap-2">
            {result.keyPoints.map((point, i) => (
              <li key={i} className="flex gap-3 text-sm text-paper-200 font-body">
                <span className="mt-1 h-1.5 w-1.5 flex-none rounded-full bg-signal" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
