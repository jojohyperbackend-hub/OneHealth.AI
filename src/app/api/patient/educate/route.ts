import { educatePatient } from '@/lib/ai';
import { verifyEducationOutput } from '@/lib/guardrail';
import {
  getCaseById,
  upsertPatient,
  savePatientEducation,
  markCaseStatus,
} from '@/lib/supabase';
import { EdukasiPasien } from '@/types/patient';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * POST /api/patient/educate
 *
 * DEPENDENCY BELUM SELESAI (dicatat, bukan di-fix diam-diam): `case_id` di
 * sini diasumsikan sama dengan primary key `cases.id`. Tapi response
 * /api/case/analyze (HasilAnalisis) SAAT INI tidak mengembalikan `case_id`
 * sama sekali ke FE. Sebelum route ini bisa dipanggil FE end-to-end, salah
 * satu harus terjadi:
 *   (a) tambah field `case_id` ke HasilAnalisis, ATAU
 *   (b) ubah saveCaseResult() supaya `cases.id` = client_case_id yang FE
 *       kirim (bukan generate UUID baru di server).
 * Ini keputusan yang harus dikonfirmasi ke pemilik types/case.ts sebelum
 * di-merge, bukan sesuatu yang diubah sepihak di sini.
 */

const educateInputSchema = z.object({
  case_id: z.string().uuid(),
  // Kondisi yang di-confirm nakes buat dijadiin materi edukasi pasien.
  // WAJIB salah satu dari kondisi_terkait hasil analisis (divalidasi di
  // bawah) — bukan free text bebas, biar gak bypass guardrail evidence.
  kondisi: z.string().min(1).max(200),
  nakes_confirm: z.literal(true),
  // FIX bug #2: tanpa ini, savePatientEducation() selalu silent no-op
  // karena row di tabel `patients` belum pernah dibuat, dan
  // getCaseIdByPhone() di webhook WA akan selalu return null.
  phone: z.string().min(6).max(20),
  nama: z.string().max(100).optional(),
});

type ErrorBody = { ai_status: 'error'; ai_error_code: string; data: null };

function respond(body: EdukasiPasien | ErrorBody, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function errorRespond(code: string, status: number) {
  return respond({ ai_status: 'error', ai_error_code: code, data: null }, status);
}

export async function POST(req: NextRequest) {
  const parsed = educateInputSchema.safeParse(await req.json());
  if (!parsed.success) {
    return errorRespond('INVALID_INPUT', 400);
  }

  const { case_id, kondisi, phone, nama } = parsed.data;

  const caseData = await getCaseById(case_id);
  if (!caseData) {
    return errorRespond('NOT_FOUND', 404);
  }

  if (caseData.evidence_status !== 'CUKUP' || caseData.bukti.length === 0) {
    return errorRespond('EVIDENCE_INSUFFICIENT', 409);
  }

  // Pastikan kondisi yang dikonfirmasi nakes memang salah satu hasil
  // analisis — cegah FE/nakes ngirim kondisi di luar apa yang literatur
  // asosiasikan (itu udah lewat guardrail waktu analyze, jangan dilewati
  // di sini).
  const kondisiValid = caseData.kondisi_terkait.some((k) => k.kondisi === kondisi);
  if (!kondisiValid) {
    return errorRespond('KONDISI_NOT_IN_ANALYSIS', 422);
  }

  // FIX bug #2: pastikan row `patients` ada SEBELUM savePatientEducation()
  // dipanggil, karena savePatientEducation() cuma .update() (bukan upsert)
  // — kalau row belum ada, update itu silent no-op (0 rows affected, tapi
  // tidak error), dan data edukasi HILANG tanpa ketahuan.
  const patientResult = await upsertPatient(case_id, phone, nama);
  if (!patientResult.success) {
    console.error('[patient/educate] upsertPatient gagal:', patientResult.error);
    return errorRespond('PATIENT_SAVE_FAILED', 500);
  }

  const ai = await educatePatient(kondisi, caseData.bukti);

  if (ai.ai_status === 'error') {
    await savePatientEducation(
      case_id,
      { penyebab: '', bagaimana_terjadi: '', pencegahan_perawatan: '' },
      'error',
      ai.ai_error_code,
    );

    return respond({
      case_id,
      penyebab: '',
      bagaimana_terjadi: '',
      pencegahan_perawatan: '',
      bukti: caseData.bukti,
      ai_status: 'error',
      ai_error_code: ai.ai_error_code,
    });
  }

  const verified = verifyEducationOutput(ai.data, caseData.bukti);
  if (!verified.safe) {
    console.error('[patient/educate] guardrail nolak output AI:', verified.reason);

    await savePatientEducation(
      case_id,
      { penyebab: '', bagaimana_terjadi: '', pencegahan_perawatan: '' },
      'error',
      'AI_INVALID_OUTPUT',
    );

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
    penyebab: ai.data.penyebab,
    bagaimana_terjadi: ai.data.bagaimana_terjadi,
    pencegahan_perawatan: ai.data.pencegahan_perawatan,
    bukti: caseData.bukti,
    ai_status: 'success',
    ai_error_code: null,
  };

  const saved = await savePatientEducation(
    case_id,
    {
      penyebab: result.penyebab,
      bagaimana_terjadi: result.bagaimana_terjadi,
      pencegahan_perawatan: result.pencegahan_perawatan,
    },
    'success',
    null,
  );
  if (!saved.success) {
    console.error('[patient/educate] savePatientEducation gagal:', saved.error);
  }

  const marked = await markCaseStatus(case_id, 'edukasi_terkirim');
  if (!marked.success) {
    console.error('[patient/educate] markCaseStatus gagal:', marked.error);
  }

  return respond(result);
}