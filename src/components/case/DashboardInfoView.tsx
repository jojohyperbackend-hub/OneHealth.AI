'use client';

/**
 * components/case/DashboardInfoView.tsx — OneHealth.AI
 * Menampilkan InfoDashboardPenyakit (6 field: summary, cara penyebaran,
 * info hewan, habitat, resiko hewan, treatment) di halaman
 * /case/dashboard/[caseId]. Mengikuti pola visual EvidenceList.tsx.
 */

import { useDashboardInfo } from '@/hooks/useDashboardInfo';

interface FieldCardProps {
  icon: string;
  label: string;
  value: string;
}

function FieldCard({ icon, label, value }: FieldCardProps) {
  return (
    <div className="p-6 bg-white border border-[#c1c7d2] rounded-[1rem] space-y-2">
      <div className="flex items-center gap-2">
        <span className="material-symbols-outlined text-[#00559a] text-xl">{icon}</span>
        <h3 className="font-[family-name:var(--font-jakarta)] font-semibold text-[#121c28] text-base">
          {label}
        </h3>
      </div>
      <p className="text-sm text-[#414751] leading-relaxed">{value}</p>
    </div>
  );
}

export function DashboardInfoView({ caseId }: { caseId: string }) {
  const { info, isLoading, error } = useDashboardInfo(caseId);

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse" aria-busy="true" aria-label="Menyusun dashboard...">
        <div className="h-24 bg-[#eef4ff] rounded-[1rem]" />
        <div className="h-24 bg-[#eef4ff] rounded-[1rem]" />
        <div className="h-24 bg-[#eef4ff] rounded-[1rem]" />
        <p className="text-center text-xs text-[#727782] pt-2">
          Menyusun profil penyakit dari jurnal...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[#ffdad6]/30 border border-[#ffdad6] rounded-[1rem]" role="alert">
        <p className="text-sm font-semibold text-[#93000a]">Koneksi Gagal</p>
        <p className="text-xs text-[#414751]">{error}</p>
      </div>
    );
  }

  if (!info) return null;

  if (info.ai_status === 'error') {
    const messages: Record<string, string> = {
      NOT_FOUND: 'Kasus tidak ditemukan.',
      EVIDENCE_INSUFFICIENT: 'Kasus ini belum punya bukti jurnal yang cukup untuk disusun jadi dashboard.',
      INVALID_INPUT: 'ID kasus tidak valid.',
    };
    return (
      <div className="p-6 bg-[#ffdad6]/30 border border-[#ffdad6] rounded-[1rem]" role="alert">
        <p className="text-sm font-semibold text-[#93000a]">Dashboard Belum Tersedia</p>
        <p className="text-xs text-[#414751] mt-1">
          {messages[info.ai_error_code ?? ''] ?? 'Terjadi kesalahan pada model AI. Silakan coba lagi.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6" aria-label="Dashboard profil penyakit">
      <div className="p-6 bg-[#eef4ff] rounded-[1rem] border border-[#a3c9ff]/50">
        <div className="flex items-center gap-2 mb-3">
          <span className="material-symbols-outlined text-[#00559a] text-xl">summarize</span>
          <h2 className="font-[family-name:var(--font-jakarta)] font-bold text-lg text-[#121c28]">
            Ringkasan
          </h2>
        </div>
        <p className="text-sm text-[#121c28] leading-relaxed">{info.summary}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FieldCard icon="coronavirus" label="Cara Penyebaran" value={info.cara_penyebaran} />
        <FieldCard icon="pets" label="Informasi Hewan" value={info.informasi_hewan} />
        {info.habitat && <FieldCard icon="forest" label="Habitat" value={info.habitat} />}
        <FieldCard icon="warning" label="Resiko dari Hewan" value={info.resiko_hewan} />
        <FieldCard icon="medical_services" label="Treatment" value={info.treatment} />
      </div>

      <div>
        <h3 className="font-[family-name:var(--font-jakarta)] font-bold text-lg text-[#121c28] mb-4">
          Sumber Jurnal ({info.bukti.length})
        </h3>
        <div className="space-y-3">
          {info.bukti.map((b) => (
            <div key={b.id} className="p-4 border border-[#c1c7d2] bg-white rounded-[1rem]">
              <p className="text-xs font-semibold text-[#414751] tracking-wider uppercase mb-1">
                {b.source}
                {b.year !== null && ` · ${b.year}`}
              </p>
              <p className="font-[family-name:var(--font-jakarta)] font-semibold text-[#121c28] text-sm">
                {b.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
