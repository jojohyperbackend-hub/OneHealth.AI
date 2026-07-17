/**
 * types/patient.ts — OneHealth.AI
 * Type contracts untuk Alur 2: edukasi & komunikasi pasien
 * Referensi PRDv2 §8 (Kontrak Data), §9 (Skema Response AI), §11 (WhatsApp Integration)
 */

import type { JurnalBukti } from './case';

// ─── Skema Response Umum untuk Semua Endpoint Ber-AI (§9) ─────────────────────

export interface AIWrappedResponse<T> {
  ai_status: 'success' | 'error';
  ai_error_code: string | null;
  data: T | null;
}

// ─── Edukasi Pasien (Alur 2) — §8 ──────────────────────────────────────────────

export interface EdukasiPasien {
  case_id: string;
  penyebab: string;               // dari jurnal, diterjemahkan
  bagaimana_terjadi: string;
  pencegahan_perawatan: string;
  bukti: JurnalBukti[];           // sumber yang sama dengan Alur 1
  ai_status: 'success' | 'error';
  ai_error_code: string | null;
}

// Request POST /api/patient/chat (pertanyaan balik pasien via WA/webapp) — §8
export interface PatientChatInput {
  case_id: string;
  pertanyaan: string;             // UNTRUSTED — wajib disanitasi di server (§10.5)
}

export interface PatientChatReplyData {
  jawaban: string;
}

// Response POST /api/patient/chat — mengikuti pola AIWrappedResponse (§9)
export type PatientChatResponse = AIWrappedResponse<PatientChatReplyData>;

// ─── State UI Chat & Gateway (khusus FE — bukan bagian kontrak backend) ───────
// GatewayStatus/ChatMessage adalah representasi lokal FE untuk panel fallback
// (PRDv2 §11.3), bukan field yang dikembalikan langsung oleh /api/patient/chat.

export type ChatRole = 'nakes' | 'pasien' | 'system';
export type GatewayStatus = 'ONLINE' | 'OFFLINE' | 'UNKNOWN';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string; // ISO 8601
}

export interface PatientChatState {
  messages: ChatMessage[];
  gateway_status: GatewayStatus;
  isLoading: boolean;
  error: string | null;
}
