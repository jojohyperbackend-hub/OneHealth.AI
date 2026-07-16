// lib/guardrail.ts
// Verifikasi output AI (defense-in-depth, PRD §10) + sanitasi input pasien.
// File ini TIDAK memanggil lib/ai.ts — murni fungsi verifikasi/sanitasi,
// biar tidak ada circular import. Orkestrasi (panggil AI -> verifikasi ->
// retry/fallback) tinggal di lib/index.ts.

import type { JurnalBukti, KondisiTerkait } from "../types/case";
import type { SummarizeEvidenceResult, EducatePatientResult, ChatPatientResult } from "./ai";

export interface GuardResult {
  safe: boolean;
  reason?: string;
}

// ---------------------------------------------------------------------------
// 10.2 (1): Setiap sitasi harus menunjuk jurnal yang benar-benar diretrieve.
// Kode ini persis mengikuti contoh di PRD §10.2 — jangan diubah logikanya
// tanpa kabari tim, ini titik paling kritis dari seluruh guardrail.
// ---------------------------------------------------------------------------

export function verifyCitations(
  kondisi: KondisiTerkait[],
  bukti: JurnalBukti[]
): GuardResult {
  const validIds = new Set(bukti.map((b) => b.id));

  for (const k of kondisi) {
    if (!k.dasar_jurnal || k.dasar_jurnal.length === 0) {
      return { safe: false, reason: `Kondisi "${k.kondisi}" tidak punya dasar_jurnal (kosong)` };
    }
    for (const id of k.dasar_jurnal) {
      if (!validIds.has(id)) {
        return {
          safe: false,
          reason: `Kondisi "${k.kondisi}" menyitasi id "${id}" yang tidak ada di bukti hasil retrieval — sitasi halu`,
        };
      }
    }
  }

  return { safe: true };
}

// ---------------------------------------------------------------------------
// 10.2 (2): Tidak ada angka/DOI asing di narasi — angka tahun/DOI yang
// disebut di teks bebas (ringkasan) harus cocok dengan salah satu bukti.
// Heuristik: ekstrak pola tahun (4 digit, 1900-2099) dan DOI (10.xxxx/...)
// dari teks, lalu cek semua match ada di daftar bukti.
// ---------------------------------------------------------------------------

