/**
 * components/home/KenapaBeda.tsx — OneHealth.AI
 * Section "Kenapa Beda" di homepage — wedge produk: pendekatan berbasis
 * evidensi, agent berhenti kalau bukti belum memadai (bukan mengarang).
 * Server Component — CalmCard adalah client boundary-nya (3D tilt).
 *
 * Layout sengaja beda dari EdukasiKlinis (bukan 50/50 text-vs-visual lagi):
 * Frame 1 — blok vertikal full-width (heading + intro).
 * Frame 2 — dipecah horizontal: 2.1 "Yang Kami Utamakan" (list, teks besar)
 *           berdampingan 2.2 CalmCard ("Saat Bukti Belum Memadai").
 */

import Link from 'next/link';
import { CalmCard } from '@/components/home/CalmCard';

const PRINSIP = [
  'Berbasis bukti, bukan asumsi',
  'Setiap rekomendasi disertai sitasi',
  'Keputusan klinis tetap di tangan tenaga kesehatan',
];

export function KenapaBeda() {
  return (
    <section
      id="kenapa-beda"
      className="relative scroll-mt-20 py-24 px-4 md:px-12 overflow-hidden"
      style={{ background: '#296eb7' }}
      aria-labelledby="kenapa-beda-heading"
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[120px] opacity-20" style={{ background: 'rgba(8,253,198,0.3)' }} />
        <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] opacity-15" style={{ background: 'rgba(255,255,255,0.1)' }} />
      </div>

      {/* Transisi wavy — putih (section atas) masuk ke biru */}
      <svg
        className="absolute top-0 left-0 w-full h-14 md:h-20 text-[#f8f9ff] pointer-events-none"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path fill="currentColor" d="M0,64 C240,104 480,16 720,48 C960,80 1200,8 1440,56 L1440,0 L0,0 Z" />
      </svg>

      {/* Transisi wavy — biru keluar ke putih (section bawah) */}
      <svg
        className="absolute bottom-0 left-0 w-full h-14 md:h-20 text-white pointer-events-none"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path fill="currentColor" d="M0,56 C240,8 480,80 720,48 C960,16 1200,104 1440,64 L1440,120 L0,120 Z" />
      </svg>

      <div className="relative z-10 max-w-[1280px] mx-auto flex flex-col gap-16">
        {/* Frame 1 — vertikal, full-width, center */}
        <div className="max-w-3xl mx-auto text-center">
          <h2
            id="kenapa-beda-heading"
            className="font-[family-name:var(--font-jakarta)] font-bold text-white leading-tight"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3.5rem)', textWrap: 'balance' }}
          >
            Pendekatan Berbasis Evidensi
          </h2>
          <p className="text-white/80 text-lg leading-relaxed max-w-xl mx-auto mt-6">
            Tidak semua kasus harus dijawab. Agent hanya akan menyusun rekomendasi ketika didukung
            bukti ilmiah yang memadai. Jika evidensinya belum cukup, agent memilih berhenti
            daripada menghasilkan jawaban yang berisiko menyesatkan.
          </p>
        </div>

        {/* Frame 2 — dibagi horizontal: 2.1 & 2.2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center pt-14 border-t border-white/15">
          {/* Frame 2.1 — Yang Kami Utamakan (teks dibesarkan) */}
          <div className="flex flex-col gap-6">
            <h3 className="font-[family-name:var(--font-jakarta)] font-bold text-2xl md:text-3xl text-white">
              Yang Kami Utamakan
            </h3>
            <ul className="flex flex-col gap-4">
              {PRINSIP.map(item => (
                <li key={item} className="flex items-start gap-3">
                  <span
                    className="material-symbols-outlined text-[#08fdc6] text-2xl shrink-0"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                    aria-hidden="true"
                  >
                    check_circle
                  </span>
                  <span className="text-white text-lg md:text-xl font-semibold leading-snug">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
            <Link
              href="/case"
              id="kenapa-beda-cta"
              className="inline-flex items-center justify-center gap-2 w-fit bg-[#08fdc6] text-[#002117] px-8 py-4 rounded-full font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-md mt-2"
            >
              <span className="material-symbols-outlined text-base" aria-hidden="true">science</span>
              Coba Analisis Kasus
            </Link>
          </div>

          {/* Frame 2.2 — Saat Bukti Belum Memadai (CalmCard) */}
          <div className="flex justify-center lg:justify-end">
            <CalmCard />
          </div>
        </div>
      </div>
    </section>
  );
}
