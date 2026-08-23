import { useState } from "react";

export default function SettingsPanel({ apiKey, onApiKeyChange, useLLM, onUseLLMChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-ink-700">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm text-muted font-body"
      >
        <span>On-device summary (default) · optional AI rewrite</span>
        <span className="font-mono text-xs">{open ? "hide" : "configure"}</span>
      </button>

      {open && (
        <div className="flex flex-col gap-3 border-t border-ink-700 px-4 py-4">
          <label className="flex items-center gap-2 text-sm text-paper-200 font-body">
            <input
              type="checkbox"
              checked={useLLM}
              onChange={(e) => onUseLLMChange(e.target.checked)}
              className="accent-scan"
            />
            Rewrite with Groq (needs your own free API key)
          </label>

          {useLLM && (
            <div>
              <input
                type="password"
                placeholder="gsk_… (your Groq API key)"
                value={apiKey}
                onChange={(e) => onApiKeyChange(e.target.value)}
                className="w-full rounded-md bg-ink-800 border border-ink-600 px-3 py-2 text-sm text-paper-100 font-mono placeholder:text-ink-600 focus:outline-none focus:ring-2 focus:ring-scan"
              />
              <p className="mt-2 text-xs text-ink-600 font-body leading-relaxed">
                Stored only in this browser's local storage. Sent directly from your browser to
                Groq's API — never touches this app's servers, because it doesn't have any. Get a
                free key at{" "}
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-scan underline"
                >
                  console.groq.com/keys
                </a>
                .
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
