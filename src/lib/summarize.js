// Extractive summarization via TextRank (Mihalcea & Tarau, 2004).
//
// Why extractive instead of calling an LLM: this app makes no network
// requests and needs no API key, so there's nothing to leak and nothing
// that can rate-limit or go down. The trade-off is that it selects and
// reorders existing sentences rather than writing new ones but the
// algorithm is transparent, and sentence importance scores double as the
// key points highlighting feature for free.

const STOPWORDS = new Set(
  (
    "a about above after again against all am an and any are aren't as at be " +
    "because been before being below between both but by can't cannot could " +
    "couldn't did didn't do does doesn't doing don't down during each few for " +
    "from further had hadn't has hasn't have haven't having he he'd he'll " +
    "he's her here here's hers herself him himself his how how's i i'd i'll " +
    "i'm i've if in into is isn't it it's its itself let's me more most " +
    "mustn't my myself no nor not of off on once only or other ought our ours " +
    "ourselves out over own same shan't she she'd she'll she's should " +
    "shouldn't so some such than that that's the their theirs them themselves " +
    "then there there's these they they'd they'll they're they've this those " +
    "through to too under until up very was wasn't we we'd we'll we're we've " +
    "were weren't what what's when when's where where's which while who who's " +
    "whom why why's with won't would wouldn't you you'd you'll you're you've " +
    "your yours yourself yourselves"
  ).split(" ")
);

function splitSentences(text) {
  // Handles common abbreviations (Mr., e.g., U.S.) reasonably well by
  // requiring the sentence boundary to be followed by whitespace + a
  // capital letter or end of string.
  const normalized = text.replace(/\s+/g, " ").trim();
  const raw = normalized.match(/[^.!?]+[.!?]+(?=\s+[A-Z"']|\s*$)|[^.!?]+$/g) || [];
  return raw.map((s) => s.trim()).filter((s) => s.split(" ").length >= 4);
}

function tokenize(sentence) {
  return sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

function buildTfIdfVectors(tokenizedSentences) {
  const df = new Map();
  for (const tokens of tokenizedSentences) {
    for (const term of new Set(tokens)) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }
  const N = tokenizedSentences.length;

  return tokenizedSentences.map((tokens) => {
    const tf = new Map();
    for (const term of tokens) tf.set(term, (tf.get(term) || 0) + 1);
    const vec = new Map();
    for (const [term, count] of tf) {
      const idf = Math.log((N + 1) / (df.get(term) + 1)) + 1;
      vec.set(term, (count / tokens.length) * idf);
    }
    return vec;
  });
}

function cosineSimilarity(vecA, vecB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [term, weight] of vecA) {
    normA += weight * weight;
    if (vecB.has(term)) dot += weight * vecB.get(term);
  }
  for (const weight of vecB.values()) normB += weight * weight;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function pageRank(similarityMatrix, { damping = 0.85, iterations = 40, tolerance = 1e-5 } = {}) {
  const n = similarityMatrix.length;
  if (n === 0) return [];

  const outWeightSums = similarityMatrix.map((row) => row.reduce((a, b) => a + b, 0));
  let scores = new Array(n).fill(1 / n);

  for (let iter = 0; iter < iterations; iter++) {
    const next = new Array(n).fill((1 - damping) / n);
    let delta = 0;

    for (let i = 0; i < n; i++) {
      let incoming = 0;
      for (let j = 0; j < n; j++) {
        if (j === i || outWeightSums[j] === 0) continue;
        incoming += (similarityMatrix[j][i] / outWeightSums[j]) * scores[j];
      }
      next[i] += damping * incoming;
      delta += Math.abs(next[i] - scores[i]);
    }

    scores = next;
    if (delta < tolerance) break;
  }

  return scores;
}

const LENGTH_RATIOS = {
  short: 0.12,
  medium: 0.25,
  long: 0.4,
};

/**
 * @param {string} text - Raw extracted document text.
 * @param {"short"|"medium"|"long"} length
 * @returns {{ summary: string, keyPoints: string[], sentenceCount: number, compressionRatio: number }}
 */
export function summarize(text, length = "medium") {
  const sentences = splitSentences(text);

  if (sentences.length < 4) {
    // Too short to meaningfully rank — just return it as-is.
    return {
      summary: sentences.join(" "),
      keyPoints: sentences,
      sentenceCount: sentences.length,
      compressionRatio: 1,
    };
  }

  const tokenized = sentences.map(tokenize);
  const vectors = buildTfIdfVectors(tokenized);

  const n = sentences.length;
  const similarity = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const sim = cosineSimilarity(vectors[i], vectors[j]);
      similarity[i][j] = sim;
      similarity[j][i] = sim;
    }
  }

  const scores = pageRank(similarity);

  const ranked = scores
    .map((score, index) => ({ score, index }))
    .sort((a, b) => b.score - a.score);

  const ratio = LENGTH_RATIOS[length] ?? LENGTH_RATIOS.medium;
  const targetCount = Math.max(3, Math.min(n, Math.round(n * ratio)));

  const selected = ranked.slice(0, targetCount).sort((a, b) => a.index - b.index);
  const topFive = ranked.slice(0, Math.min(5, targetCount)).sort((a, b) => a.index - b.index);

  return {
    summary: selected.map((s) => sentences[s.index]).join(" "),
    keyPoints: topFive.map((s) => sentences[s.index]),
    sentenceCount: selected.length,
    compressionRatio: Number((selected.length / n).toFixed(2)),
  };
}