const YEAR_PATTERN = /\b(19|20)\d{2}\b/g;
const DOI_PATTERN = /\b10\.\d{4,9}\/[^\s"'),.]+/g;

export function verifyNoForeignReferences(
  text: string,
  bukti: JurnalBukti[]
): GuardResult {
  const knownYears = new Set(bukti.map((b) => b.year).filter((y): y is number => y !== null));
  const knownDOIs = new Set(bukti.map((b) => b.doi).filter((d): d is string => d !== null));

  const yearsInText = text.match(YEAR_PATTERN) || [];
  for (const y of yearsInText) {
    if (!knownYears.has(parseInt(y, 10))) {
      return {
        safe: false,
        reason: `Teks menyebut tahun "${y}" yang tidak ada di jurnal manapun yang diretrieve`,
      };
    }
  }

  const doisInText = text.match(DOI_PATTERN) || [];
  for (const d of doisInText) {
    if (!knownDOIs.has(d)) {
      return {
        safe: false,
        reason: `Teks menyebut DOI "${d}" yang tidak ada di jurnal manapun yang diretrieve`,
      };
    }
  }

  return { safe: true };
}

// ---------------------------------------------------------------------------
// 10.2 (3): Kunci terjemahan — DOI & tahun yang tampil di field bukti/sitasi
// tidak boleh berubah dari hasil retrieval asli. Karena bukti[] TIDAK pernah
// disusun ulang oleh AI (hanya ringkasan/kondisi_terkait yang generatif),
// ini cukup dicek dengan membandingkan referensi objek/nilai, bukan re-parse
// teks bebas.
// ---------------------------------------------------------------------------

export function verifyBuktiUnchanged(
  buktiAsli: JurnalBukti[],
  buktiDikirim: JurnalBukti[]
): GuardResult {
  if (buktiAsli.length !== buktiDikirim.length) {
    return { safe: false, reason: "Jumlah bukti berubah dari hasil retrieval asli" };
  }
  for (let i = 0; i < buktiAsli.length; i++) {
    const a = buktiAsli[i];
    const b = buktiDikirim[i];
    if (a.id !== b.id || a.doi !== b.doi || a.year !== b.year || a.title !== b.title) {
      return {
        safe: false,
        reason: `Field jurnal id="${a.id}" berubah (title/doi/year tidak boleh diubah)`,
      };
    }
  }
  return { safe: true };
}

// ---------------------------------------------------------------------------
// Gabungan verifikasi untuk output Alur 1 (summarizeEvidence).
// Dipanggil dari orchestration SEBELUM hasil dikirim ke user (PRD §9).
// Gagal -> fallback ke daftar jurnal mentah tanpa narasi.
// ---------------------------------------------------------------------------

export function verifyEvidenceOutput(
  result: SummarizeEvidenceResult,
  bukti: JurnalBukti[]
): GuardResult {
  if (!result.ringkasan || typeof result.ringkasan !== "string") {
    return { safe: false, reason: "Field ringkasan kosong/tidak valid" };
  }
  if (!Array.isArray(result.kondisi_terkait)) {
    return { safe: false, reason: "Field kondisi_terkait bukan array" };
  }

  const citationCheck = verifyCitations(result.kondisi_terkait, bukti);
  if (!citationCheck.safe) return citationCheck;

  const refCheck = verifyNoForeignReferences(result.ringkasan, bukti);
  if (!refCheck.safe) return refCheck;

  return { safe: true };
}

// ---------------------------------------------------------------------------
// Verifikasi output Alur 2 — edukasi pasien. Tidak ada kondisi_terkait di
// sini (kondisi sudah fix dari nakes), jadi cukup cek referensi asing.
// ---------------------------------------------------------------------------

export function verifyEducationOutput(
  result: EducatePatientResult,
  bukti: JurnalBukti[]
): GuardResult {
  const fields = [result.penyebab, result.bagaimana_terjadi, result.pencegahan_perawatan];
  for (const f of fields) {
    if (!f || typeof f !== "string") {
      return { safe: false, reason: "Salah satu field edukasi kosong/tidak valid" };
    }
    const refCheck = verifyNoForeignReferences(f, bukti);
    if (!refCheck.safe) return refCheck;
  }
  return { safe: true };
}

// ---------------------------------------------------------------------------
// Verifikasi output Alur 2 — chat pasien.
// ---------------------------------------------------------------------------

export function verifyChatOutput(
  result: ChatPatientResult,
  bukti: JurnalBukti[]
): GuardResult {
  if (!result.jawaban || typeof result.jawaban !== "string") {
    return { safe: false, reason: "Field jawaban kosong/tidak valid" };
  }
  if (typeof result.out_of_context !== "boolean") {
    return { safe: false, reason: "Field out_of_context bukan boolean" };
  }
  // Kalau out_of_context, jawaban cuma arahan sopan — tidak perlu dicek
  // referensi jurnal karena memang tidak menjawab dari bukti.
  if (result.out_of_context) return { safe: true };

  return verifyNoForeignReferences(result.jawaban, bukti);
}

// ---------------------------------------------------------------------------
// 10.5 Anti Prompt-Injection — sanitasi pesan pasien SEBELUM masuk prompt.
// Ini lapis pertama (structural). Lapis kedua ada di system prompt lib/ai.ts
// yang memperlakukan pertanyaan sebagai data, bukan instruksi.
// ---------------------------------------------------------------------------

const MAX_INPUT_LENGTH = 500; // PRD §13: batasi panjang string bebas

// Frasa yang sering dipakai untuk mencoba membajak instruksi sistem.
// Bukan filter sempurna — cuma lapis tambahan, deteksi bukan blokir total.
const INJECTION_MARKERS = [
  /abaikan (semua )?instruksi/i,
  /ignore (all )?(previous|above) instructions/i,
  /system prompt/i,
  /you are now/i,
  /kamu sekarang adalah/i,
  /\bpretend (you|to be)\b/i,
  /berpura-pura(lah)? (jadi|menjadi)/i,
];

export interface SanitizeResult {
  sanitized: string;
  suspicious: boolean;
}

export function sanitizePatientInput(raw: string): SanitizeResult {
  // Buang karakter kontrol & null byte, rapikan whitespace berlebih.
  let text = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  text = text.replace(/\s{3,}/g, " ");

  // Potong ke panjang maksimal (anti cost-attack, PRD §13).
  if (text.length > MAX_INPUT_LENGTH) {
    text = text.slice(0, MAX_INPUT_LENGTH);
  }

  const suspicious = INJECTION_MARKERS.some((pattern) => pattern.test(text));

  return { sanitized: text, suspicious };
}

// Validasi generik untuk field free-text lain (gejala, catatan_nakes, dst)
// dipakai di layer validasi request sebelum masuk pipeline (PRD §13).
export function sanitizeFreeText(raw: string, maxLength = MAX_INPUT_LENGTH): string {
  let text = raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "").trim();
  if (text.length > maxLength) text = text.slice(0, maxLength);
  return text;
}