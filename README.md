# Brief — Document Summary Assistant

Upload a PDF or a scanned image and get a summary, entirely in your browser.
No backend, no file upload to any server, no API key required by default.

**[Live demo](#)** — [Document Summary Assistant](https://doc-summary-assistant.netlify.app)

## How it works

1. **Upload** — drag-and-drop or file picker, accepts PDF / PNG / JPG / WEBP.
2. **Extract text**
   - PDFs are parsed with [`pdf.js`](https://mozilla.github.io/pdf.js/), which reads the
     embedded text layer directly (no OCR needed for text-based PDFs).
   - Images (and scanned documents saved as images) run through
     [`Tesseract.js`](https://tesseract.projectnaptha.com/), a WASM build of Tesseract OCR
     that runs fully client-side.
3. **Summarize** — by default, an extractive **TextRank** algorithm
   (Mihalcea & Tarau, 2004) implemented from scratch in `src/lib/summarize.js`:
   - Split into sentences → build TF-IDF vectors → score sentence-to-sentence cosine
     similarity → run PageRank over that similarity graph → keep the top-ranked
     sentences, in original order, for the target length.
   - This needs no network call and no API key, so it can't leak a key, hit a rate
     limit, or go down. The highest-scoring sentences also double as the "key points"
     list.
   - Optionally, paste a free [Groq](https://console.groq.com/keys) API key to get an
     **abstractive** (rewritten, not just re-selected) summary instead. The key is
     stored only in your browser's `localStorage`, and the request goes straight from
     your browser to Groq — this app has no server to route it through or store it on.
4. **Read** — a summary length toggle (short / medium / long) re-runs summarization
   against the already-extracted text, so switching lengths is instant.

## Why extractive-by-default

A "smart summary" feature usually means calling an LLM. Doing that from a pure frontend
app means either shipping a secret key to every visitor's browser (a real security
issue) or standing up a server (which this brief explicitly avoids). TextRank
sidesteps the problem: it's a real, well-understood NLP technique — not a wrapper
around someone else's API — and it's transparent enough to explain and debug in a code
review. The optional Groq path is there for anyone who wants an abstractive rewrite and
is fine supplying their own key.

## Tech stack

- React 19 + Vite
- Tailwind CSS
- `pdfjs-dist` for PDF text extraction
- `tesseract.js` for OCR
- No backend, no database, no build-time secrets

## Running locally

```bash
npm install
npm run dev
```

## Building & deploying

```bash
npm run build
```

This outputs a static `dist/` folder — deploy it to Vercel, Netlify, or GitHub Pages
with zero configuration (no environment variables, no server, no functions needed):

- **Vercel**: import the repo, framework preset "Vite", done.
- **Netlify**: build command `npm run build`, publish directory `dist`.

## Known limitations

- OCR accuracy depends on scan quality; low-resolution or skewed photos degrade
  results. The app surfaces Tesseract's confidence score internally but doesn't yet
  gate on it.
- TextRank works best on documents with 8+ sentences of substantive content; very
  short or highly unstructured text (e.g. a form) won't summarize meaningfully.
- Paragraph reconstruction from PDFs uses a vertical-gap heuristic and can misjudge
  complex multi-column layouts.
- The Groq path truncates documents beyond ~24k characters to stay within free-tier
  context limits.

## Project structure

```
src/
  lib/
    pdfExtract.js   # PDF -> text (pdf.js)
    ocrExtract.js   # image -> text (Tesseract.js)
    summarize.js    # TextRank extractive summarizer
    llm.js          # optional Groq abstractive summarizer
  components/
    UploadZone.jsx
    ProcessingView.jsx
    SummaryView.jsx
    SettingsPanel.jsx
  App.jsx
```

## Approach (write-up)

The brief specified a frontend-only app, so the constraint that shaped every decision
was: no server means no place to safely hold an API key. Rather than treat that as a
limit on "smart" summarization, I built a real extractive summarizer — TF-IDF
similarity scored with PageRank (TextRank) — from scratch, so the core feature has no
external dependency, no rate limit, and no failure mode tied to a third-party API being
up. PDF text extraction uses pdf.js's text layer directly; scanned images route through
Tesseract.js, a WASM OCR engine, with live progress reported back to the UI. For anyone
who wants an LLM-rewritten summary instead of extracted sentences, an opt-in panel
accepts a personal Groq key, stored only in `localStorage` and used only for
direct-from-browser calls — this app never sees it. Length options (short/medium/long)
just change how many top-ranked sentences are kept, so switching is instant with no
re-extraction. Every stage — reading, extracting/OCR, summarizing — has its own loading
state and error handling, since the biggest risk in an all-client-side app is a silent
failure the user can't diagnose.
