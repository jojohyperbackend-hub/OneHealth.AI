/**
 * lib/utils.ts — OneHealth.AI
 * Utility helpers: UUID generation, class merging, formatting
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { HasilAnalisis } from '@/types/case';

/** Tailwind class merger — gunakan ini di seluruh komponen, bukan string concat biasa */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate case_id (UUID v4) client-side.
 * Dipanggil sekali saat CaseForm di-submit, bukan saat mount,
 * agar tidak terjadi hydration mismatch (§RSC boundaries skill).
 */
export function generateCaseId(): string {
  return crypto.randomUUID();
}

/** Format angka relevansi jurnal ke persen yang mudah dibaca juri */
export function formatRelevanceScore(score: number): string {
  return `${Math.round(score * 100)}%`;
}

/** Format ISO 8601 timestamp ke format lokal Indonesia */
export function formatTimestamp(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

/**
 * Anti-cache headers untuk endpoint data pasien.
 * Gunakan ini di setiap fetch call yang menyangkut data kasus/gejala pasien.
 * Referensi: PRDv2 §14 (Data Freshness & Anti-Cache)
 */
export const NO_CACHE_HEADERS: HeadersInit = {
  'Cache-Control': 'no-store',
  Pragma: 'no-cache',
};

export type EvidenceUiState = 'SUKSES' | 'SILENCE' | 'AI_ERROR' | 'RETRIEVAL_UNAVAILABLE';

/**
 * Turunkan state UI dari HasilAnalisis (§8/§9 PRD).
 * Urutan cek disengaja: evidence_status (gerbang silence, §3.2) dicek DULUAN,
 * supaya wedge "AI diam" tidak pernah kelabakan jadi state error walau ai_error_code
 * juga terisi. RETRIEVAL_UNAVAILABLE dicek lewat ai_error_code karena PRD tidak
 * memberi field status retrieval terpisah.
 */
export function deriveEvidenceUiState(hasil: HasilAnalisis): EvidenceUiState {
  if (hasil.evidence_status === 'BUKTI_TIDAK_CUKUP') return 'SILENCE';
  if (hasil.ai_error_code === 'RETRIEVAL_UNAVAILABLE') return 'RETRIEVAL_UNAVAILABLE';
  if (hasil.ai_status === 'error') return 'AI_ERROR';
  return 'SUKSES';
}
