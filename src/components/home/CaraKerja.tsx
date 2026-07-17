/**
 * components/home/CaraKerja.tsx — OneHealth.AI
 * Section "Cara Kerja" di homepage: heading + kartu step full-width yang
 * di-pin & di-swap pakai GSAP ScrollTrigger (StepCardsPin), lalu EvidencePreview.
 * Server Component — StepCardsPin adalah client boundary-nya sendiri.
 */

import { EvidencePreview } from '@/components/case/EvidencePreview';
import { StepCardsPin } from '@/components/home/StepCardsPin';

const STEPS = [
  {
    title: 'Masukkan data pasien',
    desc: 'Input gejala, durasi, dan profil pasien secara anonim.',
  },
  {
    title: 'Agent menelusuri dan memvalidasi jurnal',
    desc: 'Jurnal disaring dan diperingkat berdasarkan skor relevansi yang terukur, bukan sekadar tebakan AI.',
  },
  {
    title: 'Bukti siap ditinjau',
    desc: 'Referensi dan sitasi disajikan secara ringkas sebagai dasar pertimbangan. Keputusan klinis tetap berada di tangan tenaga kesehatan.',
  },
];

export function CaraKerja() {
  return (
    <section
      id="cara-kerja"
      className="scroll-mt-20 py-16"
      aria-labelledby="cara-kerja-heading"
    >
      <div className="px-4 md:px-12 max-w-[1280px] mx-auto mb-10 text-center">
        <h2
          id="cara-kerja-heading"
          className="font-[family-name:var(--font-jakarta)] font-bold text-3xl md:text-5xl text-[#00559a] max-w-3xl mx-auto leading-tight"
        >
          Cara Kerja
        </h2>
      </div>

      <StepCardsPin steps={STEPS} />

      <div className="px-4 md:px-12 max-w-[1280px] mx-auto">
        <EvidencePreview />
      </div>
    </section>
  );
}
