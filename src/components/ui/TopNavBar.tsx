/**
 * components/ui/TopNavBar.tsx — OneHealth.AI
 * Sticky header minimal — cuma nama project. Nav & CTA sengaja dihapus:
 * ini landing satu halaman (scroll), bukan multi-page site yang butuh nav link.
 * Server Component — tidak ada state, tidak perlu 'use client'.
 */

import Link from 'next/link';

export function TopNavBar() {
  return (
    <header className="sticky top-0 z-50 w-full h-16 bg-white border-b border-outline-variant">
      <div className="flex items-center h-full px-4 md:px-12 max-w-[1280px] mx-auto">
        <Link
          href="/"
          className="font-[family-name:var(--font-jakarta)] font-bold text-lg tracking-tight text-primary"
          aria-label="OneHealth.AI beranda"
        >
          OneHealth<span className="text-[#00e0af]">.AI</span>
        </Link>
      </div>
    </header>
  );
}
