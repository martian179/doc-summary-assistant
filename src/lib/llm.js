// Optional abstractive summarization path. The extractive TextRank
// summarizer (summarize.js) is the default and requires nothing from the
// user. If they want a rewritten (not just re-selected) summary, they can
// paste their own free-tier Groq API key — stored only in localStorage,
// sent only from their own browser directly to Groq. This app's own
// deployment never sees or stores it.

const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.1-8b-instant";

const LENGTH_INSTRUCTIONS = {
  short: "in 2-3 sentences",
  medium: "in a single tight paragraph (5-7 sentences)",
  long: "in 2-3 paragraphs, covering all major sections",
};

/**
 * @param {string} text
 * @param {"short"|"medium"|"long"} length
 * @param {string} apiKey
 * @returns {Promise<string>}
 */
export async function summarizeWithLLM(text, length, apiKey) {
  if (!apiKey) throw new Error("No API key provided.");

  // Groq's free tier context is generous but not unlimited — trim very
  // long documents rather than failing outright.
  const truncated = text.length > 24000 ? text.slice(0, 24000) + "\n\n[...truncated]" : text;

  const response = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You summarize documents accurately and concisely. Never invent facts not present in the source text.",
        },
        {
          role: "user",
          content: `Summarize the following document ${LENGTH_INSTRUCTIONS[length] ?? LENGTH_INSTRUCTIONS.medium}:\n\n${truncated}`,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    if (response.status === 401) throw new Error("Invalid Groq API key.");
    if (response.status === 429) throw new Error("Rate limited by Groq — try again shortly, or use the on-device summary.");
    throw new Error(`Groq request failed (${response.status}).`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned an empty response.");
  return content.trim();
}
