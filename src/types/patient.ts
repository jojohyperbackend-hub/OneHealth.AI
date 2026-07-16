// types/patient.ts
// KONTRAK — jangan ubah field tanpa kabari tim dulu (lihat WORKFLOW.md §0.1)

import type { JurnalBukti } from "./case";

// Materi edukasi (Alur 2)
export interface EdukasiPasien {
  case_id: string;
  penyebab: string; // dari jurnal, diterjemahkan
  bagaimana_terjadi: string;
  pencegahan_perawatan: string;
  bukti: JurnalBukti[]; // sumber yang sama dengan Alur 1
  ai_status: "success" | "error";
  ai_error_code: string | null;
}

// Request POST /api/patient/chat (pertanyaan balik pasien via WA/webapp)
export interface PatientChatInput {
  case_id: string;
  pertanyaan: string; // UNTRUSTED — wajib disanitasi (PRD §10.5)
}