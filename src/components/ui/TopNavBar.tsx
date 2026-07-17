/**
 * components/ui/TopNavBar.tsx — OneHealth.AI
 * Sticky header minimal — nama project + tautan GitHub/WhatsApp di kanan.
 * Nav link lain sengaja dihapus: ini landing satu halaman (scroll), bukan
 * multi-page site yang butuh nav link. Server Component — tidak ada state,
 * tidak perlu 'use client'.
 */

import Link from 'next/link';

const WA_BOT_NUMBER = '6285176913401';
const GITHUB_REPO_URL = 'https://github.com/jojohyperbackend-hub/OneHealth.AI';

export function TopNavBar() {
  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-white border-b border-outline-variant">
      <div className="flex items-center justify-between h-full px-4 md:px-12 max-w-[1280px] mx-auto">
        <Link
          href="/"
          className="font-[family-name:var(--font-jakarta)] font-bold text-lg tracking-tight text-primary"
          aria-label="OneHealth.AI beranda"
        >
          OneHealth<span className="text-[#00e0af]">.AI;D</span>
        </Link>

        <div className="flex items-center gap-2">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Buka repository GitHub OneHealth.AI"
            title="GitHub"
            className="shrink-0 w-9 h-9 rounded-full border border-[#c1c7d2] bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/github.png" alt="" className="w-5 h-5 object-contain" />
          </a>
          <a
            href={`https://wa.me/${WA_BOT_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat via WhatsApp"
            title="WhatsApp"
            className="shrink-0 w-9 h-9 rounded-full border border-[#c1c7d2] bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all overflow-hidden"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/wa.jpg" alt="" className="w-5 h-5 object-contain" />
          </a>
        </div>
      </div>
    </header>
  );
}
