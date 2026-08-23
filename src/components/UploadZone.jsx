import { useCallback, useState } from "react";

const ACCEPTED = {
  "application/pdf": [".pdf"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/webp": [".webp"],
};

function isAccepted(file) {
  return Object.entries(ACCEPTED).some(
    ([mime, exts]) =>
      file.type === mime || exts.some((ext) => file.name.toLowerCase().endsWith(ext))
  );
}

export default function UploadZone({ onFile, error }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files) => {
      const file = files?.[0];
      if (!file) return;
      if (!isAccepted(file)) {
        onFile(null, "That file type isn't supported. Upload a PDF, PNG, JPG, or WEBP.");
        return;
      }
      onFile(file, null);
    },
    [onFile]
  );

  return (
    <div>
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`group relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed px-8 py-16 text-center transition-colors cursor-pointer
          ${isDragging ? "border-scan bg-scan/5" : "border-ink-600 hover:border-ink-600/70 hover:bg-ink-800/40"}`}
      >
        <input
          type="file"
          className="sr-only"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <PageIcon active={isDragging} />
        <div>
          <p className="font-display text-lg text-paper-100">
            {isDragging ? "Drop it" : "Drag a document here"}
          </p>
          <p className="mt-1 text-sm text-muted font-body">
            or click to browse — PDF, PNG, JPG, WEBP
          </p>
        </div>
      </label>
      {error && (
        <p className="mt-3 text-sm text-signal font-body" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function PageIcon({ active }) {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      className={active ? "text-scan" : "text-ink-600 group-hover:text-muted"}
    >
      <rect x="10" y="6" width="28" height="36" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M16 16h16M16 22h16M16 28h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
