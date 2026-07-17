import { extractDashboardInfo } from '@/lib/ai';
import { verifyDashboardOutput } from '@/lib/guardrail';
import { getCaseById } from '@/lib/supabase';
import { InfoDashboardPenyakit } from '@/types/dashboard';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * GET /api/case/dashboard?case_id=xxx
 *
 * Dashboard profil penyakit zoonosis, disusun AI on-demand dari bukti[]
 * yang sudah tersimpan hasil Alur 1 (case/analyze) — TIDAK dipersist ke
 * tabel baru, cukup generate tiap dipanggil (sama seperti pertimbangan
 * kompleksitas di educatePatient, tapi tanpa langkah upsert/save karena
 * ini bukan materi yang dikirim ke pasien).
 */

const querySchema = z.object({
  case_id: z.string().uuid(),
});

function respond(data: InfoDashboardPenyakit, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

// Selalu balikin body ber-shape InfoDashboardPenyakit penuh, termasuk untuk
// error di luar AI (INVALID_INPUT/NOT_FOUND/dst) — samakan dengan pola
// case/analyze/route.ts, biar hook FE tidak perlu union type terpisah.
function errorRespond(caseId: string, code: string, status: number) {
  return respond(
    {
      case_id: caseId,
      summary: '',
      cara_penyebaran: '',
      informasi_hewan: '',
      habitat: null,
      resiko_hewan: '',
      treatment: '',
      bukti: [],
      ai_status: 'error',
      ai_error_code: code,
    },
    status,
  );
}

export async function GET(req: NextRequest) {
  const rawCaseId = req.nextUrl.searchParams.get('case_id') ?? '';
  const parsed = querySchema.safeParse({ case_id: rawCaseId });
  if (!parsed.success) {
    return errorRespond(rawCaseId, 'INVALID_INPUT', 400);
  }

  const { case_id } = parsed.data;

  const caseData = await getCaseById(case_id);
  if (!caseData) {
    return errorRespond(case_id, 'NOT_FOUND', 404);
  }

  if (caseData.evidence_status !== 'CUKUP' || caseData.bukti.length === 0) {
    return errorRespond(case_id, 'EVIDENCE_INSUFFICIENT', 409);
  }

  const ai = await extractDashboardInfo(caseData.bukti);

  if (ai.ai_status === 'error') {
    return respond({
      case_id,
      summary: '',
      cara_penyebaran: '',
      informasi_hewan: '',
      habitat: null,
      resiko_hewan: '',
      treatment: '',
      bukti: caseData.bukti,
      ai_status: 'error',
      ai_error_code: ai.ai_error_code,
    });
  }

  const verified = verifyDashboardOutput(ai.data, caseData.bukti);
  if (!verified.safe) {
    console.error('[case/dashboard] guardrail nolak output AI:', verified.reason);
    return respond({
      case_id,
      summary: '',
      cara_penyebaran: '',
      informasi_hewan: '',
      habitat: null,
      resiko_hewan: '',
      treatment: '',
      bukti: caseData.bukti,
      ai_status: 'error',
      ai_error_code: 'AI_INVALID_OUTPUT',
    });
  }

  return respond({
    case_id,
    summary: ai.data.summary,
    cara_penyebaran: ai.data.cara_penyebaran,
    informasi_hewan: ai.data.informasi_hewan,
    habitat: ai.data.habitat,
    resiko_hewan: ai.data.resiko_hewan,
    treatment: ai.data.treatment,
    bukti: caseData.bukti,
    ai_status: 'success',
    ai_error_code: null,
  });
}
