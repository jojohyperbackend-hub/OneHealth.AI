/**
 * app/page.tsx — OneHealth.AI Homepage
 * Landing satu halaman: header sticky (nama project) + section-section scroll.
 * Page ini murni komposisi — semua isi section ada di komponennya masing-masing
 * (src/components/home/*), page.tsx cuma import + susun urutan.
 * RSC: ini Server Component (tidak ada 'use client')
 */

import type { Metadata } from 'next';
import { TopNavBar } from '@/components/ui/TopNavBar';
import { Hero } from '@/components/home/Hero';
import { TrustedBy } from '@/components/home/TrustedBy';
import { CaraKerja } from '@/components/home/CaraKerja';
import { KenapaBeda } from '@/components/home/KenapaBeda';
import { EdukasiKlinis } from '@/components/home/EdukasiKlinis';
import { FinalCTA } from '@/components/home/FinalCTA';
import { SectionTabBar } from '@/components/home/SectionTabBar';

export const metadata: Metadata = {
  title: 'OneHealth.AI — Copilot Literatur Medis untuk Nakes',
  description:
    'AI kesehatan yang berani diam. Copilot literatur medis berbasis bukti peer-reviewed untuk tenaga kesehatan Indonesia. Didukung Europe PMC, bukan tebakan.',
};

export default function HomePage() {
  return (
    <>
      <TopNavBar />
      <Hero />
      <TrustedBy />
      <CaraKerja />
      <KenapaBeda />
      <EdukasiKlinis />
      <FinalCTA />
      <SectionTabBar />
    </>
  );
}
