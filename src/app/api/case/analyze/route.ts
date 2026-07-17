import { buildQueryFromCase, searchEuropePMC } from '@/lib/retrieval';
import { HasilAnalisis } from '@/types/case';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RELEVANCE_THRESHOLD = 0.75;
const DISCLAIMER =
  'Ini bukan diagnosis. Keputusan klinis sepenuhnya di tangan tenaga kesehatan.';

const caseInputSchema = z.object({
  gejala: z.string().min(3).max(1000),
  durasi: z.enum(['hari_ini', '1-3_hari', '>3_hari', '>1_minggu']),
  umur: z.number().int().min(0).max(120),
  jenis_kelamin: z.enum(['L', 'P']),
  riwayat_paparan: z.string().max(1000).optional(),
  catatan_nakes: z.string().max(2000).optional(),
  case_id: z.uuid(),
});

function respond(data: HasilAnalisis, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: NextRequest) {
  const parsed = caseInputSchema.safeParse(await req.json());

  if (!parsed.success) {
    return respond(
      {
        ai_status: 'error',
        ai_error_code: 'INVALID_INPUT',
        evidence_status: 'BUKTI_TIDAK_CUKUP',
        bukti: [],
        kondisi_terkait: [],
        ringkasan: '',
        disclaimer: DISCLAIMER,
      },
      400,
    );
  }

  const input = parsed.data;
  const query = buildQueryFromCase(input);

  let articles;
  try {
    articles = await searchEuropePMC(query);
  } catch {
    return respond({
      ai_status: 'error',
      ai_error_code: 'RETRIEVAL_UNAVAILABLE',
      evidence_status: 'BUKTI_TIDAK_CUKUP',
      bukti: [],
      kondisi_terkait: [],
      ringkasan: '',
      disclaimer: DISCLAIMER,
    });
  }

  const { passed } = await embedAndScore(query, articles, RELEVANCE_THRESHOLD);

  if (passed.length === 0) {
    return respond({
      ai_status: 'success',
      ai_error_code: 'EVIDENCE_INSUFFICIENT',
      evidence_status: 'BUKTI_TIDAK_CUKUP',
      bukti: [],
      kondisi_terkait: [],
      ringkasan: '',
      disclaimer: DISCLAIMER,
    });
  }

  let ai;
  try {
    ai = await generateEvidenceSummary({ caseInput: input, bukti: passed });
  } catch {
    return respond({
      ai_status: 'error',
      ai_error_code: 'AI_UNAVAILABLE',
      evidence_status: 'CUKUP',
      bukti: passed,
      kondisi_terkait: [],
      ringkasan: '',
      disclaimer: DISCLAIMER,
    });
  }

  const verified = verifyGuardedOutput(ai.kondisi_terkait, passed);
  if (!verified.safe) {
    return respond({
      ai_status: 'error',
      ai_error_code: 'AI_INVALID_OUTPUT',
      evidence_status: 'CUKUP',
      bukti: passed,
      kondisi_terkait: [],
      ringkasan: '',
      disclaimer: DISCLAIMER,
    });
  }

  const result: HasilAnalisis = {
    ai_status: 'success',
    ai_error_code: null,
    evidence_status: 'CUKUP',
    bukti: passed,
    kondisi_terkait: ai.kondisi_terkait,
    ringkasan: ai.ringkasan,
    disclaimer: DISCLAIMER,
  };

  await saveCase(input, result);
  return respond(result);
}
