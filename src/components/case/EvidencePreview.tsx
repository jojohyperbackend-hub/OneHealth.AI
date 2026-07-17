/**
 * components/case/EvidencePreview.tsx — OneHealth.AI
 * Preview 3 jurnal contoh sebagai demonstrasi hasil sistem: teks di kiri,
 * CardSwap (react-bits, GSAP) di kanan menampilkan kartu jurnal bergantian.
 * Data jurnal di-hardcode sebagai contoh ilustratif (bukan data asli pasien).
 *
 * CardSwap butuh 'use client' (state/effect/gsap) — sudah ditambahkan di
 * source-nya sendiri (src/components/CardSwap.jsx), jadi EvidencePreview
 * tetap bisa Server Component; CardSwap adalah client boundary-nya.
 */

import Link from 'next/link';
import CardSwap, { Card } from '@/components/reactbits/CardSwap';

interface JurnalContoh {
  title: string;
  year: number;
  doi: string;
  metode: string;
  snippet: string;
  score: number;
}

const JURNAL_CONTOH: JurnalContoh[] = [
  {
    title: 'Asosiasi Gejala Dermatologis pada Kasus Reinfeksi Virus Tropis di Asia Tenggara',
    year: 2023,
    doi: '10.1016/j.jinf.2023.01.002',
    metode: 'Meta-analisis',
    snippet:
      '...gejala klinis yang diamati pada 85% populasi sampel menunjukkan korelasi signifikan dengan durasi paparan primer...',
    score: 98,
  },
  {
    title: 'Analisis Perbandingan Durasi Gejala Pernapasan Akut pada Pasien Pediatrik',
    year: 2022,
    doi: '10.1136/bmj.o2938',
    metode: 'Observasional',
    snippet:
      '...tidak ditemukan bukti kuat yang menghubungkan penggunaan antibiotik dini dengan pengurangan durasi gejala pada kasus non-komplikasi...',
    score: 85,
  },
  {
    title: 'Efektivitas Skrining Berbasis AI dalam Deteksi Dini Penyakit Menular',
    year: 2024,
    doi: '10.1038/s41591-023-02728-x',
    metode: 'Uji Klinis',
    snippet:
      '...integrasi basis data real-time meningkatkan presisi penemuan kasus sebesar 22% dibandingkan metode surveilans tradisional...',
    score: 72,
  },
];

export function EvidencePreview() {
  return (
    <section aria-labelledby="evidence-preview-heading">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left: Text */}
        <div>
          <h2
            id="evidence-preview-heading"
            className="font-[family-name:var(--font-jakarta)] font-semibold text-4xl md:text-5xl text-[#121c28] mb-4"
          >
            Hasil Pencarian Literatur Terkini
          </h2>
          <p className="text-[#414751] text-lg md:text-xl leading-relaxed max-w-md mb-6">
            Menyajikan transparansi data klinis berbasis bukti — tiap kartu adalah contoh jurnal
            yang lolos ambang relevansi, lengkap dengan skor dan sitasinya.
          </p>
          <Link
            href="/case"
            id="evidence-preview-cta"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00559a] text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-[#296eb7] transition-colors w-fit"
          >
            <span className="material-symbols-outlined text-sm" aria-hidden="true">link</span>
            Coba Analisis Kasus
          </Link>
        </div>

        {/* Right: CardSwap — tampil penuh, nggak di-clip. Proteksi horizontal-scroll
            ditangani di level <body> (overflow-x-hidden, lihat layout.tsx), bukan di
            sini, supaya bleed alami kartu (translate bawaan komponen) tetap kelihatan utuh. */}
        <div className="relative h-[340px] md:h-[420px]">
          <CardSwap width={380} height={260} cardDistance={40} verticalDistance={50} delay={4000} pauseOnHover>
            {JURNAL_CONTOH.map(j => (
              <Card
                key={j.doi}
                className="p-6 flex flex-col justify-between"
                aria-label={`Contoh jurnal: ${j.title}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <span className="text-xs font-semibold text-[#727782] uppercase tracking-wider">
                      {j.year} · {j.metode}
                    </span>
                    <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-full bg-[#08fdc6]/20 text-[#006c52] border border-[#08fdc6]/40">
                      {j.score}%
                    </span>
                  </div>
                  <h3 className="font-[family-name:var(--font-jakarta)] font-bold text-base text-[#296eb7] leading-snug mb-3 line-clamp-3">
                    {j.title}
                  </h3>
                  <p className="text-xs text-[#414751] italic leading-relaxed line-clamp-3">
                    &ldquo;{j.snippet}&rdquo;
                  </p>
                </div>
                <p className="text-[10px] text-[#727782] mt-4">DOI: {j.doi}</p>
              </Card>
            ))}
          </CardSwap>
        </div>
      </div>
    </section>
  );
}
