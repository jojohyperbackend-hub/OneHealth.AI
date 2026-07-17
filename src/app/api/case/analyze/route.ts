//  ini app/api/case/analyze/route.ts
import {
  buildQueryFromCase,
  searchEuropePMC,
  RetrievalError,
} from '@/lib/retrieval';
import { embedAndScore } from '@/lib/embed';
import { summarizeEvidence, type AIErrorCode } from '@/lib/ai';
import { verifyEvidenceOutput } from '@/lib/guardrail';
import { saveCaseResult } from '@/lib/supabase';
import { HasilAnalisis } from '@/types/case';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const RELEVANCE_THRESHOLD = 0.75;
const DISCLAIMER =
  'Ini bukan diagnosis. Keputusan klinis sepenuhnya di tangan tenaga kesehatan.';

// umur sengaja TIDAK dibatasi max di Zod — batas atas (130) sudah
// di-enforce oleh DB constraint (schema.sql: check umur <= 130).
// Hindari duplikasi aturan bisnis di dua tempat.
const caseInputSchema = z.object({
  gejala: z.string().min(3).max(1000),
  durasi: z.enum(['hari_ini', '1-3_hari', '>3_hari', '>1_minggu']),
  umur: z.number().int().min(0),
  jenis_kelamin: z.enum(['L', 'P']),
  riwayat_paparan: z.string().max(1000).optional(),
  catatan_nakes: z.string().max(2000).optional(),
  case_id: z.string().uuid(),
});

function respond(data: HasilAnalisis, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

// Mapping kode error AI internal -> HTTP status yang jujur ke caller,
// biar monitoring/FE bisa bedain "sistem lagi ngadat" vs "sukses".
function statusForAIError(code: AIErrorCode): number {
  switch (code) {
    case 'AI_TIMEOUT':
      return 504;
    case 'AI_QUOTA_EXCEEDED':
      return 429;
    case 'AI_INVALID_OUTPUT':
      return 422;
    case 'AI_UNAVAILABLE':
    default:
      return 502;
  }
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

  // -- 1. Retrieval (Europe PMC) --------------------------------------------
  let articles;
  try {
    articles = await searchEuropePMC(query);
  } catch (err) {
    const message = err instanceof RetrievalError ? err.message : 'unknown';
    console.error('[case/analyze] retrieval gagal:', message);
    return respond(
      {
        ai_status: 'error',
        ai_error_code: 'RETRIEVAL_UNAVAILABLE',
        evidence_status: 'BUKTI_TIDAK_CUKUP',
        bukti: [],
        kondisi_terkait: [],
        ringkasan: '',
        disclaimer: DISCLAIMER,
      },
      502,
    );
  }

  // -- 2. Embed + filter berdasarkan ambang relevansi -----------------------
  const scoreResult = await embedAndScore(query, articles, RELEVANCE_THRESHOLD);

  if (scoreResult.ai_status === 'error') {
    return respond(
      {
        ai_status: 'error',
        ai_error_code: scoreResult.ai_error_code,
        evidence_status: 'BUKTI_TIDAK_CUKUP',
        bukti: [],
        kondisi_terkait: [],
        ringkasan: '',
        disclaimer: DISCLAIMER,
      },
      statusForAIError(scoreResult.ai_error_code),
    );
  }

  const passed = scoreResult.data.passed;

  if (passed.length === 0) {
    // Proses jalan normal, cuma gak ada jurnal yang lolos ambang relevansi.
    // ai_status tetap 'success' -> ai_error_code null. evidence_status
    // sudah cukup buat FE tahu ini "silence below threshold", bukan error.
    return respond({
      ai_status: 'success',
      ai_error_code: null,
      evidence_status: 'BUKTI_TIDAK_CUKUP',
      bukti: [],
      kondisi_terkait: [],
      ringkasan: '',
      disclaimer: DISCLAIMER,
    });
  }

  // -- 3. Rangkum bukti via LLM ----------------------------------------------
  const aiResult = await summarizeEvidence(input, passed);

  if (aiResult.ai_status === 'error') {
    return respond(
      {
        ai_status: 'error',
        ai_error_code: aiResult.ai_error_code,
        evidence_status: 'CUKUP',
        bukti: passed,
        kondisi_terkait: [],
        ringkasan: '',
        disclaimer: DISCLAIMER,
      },
      statusForAIError(aiResult.ai_error_code),
    );
  }

  // -- 4. Guardrail: verifikasi sitasi & referensi asing ---------------------
  const guard = verifyEvidenceOutput(aiResult.data, passed);
  if (!guard.safe) {
    console.error('[case/analyze] guardrail nolak output AI:', guard.reason);
    return respond(
      {
        ai_status: 'error',
        ai_error_code: 'AI_INVALID_OUTPUT',
        evidence_status: 'CUKUP',
        bukti: passed,
        kondisi_terkait: [],
        ringkasan: '',
        disclaimer: DISCLAIMER,
      },
      422,
    );
  }

  const result: HasilAnalisis = {
    ai_status: 'success',
    ai_error_code: null,
    evidence_status: 'CUKUP',
    bukti: passed,
    kondisi_terkait: aiResult.data.kondisi_terkait,
    ringkasan: aiResult.data.ringkasan,
    disclaimer: DISCLAIMER,
  };

  // -- 5. Simpan ke Supabase ---------------------------------------------
  // Analisis sudah valid & lolos guardrail di titik ini — kalau save gagal,
  // tetap kembalikan hasil ke nakes (jangan blok kerja klinis gara-gara
  // infra), tapi log keras biar ketahuan & bisa di-reconcile manual.
  const saved = await saveCaseResult(input, result, passed);
  if (!saved.success) {
    console.error('[case/analyze] saveCaseResult gagal:', saved.error);
  }

  return respond(result);
}