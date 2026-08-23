const STAGE_LABELS = {
  reading: "Reading file",
  extracting: "Extracting text",
  ocr: "Running OCR",
  summarizing: "Summarizing",
};

export default function ProcessingView({ stage, detail, fileName }) {
  return (
    <div className="flex flex-col items-center gap-6 py-16">
      <div className="relative h-40 w-32 overflow-hidden rounded-sm bg-paper-100 shadow-lg">
        <div className="absolute inset-3 flex flex-col gap-1.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="h-1.5 rounded-full bg-ink-700/15"
              style={{ width: `${i % 3 === 2 ? 55 : 90}%` }}
            />
          ))}
        </div>
        <div className="absolute inset-x-0 top-0 h-10 animate-scanline bg-gradient-to-b from-transparent via-scan/70 to-transparent" />
      </div>

      <div className="text-center">
        <p className="font-mono text-sm text-scan">
          {STAGE_LABELS[stage] ?? "Working"}
          <span className="animate-blink">…</span>
        </p>
        <p className="mt-1 text-sm text-muted font-body">{fileName}</p>
        {detail && <p className="mt-1 text-xs text-ink-600 font-mono">{detail}</p>}
      </div>
    </div>
  );
}
