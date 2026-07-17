'use client';

/**
 * hooks/useCase.ts — OneHealth.AI
 * State management untuk Alur 1 (nakes input → analisis jurnal)
 *
 * Fase: mulai pakai FIXTURE, ganti ke endpoint asli di Phase 2 (jam 8–12)
 * Caranya: ganti USE_FIXTURE = false dan pastikan endpoint tersedia.
 *
 * ⚠️ DATA PRIVASI (§14 PRD):
 * - State TIDAK pernah ditulis ke localStorage/sessionStorage
 * - Semua data hanya hidup di memori state React (hilang saat tab ditutup)
 * - Semua fetch menggunakan NO_CACHE_HEADERS
 *
 * CATATAN DEPENDENCY (belum selesai, dicatat bukan disembunyikan):
 * `caseId` di state ini adalah UUID yang di-generate CLIENT-SIDE lalu
 * dikirim sebagai `input.case_id`. Response HasilAnalisis (§8) TIDAK
 * membawa case_id balik, jadi hook ini simpan sendiri di state terpisah.
 * Backend WAJIB memperlakukan `case_id` yang dikirim ini sebagai primary
 * key kasus (bukan sekadar idempotency key yang di-map ke UUID lain) —
 * kalau tidak, `caseId` di sini tidak akan valid dipakai buat memanggil
 * /api/patient/educate atau /api/patient/chat setelahnya.
 */

import { useState, useCallback } from 'react';
import type { CaseInput, HasilAnalisis } from '@/types/case';
import { generateCaseId, NO_CACHE_HEADERS } from '@/lib/utils';

// ─── Fixture Imports ───────────────────────────────────────────────────────────
// Ganti USE_FIXTURE = false saat endpoint asli sudah siap (Phase 2, jam 8)
const USE_FIXTURE = false;

// Dipakai HANYA kalau body error dari backend gagal di-parse sebagai JSON
// (mis. network putus total, backend crash sebelum sempat kirim body valid).
// Backend (case/analyze/route.ts) didesain SELALU kirim body HasilAnalisis
// valid di setiap response, sukses maupun error — jadi fallback ini
// seharusnya jarang/tidak pernah kepakai di kondisi normal.
function fallbackError(ai_error_code: HasilAnalisis['ai_error_code']): HasilAnalisis {
  return {
    ai_status: 'error',
    ai_error_code,
    evidence_status: 'BUKTI_TIDAK_CUKUP',
    bukti: [],
    kondisi_terkait: [],
    ringkasan: '',
    disclaimer:
      'Terjadi gangguan pada sistem. Silakan coba beberapa saat lagi atau hubungi tim teknis.',
  };
}

async function fetchWithFixture(input: CaseInput): Promise<HasilAnalisis> {
  if (USE_FIXTURE) {
    // Simulasi network delay
    await new Promise((r) => setTimeout(r, 1200));

    // Ganti path fixture sesuai state yang ingin diuji:
    // - hasil-analisis.sample.json  → SUKSES
    // - hasil-analisis.silence.json → EVIDENCE_INSUFFICIENT (BUKTI_TIDAK_CUKUP)
    const fixture = await import('@/fixtures/hasil-analisis.sample.json');
    return fixture as unknown as HasilAnalisis;
  }

  // ── Endpoint asli ──────────────────────────────────────────────────────────
  const res = await fetch('/api/case/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...NO_CACHE_HEADERS,
    },
    body: JSON.stringify(input),
  });

  // PENTING: backend SELALU kirim body HasilAnalisis valid, baik status 200
  // maupun error (400/422/429/502/504) — lihat case/analyze/route.ts. Kalau
  // !res.ok tapi kita buang body-nya dan sintesis error sendiri, dua hal
  // hilang: (1) fallback "bukti mentah tanpa narasi" yang backend sengaja
  // kirim balik pas guardrail nolak output AI, (2) ai_error_code asli yang
  // sudah dibedakan backend (AI_TIMEOUT/AI_QUOTA_EXCEEDED/dst). Jadi selalu
  // coba parse body dulu, apa pun status code-nya — jangan short-circuit di
  // !res.ok.
  try {
    return (await res.json()) as HasilAnalisis;
  } catch {
    // Body beneran bukan JSON valid (mis. proxy/CDN error page, bukan dari
    // backend kita) — baru pakai fallback sintetis.
    console.error('[useCase] Response bukan JSON valid, status:', res.status);
    return fallbackError(res.status >= 500 ? 'AI_UNAVAILABLE' : 'AI_INVALID_OUTPUT');
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseCaseState {
  hasil: HasilAnalisis | null;
  /** case_id yang di-generate saat submit — HasilAnalisis (§8) tidak membawanya balik */
  caseId: string | null;
  isLoading: boolean;
  error: string | null;
  /** Submit form → mulai analisis */
  analyze: (formData: Omit<CaseInput, 'case_id'>) => Promise<void>;
  /** Reset state agar form bisa diisi ulang */
  reset: () => void;
}

export function useCase(): UseCaseState {
  const [hasil, setHasil] = useState<HasilAnalisis | null>(null);
  const [caseId, setCaseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async (formData: Omit<CaseInput, 'case_id'>) => {
    setIsLoading(true);
    setError(null);
    setHasil(null);

    const input: CaseInput = {
      ...formData,
      case_id: generateCaseId(), // UUID di-generate di sini, bukan saat mount
    };
    setCaseId(input.case_id);

    try {
      const result = await fetchWithFixture(input);
      setHasil(result);
    } catch (err) {
      // Ini fetch()-nya sendiri yang gagal (network putus total sebelum
      // sempat dapat response apa pun) — beda kasus dari body-tidak-valid
      // yang sudah ditangani di dalam fetchWithFixture().
      console.error('[useCase] Unexpected error:', err);
      setError('Koneksi ke server gagal. Periksa jaringan Anda.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setHasil(null);
    setCaseId(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { hasil, caseId, isLoading, error, analyze, reset };
}