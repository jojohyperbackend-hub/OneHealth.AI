// lib/supabase.ts
// SATU PINTU akses Supabase (BE scope per WORKFLOW.md §0, tapi dibuat di sini
// karena solo/gabung role). Semua route/orchestration WAJIB lewat sini —
// jangan import supabase-js langsung dari route.ts atau komponen.
//
// Dipakai server-side saja (service_role key). Lihat supabase/schema.sql
// untuk struktur tabel — file ini harus tetap sinkron kalau schema berubah.

import { createClient } from "@supabase/supabase-js";
import type { CaseInput, HasilAnalisis, JurnalBukti, KondisiTerkait } from "../types/case";
import type { EdukasiPasien } from "../types/patient";

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  // Jangan throw di module scope (biar build tidak gagal tanpa env),
  // tapi log keras — ini blocking buat semua fungsi di bawah.
  console.error("[lib/supabase.ts] NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY belum diisi di .env.local");
}

// service_role key -> bypass RLS. JANGAN PERNAH expose client ini ke browser.
export const supabaseAdmin = createClient(
  SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY || "",
  { auth: { persistSession: false } }
);

// ---------------------------------------------------------------------------
// Row types (bentuk mentah dari DB — internal, di-map ke types/*.ts publik
// sebelum dikembalikan ke pemanggil)
// ---------------------------------------------------------------------------

interface CaseRow {
  id: string;
  client_case_id: string;
  gejala: string;
  durasi: string;
  umur: number;
  jenis_kelamin: string;
  riwayat_paparan: string | null;
  catatan_nakes: string | null;
  ai_status: string | null;
  ai_error_code: string | null;
  evidence_status: string | null;
  ringkasan: string | null;
  kondisi_terkait: KondisiTerkait[];
  status: string;
  created_at: string;
  updated_at: string;
}

interface BuktiRow {
  id: string; // PK internal (UUID) — TIDAK dipakai sebagai JurnalBukti.id
  external_id: string; // ID artikel Europe PMC — ini yang dipetakan ke JurnalBukti.id
  case_id: string;
  source: string;
  title: string;
  year: number | null;
  doi: string | null;
  url: string | null;
  relevance_score: number;
  snippet: string;
}

interface PatientRow {
  id: string;
  case_id: string;
  phone: string;
  name: string | null;
  penyebab: string | null;
  bagaimana_terjadi: string | null;
  pencegahan_perawatan: string | null;
  edukasi_ai_status: string | null;
  edukasi_ai_error_code: string | null;
}

// ---------------------------------------------------------------------------
// Mapper: BuktiRow -> JurnalBukti (kontrak types/case.ts)
// ---------------------------------------------------------------------------

function toJurnalBukti(row: BuktiRow): JurnalBukti {
  return {
    id: row.external_id,
    source: row.source,
    title: row.title,
    year: row.year,
    doi: row.doi,
    url: row.url,
    relevance_score: row.relevance_score,
    snippet: row.snippet,
  };
}

// ---------------------------------------------------------------------------
// ALUR 1 — Simpan kasus + bukti (PRD §6.1 step 10)
// ---------------------------------------------------------------------------

export interface SaveCaseResult {
  success: boolean;
  case_id: string | null;
  error?: string;
}

