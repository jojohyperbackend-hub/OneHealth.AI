import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { z } from "zod";
import type { PatientChatInput } from "@/types/patient";
import type { AIWrappedResponse, ChatPatientResult } from "@/lib/ai";
import { chatPatient } from "@/lib/ai";
import { verifyChatOutput, sanitizePatientInput } from "@/lib/guardrail";
import { getCaseById, getCaseIdByPhone, saveChatMessage } from "@/lib/supabase";

/**
 * webhook/whatsapp — Adapter antara Gateway Hermes/Baileys (VPS) <-> backend Next.js.
 *
 * PENTING (§11.2 PRD): Gateway itu PIPA, bukan otak. Dia cuma:
 *   1. Terima pesan WA masuk dari pasien
 *   2. POST ke sini dengan { from: phone, text, message_id, timestamp }
 *   3. Balikin `reply` yang dikembalikan endpoint ini ke WA
 *
 * CATATAN: logic AI+guardrail sengaja DI-INLINE di sini (bukan diekstrak ke
 * lib/patient-chat.ts). Konsekuensinya: kalau app/api/patient/chat/route.ts
 * (fallback panel webapp, §11.3) dibuat nanti, logic yang sama HARUS
 * disalin identik ke sana juga — jangan sampai dua jalur ini drift beda
 * behavior, karena fallback panel itu yang nyelametin demo kalau
 * Baileys/VPS/wifi venue rewel.
 *
 * Auth: shared-secret header (bukan HMAC) — komunikasi internal antar proses
 * yang sama-sama kita kontrol, sesuai §13 "Gateway VPS di-hardening ...
 * HTTPS antar-proses".
 */

const GatewayEventSchema = z.object({
  event: z.literal("message.received"),
  message_id: z.string(),
  from: z.string().min(6), // nomor WA pasien, dinormalisasi di bawah
  text: z.string().max(2000), // §13: batasi panjang string bebas — cegah cost attack
  timestamp: z.number().or(z.string()),
});

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, "");
}

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.HERMES_WEBHOOK_SECRET;
  if (!secret) {
    console.error("HERMES_WEBHOOK_SECRET tidak di-set — menolak semua request.");
    return false;
  }
  const provided =
    req.headers.get("x-hermes-secret") ??
    req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!provided) return false;

  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

const NO_CASE_REPLY =
  "Kami belum menemukan catatan konsultasi aktif untuk nomor ini. Silakan hubungi tenaga kesehatan Anda langsung.";

const OUT_OF_CONTEXT_REPLY =
  "Maaf, pertanyaan ini di luar topik konsultasi Anda. Silakan tanyakan langsung ke tenaga kesehatan Anda.";

const GENERIC_ERROR_REPLY =
  "Maaf, sistem sedang bermasalah menjawab pertanyaan Anda. Silakan coba lagi nanti atau hubungi tenaga kesehatan Anda.";

/**
 * Satu-satunya tempat logic Alur 2 chat dieksekusi (untuk endpoint ini).
 * Urutan: sanitasi -> ambil kasus+bukti -> panggil AI -> verifikasi
 * guardrail -> simpan histori -> return.
 */
async function handleChat(
  caseId: string,
  pertanyaanRaw: string
): Promise<AIWrappedResponse<ChatPatientResult>> {
  const { sanitized } = sanitizePatientInput(pertanyaanRaw);

  const caseData = await getCaseById(caseId);
  if (!caseData) {
    return { ai_status: "error", ai_error_code: "AI_UNAVAILABLE", data: null };
  }

  const konteksKasus = `Gejala: ${caseData.gejala}`;

  const aiResult = await chatPatient(sanitized, caseData.bukti, konteksKasus);
  if (aiResult.ai_status === "error") {
    return aiResult;
  }

  const guard = verifyChatOutput(aiResult.data, caseData.bukti);
  if (!guard.safe) {
    console.error("[webhook/whatsapp] guardrail nolak jawaban chat:", guard.reason);
    return { ai_status: "error", ai_error_code: "AI_INVALID_OUTPUT", data: null };
  }

  // Simpan histori. Kalau gagal, tetap lanjut balas ke pasien — jangan
  // block jawaban gara-gara infra (sama prinsipnya kayak saveCaseResult
  // di app/api/case/analyze/route.ts).
  const savedIn = await saveChatMessage(caseId, null, "pasien", sanitized);
  if (!savedIn.success) {
    console.error("[webhook/whatsapp] gagal simpan pesan pasien:", savedIn.error);
  }
  const savedOut = await saveChatMessage(caseId, null, "sistem", aiResult.data.jawaban, {
    out_of_context: aiResult.data.out_of_context,
    ai_status: "success",
  });
  if (!savedOut.success) {
    console.error("[webhook/whatsapp] gagal simpan jawaban sistem:", savedOut.error);
  }

  return aiResult;
}

/**
 * Mapping hasil chat -> balasan teks WA.
 * out_of_context ditangani lewat field boolean di data (bukan ai_error_code
 * — lihat komentar di lib/ai.ts chatPatient), BUKAN sebagai error path.
 */
function formatReply(result: AIWrappedResponse<ChatPatientResult>): string {
  if (result.ai_status === "success") {
    return result.data.out_of_context ? OUT_OF_CONTEXT_REPLY : result.data.jawaban;
  }

  switch (result.ai_error_code) {
    case "AI_TIMEOUT":
    case "AI_UNAVAILABLE":
    case "AI_QUOTA_EXCEEDED":
    case "AI_INVALID_OUTPUT":
    default:
      return GENERIC_ERROR_REPLY;
  }
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid json" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const parsed = GatewayEventSchema.safeParse(body);
  if (!parsed.success) {
    console.warn("Payload gateway WA tidak sesuai schema:", parsed.error.flatten());
    return NextResponse.json(
      { error: "invalid payload" },
      { status: 422, headers: { "Cache-Control": "no-store" } }
    );
  }

  const evt = parsed.data;
  const phone = normalizePhone(evt.from);

  // TODO (§13 rate limit): endpoint ini memicu AI/retrieval — wajib rate limit
  // per phone/IP sebelum production (mis. Upstash/Vercel KV token bucket).
  // TODO (idempotency): gateway bisa retry -> pertimbangkan dedupe pakai
  // evt.message_id (mis. tabel processed_messages dengan unique constraint)
  // supaya tidak double-charge panggilan AI kalau Hermes retry.

  const caseId = await getCaseIdByPhone(phone);

  if (!caseId) {
    // Tidak ada case yang ke-mapping ke nomor ini -> AI TIDAK dipanggil sama sekali.
    return NextResponse.json(
      { reply: NO_CASE_REPLY },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // Dibentuk sesuai kontrak PatientChatInput (§8), meski dipakai langsung
  // sebagai argumen ke handleChat() -- bukan re-serialize network call.
  const chatInput: PatientChatInput = { case_id: caseId, pertanyaan: evt.text };

  let reply: string;
  try {
    const result = await handleChat(chatInput.case_id, chatInput.pertanyaan);
    reply = formatReply(result);
  } catch (err) {
    // Log minimal, JANGAN log isi pertanyaan/jawaban pasien penuh (§13 data sensitif).
    console.error("handleChat gagal:", { case_id: caseId, message_id: evt.message_id });
    reply = GENERIC_ERROR_REPLY;
  }

  return NextResponse.json({ reply }, { headers: { "Cache-Control": "no-store" } });
}

export async function GET() {
  return NextResponse.json(
    { ok: true, service: "whatsapp-webhook" },
    { headers: { "Cache-Control": "no-store" } }
  );
}