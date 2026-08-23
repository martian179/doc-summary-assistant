import { useEffect, useState } from "react";
import UploadZone from "./components/UploadZone";
import ProcessingView from "./components/ProcessingView";
import SummaryView from "./components/SummaryView";
import SettingsPanel from "./components/SettingsPanel";
import { summarize } from "./lib/summarize";

export default function App() {
  const [status, setStatus] = useState("idle");
  const [stage, setStage] = useState(null);
  const [stageDetail, setStageDetail] = useState(null);
  const [error, setError] = useState(null);

  const [fileName, setFileName] = useState(null);
  const [extractedText, setExtractedText] = useState(null);
  const [length, setLength] = useState("medium");
  const [result, setResult] = useState(null);
  const [usedLLM, setUsedLLM] = useState(false);

  const [apiKey, setApiKey] = useState(() => localStorage.getItem("groq_api_key") || "");
  const [useLLM, setUseLLM] = useState(false);

  useEffect(() => {
    localStorage.setItem("groq_api_key", apiKey);
  }, [apiKey]);

  async function handleFile(file, fileError) {
    if (fileError) {
      setError(fileError);
      return;
    }

    setError(null);
    setStatus("processing");
    setFileName(file.name);

    try {
      let text;

      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        setStage("extracting");
        const { extractPdfText } = await import("./lib/pdfExtract");
        const { text: pdfText } = await extractPdfText(file, ({ page, total }) =>
          setStageDetail(`page ${page} of ${total}`)
        );
        text = pdfText;
      } else {
        setStage("ocr");
        const { extractImageText } = await import("./lib/ocrExtract");
        const { text: ocrText } = await extractImageText(file, ({ status: s, progress }) =>
          setStageDetail(`${s} · ${Math.round((progress ?? 0) * 100)}%`)
        );
        text = ocrText;
      }

      setExtractedText(text);
      await runSummary(text, length);
    } catch (err) {
      setError(err.message || "Something went wrong reading that file.");
      setStatus("idle");
    }
  }

  async function runSummary(text, targetLength) {
    setStage("summarizing");
    setStageDetail(null);

    try {
      if (useLLM && apiKey) {
        const { summarizeWithLLM } = await import("./lib/llm");
        const llmSummary = await summarizeWithLLM(text, targetLength, apiKey);
        setResult({ summary: llmSummary, keyPoints: [] });
        setUsedLLM(true);
      } else {
        setResult(summarize(text, targetLength));
        setUsedLLM(false);
      }
      setStatus("done");
    } catch (err) {
      setError(err.message || "Summarization failed.");
      setStatus("idle");
    }
  }

  async function handleLengthChange(newLength) {
    setLength(newLength);
    if (!extractedText) return;
    setStatus("processing");
    await runSummary(extractedText, newLength);
  }

  function handleReset() {
    setStatus("idle");
    setStage(null);
    setStageDetail(null);
    setError(null);
    setFileName(null);
    setExtractedText(null);
    setResult(null);
  }

  return (
    <div className="min-h-screen bg-ink-900 text-paper-100">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 py-12 sm:py-16">
        <header>
          <h1 className="font-display text-3xl sm:text-4xl">Brief</h1>
          <p className="mt-2 text-muted font-body">
            Upload a PDF or a scanned document. Everything - reading, OCR, and summarizing -
            happens in your browser. Nothing is uploaded anywhere.
          </p>
        </header>

        {status === "idle" && (
          <>
            <UploadZone onFile={handleFile} error={error} />
            <SettingsPanel
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
              useLLM={useLLM}
              onUseLLMChange={setUseLLM}
            />
          </>
        )}

        {status === "processing" && (
          <ProcessingView stage={stage} detail={stageDetail} fileName={fileName} />
        )}

        {status === "done" && result && (
          <SummaryView
            fileName={fileName}
            result={result}
            length={length}
            onLengthChange={handleLengthChange}
            onReset={handleReset}
            usedLLM={usedLLM}
          />
        )}
      </div>
    </div>
  );
}
