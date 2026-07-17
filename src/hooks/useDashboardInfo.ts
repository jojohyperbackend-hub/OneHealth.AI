'use client';

/**
 * hooks/useDashboardInfo.ts — OneHealth.AI
 * State management untuk dashboard profil penyakit zoonosis (/case/dashboard/[caseId]).
 * Generate on-demand lewat GET /api/case/dashboard?case_id= saat halaman dibuka.
 */

import { useEffect, useState } from 'react';
import type { InfoDashboardPenyakit } from '@/types/dashboard';
import { NO_CACHE_HEADERS } from '@/lib/utils';

interface UseDashboardInfoState {
  info: InfoDashboardPenyakit | null;
  isLoading: boolean;
  error: string | null;
}

export function useDashboardInfo(caseId: string): UseDashboardInfoState {
  const [info, setInfo] = useState<InfoDashboardPenyakit | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/case/dashboard?case_id=${encodeURIComponent(caseId)}`,
          { headers: NO_CACHE_HEADERS },
        );
        const body = (await res.json()) as InfoDashboardPenyakit;
        if (!cancelled) setInfo(body);
      } catch (err) {
        console.error('[useDashboardInfo] gagal ambil dashboard:', err);
        if (!cancelled) setError('Koneksi ke server gagal. Periksa jaringan Anda.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

  return { info, isLoading, error };
}
