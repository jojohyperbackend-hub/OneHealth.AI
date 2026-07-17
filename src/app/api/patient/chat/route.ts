import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const chatInputSchema = z.object({
  case_id: z.uuid(),
  pertanyaan: z.string().min(1).max(500),
});

function respond(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

export async function POST(req: NextRequest) {
  const parsed = chatInputSchema.safeParse(await req.json());

  if (!parsed.success) {
    return respond(
      { ai_status: 'error', ai_error_code: 'INVALID_INPUT', data: null },
      400,
    );
  }

  const { case_id, pertanyaan } = parsed.data;

  const safeQuestion = sanitizeUserInput(pertanyaan);

  const caseEvidence = await getCaseEvidence(case_id);

  if (!caseEvidence) {
    return respond(
      { ai_status: 'error', ai_error_code: 'NOT_FOUND', data: null },
      404,
    );
  }

  if (caseEvidence.bukti.length === 0) {
    return respond({
      ai_status: 'success',
      ai_error_code: 'EVIDENCE_INSUFFICIENT',
      data: {
        jawaban:
          'Pertanyaan ini belum bisa dijawab dari rujukan yang ada. Silakan hubungi tenaga kesehatan Anda.',
      },
    });
  }

  let ai;
  try {
    ai = await answerPatientQuestion({
      question: safeQuestion,
      bukti: caseEvidence.bukti,
    });
  } catch {
    return respond({
      ai_status: 'error',
      ai_error_code: 'AI_UNAVAILABLE',
      data: null,
    });
  }

  if (ai.outOfContext) {
    return respond({
      ai_status: 'success',
      ai_error_code: 'AI_OUT_OF_CONTEXT',
      data: {
        jawaban:
          'Pertanyaan ini di luar topik kasus Anda. Silakan tanyakan langsung ke tenaga kesehatan.',
      },
    });
  }

  const verified = verifyGuardedOutput(
    ai.kondisi_terkait ?? [],
    caseEvidence.bukti,
  );

  if (!verified.safe) {
    return respond({
      ai_status: 'error',
      ai_error_code: 'AI_INVALID_OUTPUT',
      data: null,
    });
  }

  return respond({
    ai_status: 'success',
    ai_error_code: null,
    data: { jawaban: ai.jawaban },
  });
}
