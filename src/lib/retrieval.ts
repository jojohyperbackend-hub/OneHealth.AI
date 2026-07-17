import { extractKeywords } from './ai';

const EUROPE_PMC_BASE =
  'https://www.ebi.ac.uk/europepmc/webservices/rest/search';

// Batas keyword hasil ekstraksi AI yang boleh nempel ke query PMC (PRD §6.1
// "keyword divalidasi" + §13 — jangan pernah masukin free-text mentah nakes
// ke URL, cegah kebocoran PII/data sensitif lewat query param).
const MAX_KEYWORDS = 8;
const MAX_TERM_LENGTH = 40; // istilah medis pendek — kalau lebih panjang dari
// ini, kemungkinan besar model ngasih kalimat bukan istilah, buang.
// Hanya huruf/angka/spasi/tanda hubung — sama kayak sanitasi buildQueryFromCase
// di bawah, sengaja pola yang sama, bukan aturan baru.
const TERM_CHARSET = /^[\p{L}\p{N}\s-]+$/u;

function validateKeywords(terms: unknown): string[] {
  if (!Array.isArray(terms)) return [];
  return terms
    .filter((t): t is string => typeof t === 'string')
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && t.length <= MAX_TERM_LENGTH && TERM_CHARSET.test(t))
    .slice(0, MAX_KEYWORDS);
}

export interface EuropePMCArticle {
  id: string;
  title: string;
  abstractText: string;
  year: number | null;
  doi: string | null;
  url: string | null;
  source: 'Europe PMC';
}

export class RetrievalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetrievalError';
  }
}

// Shape mentah dari Europe PMC REST API (resultType=core) — hanya field
// yang benar-benar dipakai, sisanya diabaikan TypeScript secara otomatis.
interface EuropePMCRawResult {
  id?: string | number;
  title?: string;
  abstractText?: string;
  pubYear?: string | number;
  doi?: string;
  fullTextUrlList?: {
    fullTextUrl?: Array<{ url?: string }>;
  };
}

interface EuropePMCRawResponse {
  resultList?: {
    result?: EuropePMCRawResult[];
  };
}

// Perilaku lama (pra-keyword-extraction) — sekarang jadi FALLBACK, dipakai
// kalau extractKeywords gagal/timeout/kosong (graceful degradation §3.4).
function sanitizeRawText(gejala: string, riwayatPaparan?: string): string {
  const raw = [gejala, riwayatPaparan ?? ''].filter(Boolean).join(' ');
  return raw.replace(/[^\p{L}\p{N}\s,.-]/gu, '').trim();
}

// PRD §6.1 step 3: query dibentuk dari istilah medis Inggris kanonik hasil
// extractKeywords (lib/ai.ts), BUKAN dari teks mentah nakes langsung — korpus
// Europe PMC berbahasa Inggris, dan gejala Bahasa Indonesia yang ditembak
// mentah balikin 0 hasil (terverifikasi, lihat DECISIONS.md). Kalau
// ekstraksi AI gagal, turun ke sanitizeRawText (masih jalan minimal untuk
// input Inggris) — jangan hard-fail seluruh /api/case/analyze gara-gara satu
// langkah opsional ini.
export async function buildQueryFromCase(input: {
  gejala: string;
  riwayat_paparan?: string;
}): Promise<string> {
  const keywordResult = await extractKeywords(input.gejala, input.riwayat_paparan);

  if (keywordResult.ai_status === 'success') {
    const validTerms = validateKeywords(keywordResult.data.terms);
    if (validTerms.length > 0) {
      return validTerms.join(' ');
    }
  }

  return sanitizeRawText(input.gejala, input.riwayat_paparan);
}

export async function searchEuropePMC(
  query: string,
  opts: { pageSize?: number; timeoutMs?: number } = {},
): Promise<EuropePMCArticle[]> {
  const { pageSize = 15, timeoutMs = 6000 } = opts;

  const params = new URLSearchParams({
    query,
    format: 'json',
    pageSize: String(pageSize),
    resultType: 'core',
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(`${EUROPE_PMC_BASE}?${params}`, {
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!res.ok) throw new RetrievalError(`Europe PMC returned ${res.status}`);

    const json = (await res.json()) as EuropePMCRawResponse;
    const results = json?.resultList?.result ?? [];

    return results
      .filter(
        (r) => typeof r.abstractText === 'string' && r.abstractText.length > 0,
      )
      .map((r) => ({
        id: String(r.id),
        title: r.title ?? 'Untitled',
        abstractText: stripHtml(r.abstractText as string),
        year: r.pubYear ? Number(r.pubYear) : null,
        doi: r.doi ?? null,
        url: r.fullTextUrlList?.fullTextUrl?.[0]?.url ?? null,
        source: 'Europe PMC' as const,
      }));
  } catch (err) {
    if (err instanceof RetrievalError) throw err;
    const timedOut = err instanceof Error && err.name === 'AbortError';
    throw new RetrievalError(
      timedOut ? 'Europe PMC timeout' : 'Europe PMC unreachable',
    );
  } finally {
    clearTimeout(timer);
  }
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, '').trim();
}