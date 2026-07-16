// types/case.ts
// KONTRAK — jangan ubah field tanpa kabari tim dulu (lihat WORKFLOW.md §0.1)

// Request POST /api/case/analyze
export interface CaseInput {
  gejala: string; // free text, wajib
  durasi: "hari_ini" | "1-3_hari" | ">3_hari" | ">1_minggu";
  umur: number; // wajib
  jenis_kelamin: "L" | "P"; // wajib
  riwayat_paparan?: string; // opsional, free text (kontak hewan/makanan/perjalanan/dll)
  catatan_nakes?: string; // opsional, free text
  case_id: string; // idempotency key (lihat PRD §13)
}

export interface JurnalBukti {
  id: string; // dipakai guardrail.ts untuk verifikasi sitasi (PRD §10.2)
  source: string; // mis. "Europe PMC"
  title: string;
  year: number | null;
  doi: string | null;
  url: string | null; // full-text link kalau open access
  relevance_score: number; // cosine similarity, dihitung BE. 0..1
  snippet: string; // kutipan abstrak SINGKAT (bukan full text)
}

export interface KondisiTerkait {
  kondisi: string; // nama kondisi yang DISEBUT literatur
  dasar_jurnal: string[]; // index/id ke JurnalBukti[] — WAJIB terisi
  // TIDAK ADA field confidence/probability. Ini BUKTI, bukan vonis.
}

// Response POST /api/case/analyze
export interface HasilAnalisis {
  ai_status: "success" | "error";
  ai_error_code: string | null;
  evidence_status: "CUKUP" | "BUKTI_TIDAK_CUKUP"; // gerbang silence-below-threshold
  bukti: JurnalBukti[]; // daftar jurnal yang LOLOS ambang
  kondisi_terkait: KondisiTerkait[]; // apa yang literatur asosiasikan
  ringkasan: string; // Bahasa Indonesia, dari AI
  disclaimer: string; // "ini bukan diagnosis; keputusan di nakes"
}// types/case.ts
// KONTRAK — jangan ubah field tanpa kabari tim dulu (lihat WORKFLOW.md §0.1)

// Request POST /api/case/analyze
export interface CaseInput {
  gejala: string; // free text, wajib
  durasi: "hari_ini" | "1-3_hari" | ">3_hari" | ">1_minggu";
  umur: number; // wajib
  jenis_kelamin: "L" | "P"; // wajib
  riwayat_paparan?: string; // opsional, free text (kontak hewan/makanan/perjalanan/dll)
  catatan_nakes?: string; // opsional, free text
  case_id: string; // idempotency key (lihat PRD §13)
}

export interface JurnalBukti {
  id: string; // dipakai guardrail.ts untuk verifikasi sitasi (PRD §10.2)
  source: string; // mis. "Europe PMC"
  title: string;
  year: number | null;
  doi: string | null;
  url: string | null; // full-text link kalau open access
  relevance_score: number; // cosine similarity, dihitung BE. 0..1
  snippet: string; // kutipan abstrak SINGKAT (bukan full text)
}

export interface KondisiTerkait {
  kondisi: string; // nama kondisi yang DISEBUT literatur
  dasar_jurnal: string[]; // index/id ke JurnalBukti[] — WAJIB terisi
  // TIDAK ADA field confidence/probability. Ini BUKTI, bukan vonis.
}

// Response POST /api/case/analyze
export interface HasilAnalisis {
  ai_status: "success" | "error";
  ai_error_code: string | null;
  evidence_status: "CUKUP" | "BUKTI_TIDAK_CUKUP"; // gerbang silence-below-threshold
  bukti: JurnalBukti[]; // daftar jurnal yang LOLOS ambang
  kondisi_terkait: KondisiTerkait[]; // apa yang literatur asosiasikan
  ringkasan: string; // Bahasa Indonesia, dari AI
  disclaimer: string; // "ini bukan diagnosis; keputusan di nakes"
}