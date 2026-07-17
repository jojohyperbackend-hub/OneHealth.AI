import { EdukasiPasien } from '@/types/patient';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const educateInputSchema = z.object({
  case_id: z.uuid(),
  nakes_confirm: z.literal(true),
});

function respond(
  body:
    | EdukasiPasien
    | { ai_status: 'error'; ai_error_code: string; data: null },
  status = 200,
) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: NextRequest) {
  const parsed = educateInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return respond(
      { ai_status: 'error', ai_error_code: 'INVALID_INPUT', data: null },
      400,
    );
  }

  const { case_id } = parsed.data;
  const caseData = await getCaseWithEvidence(case_id);
  if (!caseData) {
    return respond(
      { ai_status: 'error', ai_error_code: 'NOT_FOUND', data: null },
      404,
    );
  }

  if (caseData.evidence_status !== 'CUKUP' || caseData.bukti.length === 0) {
    return respond(
      {
        ai_status: 'error',
        ai_error_code: 'EVIDENCE_INSUFFICIENT',
        data: null,
      },
      409,
    );
  }

  let ai;
  try {
    ai = await generateEducationContent({
      caseInput: caseData.input,
      bukti: caseData.bukti,
    });
  } catch {
    return respond({
      case_id,
      penyebab: '',
      bagaimana_terjadi: '',
      pencegahan_perawatan: '',
      bukti: caseData.bukti,
      ai_status: 'error',
      ai_error_code: 'AI_UNAVAILABLE',
    });
  }

  const verified = verifyGuardedOutput(
    ai.kondisi_terkait ?? [],
    caseData.bukti,
  );
  if (!verified.safe) {
    return respond({
      case_id,
      penyebab: '',
      bagaimana_terjadi: '',
      pencegahan_perawatan: '',
      bukti: caseData.bukti,
      ai_status: 'error',
      ai_error_code: 'AI_INVALID_OUTPUT',
    });
  }

  const result: EdukasiPasien = {
    case_id,
    penyebab: ai.penyebab,
    bagaimana_terjadi: ai.bagaimana_terjadi,
    pencegahan_perawatan: ai.pencegahan_perawatan,
    bukti: caseData.bukti,
    ai_status: 'success',
    ai_error_code: null,
  };

  await saveEducation(result);

  return respond(result);
}