// Idempotent lewat client_case_id (PRD §13). Kalau case_id sudah pernah
// disimpan, return case_id yang sudah ada, jangan insert dobel.
export async function saveCaseResult(
  input: CaseInput,
  hasil: HasilAnalisis,
  buktiLolos: JurnalBukti[]
): Promise<SaveCaseResult> {
  // Cek dulu apakah client_case_id sudah pernah masuk (idempotency).
  const { data: existing, error: existingErr } = await supabaseAdmin
    .from("cases")
    .select("id")
    .eq("client_case_id", input.case_id)
    .maybeSingle();

  if (existingErr) {
    return { success: false, case_id: null, error: existingErr.message };
  }
  if (existing) {
    return { success: true, case_id: existing.id };
  }

  const { data: inserted, error: insertErr } = await supabaseAdmin
    .from("cases")
    .insert({
      // FIX (case_id gap): id = client_case_id, BUKAN dibiarkan auto-generate.
      // Alasan: HasilAnalisis (kontrak types/case.ts) sengaja TIDAK membawa
      // balik case_id ke FE, jadi satu-satunya cara FE tetap tau `cases.id`
      // buat dipanggil ulang di /api/patient/educate adalah kalau id-nya
      // SAMA PERSIS dengan case_id yang FE generate sendiri sebelum submit
      // (lihat useCase.ts — case_id itu sudah dilacak client-side, tinggal
      // dipakai). Konsekuensi: kolom client_case_id di bawah jadi selalu
      // sama dengan id, tapi dibiarkan (bukan kolom yang salah, cuma redundan).
      id: input.case_id,
      client_case_id: input.case_id,
      gejala: input.gejala,
      durasi: input.durasi,
      umur: input.umur,
      jenis_kelamin: input.jenis_kelamin,
      riwayat_paparan: input.riwayat_paparan ?? null,
      catatan_nakes: input.catatan_nakes ?? null,
      ai_status: hasil.ai_status,
      ai_error_code: hasil.ai_error_code,
      evidence_status: hasil.evidence_status,
      ringkasan: hasil.ringkasan,
      kondisi_terkait: hasil.kondisi_terkait,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { success: false, case_id: null, error: insertErr?.message ?? "insert cases gagal" };
  }

  if (buktiLolos.length > 0) {
    // id (PK) sengaja TIDAK di-set di sini — biar DB auto-generate UUID-nya
    // sendiri (default gen_random_uuid()). external_id = ID artikel Europe
    // PMC, unik per (case_id, external_id) — BUKAN unik global, jadi artikel
    // yang sama boleh disitasi di banyak kasus (lihat
    // supabase/migrations/fix_bukti_pkey.sql).
    const { error: buktiErr } = await supabaseAdmin.from("bukti").insert(
      buktiLolos.map((b) => ({
        external_id: b.id,
        case_id: inserted.id,
        source: b.source,
        title: b.title,
        year: b.year,
        doi: b.doi,
        url: b.url,
        relevance_score: b.relevance_score,
        snippet: b.snippet,
      }))
    );
    if (buktiErr) {
      return { success: false, case_id: inserted.id, error: buktiErr.message };
    }
  }

  return { success: true, case_id: inserted.id };
}

// ---------------------------------------------------------------------------
// Ambil kasus + bukti-nya (dipakai Alur 2: educate perlu bukti yang sama)
// ---------------------------------------------------------------------------

export interface CaseWithBukti {
  id: string;
  gejala: string;
  evidence_status: string | null;
  kondisi_terkait: KondisiTerkait[];
  bukti: JurnalBukti[];
}

export async function getCaseById(caseId: string): Promise<CaseWithBukti | null> {
  const { data: caseRow, error: caseErr } = await supabaseAdmin
    .from("cases")
    .select("id, gejala, evidence_status, kondisi_terkait")
    .eq("id", caseId)
    .maybeSingle();

  if (caseErr || !caseRow) return null;

  const { data: buktiRows, error: buktiErr } = await supabaseAdmin
    .from("bukti")
    .select("*")
    .eq("case_id", caseId);

  if (buktiErr) return null;

  return {
    id: caseRow.id,
    gejala: caseRow.gejala,
    evidence_status: caseRow.evidence_status,
    kondisi_terkait: caseRow.kondisi_terkait ?? [],
    bukti: (buktiRows ?? []).map(toJurnalBukti),
  };
}

export async function markCaseStatus(
  caseId: string,
  status: "draft" | "selesai" | "edukasi_terkirim"
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin.from("cases").update({ status }).eq("id", caseId);
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ---------------------------------------------------------------------------
// ALUR 2 — Patients & edukasi (PRD §6.2 step 1-2)
// ---------------------------------------------------------------------------

export async function upsertPatient(
  caseId: string,
  phone: string,
  name?: string
): Promise<{ success: boolean; patient_id: string | null; error?: string }> {
  const { data, error } = await supabaseAdmin
    .from("patients")
    .upsert(
      { case_id: caseId, phone, name: name ?? null },
      { onConflict: "phone" }
    )
    .select("id")
    .single();

  if (error || !data) {
    return { success: false, patient_id: null, error: error?.message ?? "upsert patients gagal" };
  }
  return { success: true, patient_id: data.id };
}

export async function savePatientEducation(
  caseId: string,
  edukasi: { penyebab: string; bagaimana_terjadi: string; pencegahan_perawatan: string },
  aiStatus: "success" | "error",
  aiErrorCode: string | null
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin
    .from("patients")
    .update({
      penyebab: edukasi.penyebab,
      bagaimana_terjadi: edukasi.bagaimana_terjadi,
      pencegahan_perawatan: edukasi.pencegahan_perawatan,
      edukasi_ai_status: aiStatus,
      edukasi_ai_error_code: aiErrorCode,
    })
    .eq("case_id", caseId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getPatientEducation(caseId: string): Promise<EdukasiPasien | null> {
  const { data: patientRow, error: patientErr } = await supabaseAdmin
    .from("patients")
    .select("*")
    .eq("case_id", caseId)
    .maybeSingle();

  if (patientErr || !patientRow) return null;
  if (!patientRow.penyebab) return null; // edukasi belum pernah dibuat

  const caseWithBukti = await getCaseById(caseId);
  if (!caseWithBukti) return null;

  return {
    case_id: caseId,
    penyebab: patientRow.penyebab,
    bagaimana_terjadi: patientRow.bagaimana_terjadi ?? "",
    pencegahan_perawatan: patientRow.pencegahan_perawatan ?? "",
    bukti: caseWithBukti.bukti,
    ai_status: (patientRow.edukasi_ai_status as "success" | "error") ?? "error",
    ai_error_code: patientRow.edukasi_ai_error_code,
  };
}

// Dipakai webhook WhatsApp: mapping nomor telepon -> case_id (PRD §11).
export async function getCaseIdByPhone(phone: string): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("patients")
    .select("case_id")
    .eq("phone", phone)
    .maybeSingle();

  if (error || !data) return null;
  return data.case_id;
}

// ---------------------------------------------------------------------------
// Chat history (dipakai panel fallback DAN webhook WA, PRD §11.3)
// ---------------------------------------------------------------------------

export interface ChatMessageRecord {
  sender: "pasien" | "sistem";
  message: string;
  out_of_context: boolean | null;
  created_at: string;
}

export async function saveChatMessage(
  caseId: string,
  patientId: string | null,
  sender: "pasien" | "sistem",
  message: string,
  meta?: { out_of_context?: boolean; ai_status?: "success" | "error"; ai_error_code?: string | null }
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabaseAdmin.from("chat_messages").insert({
    case_id: caseId,
    patient_id: patientId,
    sender,
    message,
    out_of_context: meta?.out_of_context ?? null,
    ai_status: meta?.ai_status ?? null,
    ai_error_code: meta?.ai_error_code ?? null,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getChatHistory(
  caseId: string,
  limit = 50
): Promise<ChatMessageRecord[]> {
  const { data, error } = await supabaseAdmin
    .from("chat_messages")
    .select("sender, message, out_of_context, created_at")
    .eq("case_id", caseId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error || !data) return [];
  return data as ChatMessageRecord[];
}