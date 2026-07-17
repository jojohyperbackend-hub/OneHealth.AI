/**
 * types/case.ts — OneHealth.AI
 * Type contracts sesuai PRDv2 §8 (Kontrak Data) & §10.2 (Guardrail) — kontrak mati.
 *
 * PENTING: Jangan ubah tanpa koordinasi dengan BE/FS (WORKFLOW.md §0 prinsip 1).
 * Field & nama harus match persis §8 PRD — ini bukan draft FE, ini turunan langsung.
 */

// ─── Input ────────────────────────────────────────────────────────────────────

export type JenisKelamin = 'L' | 'P';

// Enum durasi PERSIS sesuai PRD §8 — validasi client-side harus match ini
export type DurasiGejala = 'hari_ini' | '1-3_hari' | '>3_hari' | '>1_minggu';

export interface CaseInput {
  gejala: string;              // free text, wajib, maks 2000 karakter (§13)
  durasi: DurasiGejala;
  umur: number;                 // wajib, 0–150
  jenis_kelamin: JenisKelamin;
  riwayat_paparan?: string;     // opsional — kontak hewan/makanan/perjalanan/dll, maks 1000 karakter
  catatan_nakes?: string;       // opsional, maks 1000 karakter
  case_id: string;              // idempotency key (§13), UUID v4 di-generate client-side
}

// ─── Output ───────────────────────────────────────────────────────────────────

export interface JurnalBukti {
  // `id` tidak eksplisit tercantum di §8 tapi WAJIB untuk verifyCitations() di §10.2
  // (guardrail mencocokkan KondisiTerkait.dasar_jurnal ke bukti.id) — ditambahkan
  // untuk membuat kode contoh guardrail PRD bisa jalan, dicatat di DECISIONS.md.
  id: string;
  source: string;                 // mis. "Europe PMC"
  title: string;
  year: number | null;
  doi: string | null;
  url: string | null;             // full-text link kalau open access
  relevance_score: number;        // cosine similarity, dihitung BE. 0..1
  snippet: string;                // kutipan abstrak SINGKAT (bukan full text)
}

export interface KondisiTerkait {
  kondisi: string;                // nama kondisi yang DISEBUT literatur
  dasar_jurnal: string[];         // id ke JurnalBukti[] — WAJIB terisi, ini yang bikin klaim tersitasi
  // TIDAK ADA field confidence/probability. Ini BUKTI, bukan vonis (§3.1).
}

// Response POST /api/case/analyze
export interface HasilAnalisis {
  ai_status: 'success' | 'error';
  ai_error_code: string | null;   // lihat §9 untuk daftar kode (AI_TIMEOUT, AI_INVALID_OUTPUT, dst)
  evidence_status: 'CUKUP' | 'BUKTI_TIDAK_CUKUP';  // gerbang silence-below-threshold (§3.2)
  bukti: JurnalBukti[];           // daftar jurnal yang LOLOS ambang
  kondisi_terkait: KondisiTerkait[]; // apa yang literatur asosiasikan, tiap item bersitasi
  ringkasan: string;               // Bahasa Indonesia, dari AI
  disclaimer: string;              // "ini bukan diagnosis; keputusan di nakes" — selalu ada
}
