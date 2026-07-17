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
 */

import { useState, useCallback } from 'react';
import type { CaseInput, HasilAnalisis } from '@/types/case';
import { generateCaseId, NO_CACHE_HEADERS } from '@/lib/utils';

// ─── Fixture Imports ───────────────────────────────────────────────────────────
// Ganti USE_FIXTURE = false saat endpoint asli sudah siap (Phase 2, jam 8)
const USE_FIXTURE = true;

async function fetchWithFixture(input: CaseInput): Promise<HasilAnalisis> {
  if (USE_FIXTURE) {
    // Simulasi network delay
    await new Promise(r => setTimeout(r, 1200));

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

  if (!res.ok) {
    // Tangkap error network/server sebelum sampai ke skema AIWrappedResponse (§9)
    const ai_error_code = res.status >= 500 ? 'RETRIEVAL_UNAVAILABLE' : 'AI_UNAVAILABLE';
    return {
      ai_status: 'error',
      ai_error_code,
      evidence_status: 'CUKUP',
      bukti: [],
      kondisi_terkait: [],
      ringkasan: '',
      disclaimer:
        'Terjadi gangguan pada sistem. Silakan coba beberapa saat lagi atau hubungi tim teknis.',
    };
  }

  return res.json() as Promise<HasilAnalisis>;
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
