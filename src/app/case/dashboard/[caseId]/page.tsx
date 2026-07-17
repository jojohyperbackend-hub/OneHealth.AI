/**
 * app/case/dashboard/[caseId]/page.tsx — OneHealth.AI
 * Halaman dashboard profil penyakit zoonosis (disusun AI dari bukti[]
 * hasil Alur 1). Route: /case/dashboard/[caseId]
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { DashboardInfoView } from '@/components/case/DashboardInfoView';

export const metadata: Metadata = {
  title: 'Dashboard Penyakit | OneHealth.AI — Copilot Literatur Medis',
  description: 'Profil penyakit zoonosis: cara penyebaran, informasi hewan, habitat, resiko, dan treatment, disusun dari jurnal medis peer-reviewed.',
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ caseId: string }>;
}) {
  const { caseId } = await params;

  return (
    <main className="min-h-screen bg-[#f8f9ff]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 py-12">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-[family-name:var(--font-jakarta)] font-bold text-3xl md:text-4xl text-[#121c28] leading-tight mb-2">
                Dashboard Profil Penyakit
              </h1>
              <p className="text-[#414751] text-sm leading-relaxed">
                Disusun otomatis dari jurnal medis peer-reviewed hasil analisis kasus ini.
              </p>
            </div>
            <Link
              href="/case"
              className="shrink-0 px-4 py-2 rounded-full border border-[#c1c7d2] text-sm text-[#414751] font-semibold hover:bg-white transition-all"
            >
              Kembali
            </Link>
          </div>

          <DashboardInfoView caseId={caseId} />
        </div>
      </div>
    </main>
  );
}
