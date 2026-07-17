/**
 * components/home/FinalCTA.tsx — OneHealth.AI
 * Section CTA penutup homepage. Server Component (tidak ada state).
 */

import Link from 'next/link';
import Radar from '@/components/reactbits/Radar';

export function FinalCTA() {
  return (
    <section className="bg-[#00e0af] pt-24 pb-40 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none">
        <Radar color="#00559a" backgroundColor="#00e0af" scale={0.7} brightness={0.8} />
      </div>
      <div className="max-w-[1280px] mx-auto px-4 md:px-12 text-center relative z-10">
        <h2 className="font-[family-name:var(--font-jakarta)] font-bold text-4xl md:text-5xl text-[#002117] mb-8">
          Analisis sekarang.
        </h2>
        <Link
          href="/case"
          id="home-final-cta"
          className="inline-block bg-[#296eb7] text-white font-[family-name:var(--font-jakarta)] text-lg px-12 py-5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all duration-300 font-bold"
        >
          Mulai analisis kasus
        </Link>
      </div>
    </section>
  );
}
