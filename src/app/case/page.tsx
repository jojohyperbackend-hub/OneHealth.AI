/**
 * app/case/page.tsx — OneHealth.AI
 * Halaman analisis kasus klinis (Alur 1: input nakes → hasil jurnal)
 * Route: /case
 *
 * ARSITEKTUR (sesuai next-best-practices/rsc-boundaries):
 * - Page ini adalah Server Component (default di App Router)
 * - CaseClientView sebagai 'use client' boundary — semua state interaktif di sana
 * - Semua komponen domain "case" dikumpulkan di components/case/ (bukan
 *   dicolocate _components/ — folder ini ada di luar app/ jadi tidak ada
 *   risiko route-segment collision, jadi tidak ada alasan teknis buat pisah)
 */

import type { Metadata } from 'next';
import { CaseClientView } from '@/components/case/CaseClientView';

export const metadata: Metadata = {
  title: 'Analisis Kasus | OneHealth.AI — Copilot Literatur Medis',
  description:
    'Input data klinis pasien dan dapatkan rangkuman bukti dari jurnal medis peer-reviewed secara real-time. Didukung Europe PMC.',
};

// Tidak ada data fetching di server — semua fetch dilakukan di client setelah submit
export default function CasePage() {
  return (
    <main className="min-h-screen bg-[#f8f9ff]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="mb-10">
            <h1 className="font-[family-name:var(--font-jakarta)] font-bold text-4xl md:text-5xl text-[#121c28] leading-tight mb-4">
              Analisis Kasus Klinis
            </h1>
            <p className="text-[#414751] text-base leading-relaxed">
              Masukkan data klinis pasien. Sistem akan mencari bukti dari jurnal medis peer-reviewed
              di Europe PMC. Jika bukti tidak cukup kuat, AI memilih untuk diam daripada mengarang.
            </p>
          </div>

          {/* Client boundary — semua state form & hasil ada di sini */}
          <CaseClientView />
        </div>
      </div>
    </main>
  );
}
