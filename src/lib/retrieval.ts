const EUROPE_PMC_BASE =
  'https://www.ebi.ac.uk/europepmc/webservices/rest/search';

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

export function buildQueryFromCase(input: {
  gejala: string;
  riwayat_paparan?: string;
}): string {
  const raw = [input.gejala, input.riwayat_paparan ?? '']
    .filter(Boolean)
    .join(' ');
  return raw.replace(/[^\p{L}\p{N}\s,.-]/gu, '').trim();
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