// lib/embed.ts
// SATU PINTU untuk embedding + scoring relevansi jurnal (PRD §7).
// Panggil OpenRouter HANYA lewat lib/ai.ts (embedTexts) — jangan fetch
// langsung dari sini. File ini murni: embed query + artikel, hitung cosine
// similarity, filter berdasarkan threshold, map ke bentuk JurnalBukti.

import { embedTexts, type AIErrorCode, type AIWrappedResponse } from "./ai";
import type { EuropePMCArticle } from "./retrieval";
import type { JurnalBukti } from "../types/case";

const SNIPPET_MAX_LENGTH = 300; // snippet = kutipan SINGKAT, bukan full abstract

export interface EmbedAndScoreResult {
  passed: JurnalBukti[];
}

function ok(data: EmbedAndScoreResult): AIWrappedResponse<EmbedAndScoreResult> {
  return { ai_status: "success", ai_error_code: null, data };
}

function fail(code: AIErrorCode): AIWrappedResponse<EmbedAndScoreResult> {
  return { ai_status: "error", ai_error_code: code, data: null };
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function toSnippet(abstractText: string): string {
  if (abstractText.length <= SNIPPET_MAX_LENGTH) return abstractText;
  return abstractText.slice(0, SNIPPET_MAX_LENGTH).trimEnd() + "...";
}

// ---------------------------------------------------------------------------
// PUBLIC: embed query + semua artikel dalam 1 batch call, hitung cosine
// similarity per artikel, kembalikan yang lolos threshold (JurnalBukti[]),
// terurut dari paling relevan.
// ---------------------------------------------------------------------------

export async function embedAndScore(
  query: string,
  articles: EuropePMCArticle[],
  threshold: number
): Promise<AIWrappedResponse<EmbedAndScoreResult>> {
  if (articles.length === 0) return ok({ passed: [] });

  // index 0 = query, sisanya = artikel (title + abstract digabung biar
  // embedding menangkap konteks penuh, bukan cuma judul)
  const texts = [
    query,
    ...articles.map((a) => `${a.title}\n${a.abstractText}`),
  ];

  const embedResult = await embedTexts(texts);
  if (embedResult.ai_status === "error" || !embedResult.data) {
    return fail(embedResult.ai_error_code ?? "AI_UNAVAILABLE");
  }

  const [queryVector, ...articleVectors] = embedResult.data;
  if (articleVectors.length !== articles.length) {
    return fail("AI_INVALID_OUTPUT");
  }

  const scored: JurnalBukti[] = articles
    .map((article, i) => ({
      article,
      score: cosineSimilarity(queryVector, articleVectors[i]),
    }))
    .filter(({ score }) => score >= threshold)
    .sort((a, b) => b.score - a.score)
    .map(({ article, score }) => ({
      id: article.id,
      source: article.source,
      title: article.title,
      year: article.year,
      doi: article.doi,
      url: article.url,
      relevance_score: Number(score.toFixed(3)),
      snippet: toSnippet(article.abstractText),
    }));

  return ok({ passed: scored });
}