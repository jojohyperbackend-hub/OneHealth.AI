'use client';

/**
 * components/case/CaseClientView.tsx — OneHealth.AI
 * Client boundary untuk halaman /case.
 * Menghubungkan CaseForm + EvidenceList melalui useCase hook.
 */

import { CaseForm } from '@/components/case/CaseForm';
import { EvidenceList } from '@/components/case/EvidenceList';
import { useCase } from '@/hooks/useCase';
import type { CaseInput } from '@/types/case';

export function CaseClientView() {
  const { hasil, isLoading, error, analyze, reset } = useCase();

  function handleSubmit(formData: Omit<CaseInput, 'case_id'>) {
    analyze(formData);
  }

  return (
    <div className="space-y-8">
      {/* Form: tampil jika belum ada hasil dan tidak loading */}
      {!hasil && (
        <>
          <div className="bg-white rounded-[1.5rem] border border-[#c1c7d2] p-6 md:p-8 shadow-sm">
            <CaseForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>

          {/* Loading skeleton */}
          {isLoading && (
            <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Menganalisis...">
              <div className="h-32 bg-[#e5eeff] rounded-[1rem]" />
              <div className="h-24 bg-[#eef4ff] rounded-[1rem]" />
              <div className="h-24 bg-[#eef4ff] rounded-[1rem]" />
              <p className="text-center text-xs text-[#727782] pt-2">
                Menarik bukti dari Europe PMC...
              </p>
            </div>
          )}
        </>
      )}

      {/* Network error (bukan state AI — ini error koneksi) */}
      {error && !hasil && (
        <div
          className="flex items-center gap-3 p-4 bg-[#ffdad6]/30 border border-[#ffdad6] rounded-[1rem]"
          role="alert"
        >
          <span className="material-symbols-outlined text-[#93000a]">wifi_off</span>
          <div>
            <p className="text-sm font-semibold text-[#93000a]">Koneksi Gagal</p>
            <p className="text-xs text-[#414751]">{error}</p>
          </div>
          <button
            onClick={reset}
            className="ml-auto text-xs font-bold text-[#93000a] hover:underline"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Hasil analisis */}
      {hasil && !isLoading && (
        <div className="bg-white rounded-[1.5rem] border border-[#c1c7d2] p-6 md:p-8 shadow-sm">
          <EvidenceList hasil={hasil} onReset={reset} />
        </div>
      )}
    </div>
  );
}
