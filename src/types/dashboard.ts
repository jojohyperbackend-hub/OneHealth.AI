// types/dashboard.ts
// KONTRAK — jangan ubah field tanpa kabari tim dulu (lihat WORKFLOW.md §0.1)
// Fitur baru: dashboard profil penyakit zoonosis, disusun AI dari bukti[]
// jurnal yang sudah diretrieve+diverifikasi di Alur 1 (case/analyze).

import type { JurnalBukti } from "./case";

// Response GET /api/case/dashboard?case_id=
export interface InfoDashboardPenyakit {
  case_id: string;
  summary: string; // rangkuman umum dari jurnal (bukan istilah "scraping" teknis ke FE)
  cara_penyebaran: string;
  informasi_hewan: string;
  habitat: string | null; // optional — null kalau jurnal tidak menyebutkan
  resiko_hewan: string;
  treatment: string;
  bukti: JurnalBukti[]; // sumber yang sama dengan Alur 1, biar bisa disitasi FE
  ai_status: "success" | "error";
  ai_error_code: string | null;
}
