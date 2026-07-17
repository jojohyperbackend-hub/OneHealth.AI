/**
 * components/home/Hero.tsx — OneHealth.AI
 * Hero section homepage. Server Component (tidak ada state/effect) —
 * dipisah dari app/page.tsx supaya page.tsx tetap tipis (page shell/komposisi section).
 */

import Link from 'next/link';
import SideRays from '@/components/reactbits/SideRays';
import BorderGlow from '@/components/reactbits/BorderGlow';

export function Hero() {
  return (
    <main id="top" className="relative scroll-mt-20 min-h-[calc(100vh-64px)] flex items-center overflow-hidden">
      {/* Background Gradient Accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-[20%] right-[10%] w-64 h-64 rounded-full blur-[100px]"
          style={{ background: 'rgba(8, 253, 198, 0.08)' }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-[10%] left-[5%] w-96 h-96 rounded-full blur-[120px]"
          style={{ background: 'rgba(0, 85, 154, 0.04)' }}
          aria-hidden="true"
        />
      </div>

      {/* SideRays — cahaya hijau/mint brand kita, dari pojok kanan-atas */}
      <div className="absolute inset-0 pointer-events-none">
        <SideRays
          rayColor1="#08fdc6"
          rayColor2="#00e0af"
          origin="top-right"
          intensity={1.4}
          spread={1.6}
          saturation={1.2}
          opacity={0.5}
        />
      </div>

      <div className="relative z-10 w-full px-4 md:px-12 max-w-[1280px] mx-auto py-12 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">

          {/* Left: Text Content */}
          <div className="lg:col-span-6 space-y-6">
            <h1
              className="font-[family-name:var(--font-jakarta)] font-bold text-[32px] md:text-[64px] text-[#00559a] leading-[1.05] tracking-tight"
              style={{ textWrap: 'balance' }}
            >
              Cari Bukti,{' '}
              <span className="text-[#00e0af] relative">
                Bukan Asumsi.
                <span
                  className="absolute bottom-1 left-0 w-full h-[8px] bg-[#08fdc6] -z-10 opacity-40 rounded-sm"
                  aria-hidden="true"
                />
              </span>
            </h1>

            <p className="text-[#414751] text-lg leading-relaxed max-w-[540px]">
              Masukkan data pasien. Agent akan mencari, memverifikasi, dan merangkum bukti dari
              jurnal medis lengkap dengan sitasinya. Jika evidensinya belum memadai, agent tidak
              akan memaksakan jawaban.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <Link
                href="/case"
                id="hero-cta-mulai"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#08fdc6] text-[#002117] px-10 py-5 rounded-full font-bold text-base hover:scale-105 active:scale-95 transition-all shadow-md group"
              >
                Mulai analisis kasus
                <span
                  className="material-symbols-outlined group-hover:translate-x-1 transition-transform"
                  aria-hidden="true"
                >
                  arrow_forward
                </span>
              </Link>
              <Link
                href="#cara-kerja"
                className="inline-flex items-center gap-2 text-[#00559a] font-bold hover:underline group text-base"
              >
                Lihat cara kerja
                <span className="material-symbols-outlined text-[#00e0af]" aria-hidden="true">
                  east
                </span>
              </Link>
            </div>
          </div>

          {/* Right: UI Mockup Card */}
          <div className="lg:col-span-6 flex justify-center lg:justify-end mt-10 lg:mt-0">
            <div
              className="relative w-full max-w-[580px]"
              style={{ animation: 'hero-float 6s ease-in-out infinite' }}
              aria-hidden="true"
            >
              {/* Main Card — border statis diganti BorderGlow (react-bits), warna brand mint/biru */}
              <BorderGlow
                backgroundColor="transparent"
                borderRadius={16}
                glowColor="166 90% 55%"
                colors={['#08fdc6', '#00e0af', '#00559a']}
                glowRadius={28}
                animated
              >
              <div className="relative bg-white rounded-[1rem] p-4 shadow-2xl overflow-hidden">
                {/* Mockup Evidence Card Preview */}
                <div className="space-y-3 p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-[#08fdc6]" />
                    <span className="text-xs font-semibold text-[#414751] uppercase tracking-wider">
                      Hasil Analisis · 3 jurnal ditemukan
                    </span>
                  </div>
                  {/* Fake Journal Card 1 */}
                  <div className="p-3 border border-[#c1c7d2] rounded-[0.75rem] space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-[#414751] font-semibold uppercase">Jurnal 1 · 2022</div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#08fdc6]/20 text-[#006c52] border border-[#08fdc6]/40">91%</span>
                    </div>
                    <div className="h-2 bg-[#e5eeff] rounded-full w-full" />
                    <div className="h-2 bg-[#e5eeff] rounded-full w-4/5" />
                  </div>
                  {/* Fake Journal Card 2 */}
                  <div className="p-3 border border-[#c1c7d2] rounded-[0.75rem] space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="text-xs text-[#414751] font-semibold uppercase">Jurnal 2 · 2021</div>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#eef4ff] text-[#00559a] border border-[#a3c9ff]">87%</span>
                    </div>
                    <div className="h-2 bg-[#e5eeff] rounded-full w-full" />
                    <div className="h-2 bg-[#e5eeff] rounded-full w-3/5" />
                  </div>
                  {/* Disclaimer bar */}
                  <div className="flex items-center gap-2 p-2 bg-[#f8f9ff] rounded-[0.5rem] border border-[#c1c7d2]">
                    <span className="material-symbols-outlined text-sm text-[#727782]">info</span>
                    <div className="h-2 bg-[#dfe9fa] rounded-full flex-1" />
                  </div>
                </div>

                {/* Glow accents */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-[#08fdc6] rounded-full opacity-10 blur-xl animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-[#a3c9ff] rounded-full opacity-10 blur-2xl" />
              </div>
              </BorderGlow>

              {/* Badge Overlay */}
              <div className="absolute -bottom-5 -right-5 bg-white border border-[#c1c7d2] p-3 rounded-[1rem] shadow-sm flex items-center gap-3 backdrop-blur-md">
                <div className="w-9 h-9 rounded-full bg-[#08fdc6]/20 flex items-center justify-center">
                  <span
                    className="material-symbols-outlined text-[#006c52] text-base"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    verified
                  </span>
                </div>
                <div>
                  <p className="text-[#121c28] font-bold text-xs">Sumber Terverifikasi</p>
                  <p className="text-[#727782] text-[10px] uppercase tracking-wider">Europe PMC &amp; PubMed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Float animation keyframe — scoped ke Hero (satu-satunya pemakai) */}
      <style>{`
        @keyframes hero-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-16px); }
        }
      `}</style>
    </main>
  );
}
