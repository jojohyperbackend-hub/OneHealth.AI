'use client';

/**
 * components/home/SectionTabBar.tsx — OneHealth.AI
 * Bar navigasi section, sticky di bawah window — pengganti nav link di header
 * (header sekarang cuma nama project). Tab aktif mengikuti section yang lagi
 * kelihatan di viewport (IntersectionObserver), bukan cuma warna statis.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'top', label: 'Beranda' },
  { id: 'cara-kerja', label: 'Cara Kerja' },
  { id: 'kenapa-beda', label: 'Kenapa Beda' },
  { id: 'edukasi-klinis', label: 'Edukasi Klinis' },
];

export function SectionTabBar() {
  const [active, setActive] = useState('top');

  useEffect(() => {
    const sections = TABS.map(t => document.getElementById(t.id)).filter(
      (el): el is HTMLElement => el !== null
    );
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: 0 }
    );

    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-outline-variant"
      aria-label="Navigasi section"
    >
      <div className="flex items-center gap-1 px-4 md:px-12 py-3 max-w-[1280px] mx-auto overflow-x-auto">
        {TABS.map(tab => (
          <a
            key={tab.id}
            href={`#${tab.id}`}
            className={cn(
              'shrink-0 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors',
              active === tab.id
                ? 'bg-[#00559a] text-white'
                : 'text-[#414751] hover:bg-[#eef4ff]'
            )}
            aria-current={active === tab.id ? 'true' : undefined}
          >
            {tab.label}
          </a>
        ))}
        <Link
          href="/case"
          id="tabbar-cta-mulai"
          className="shrink-0 ml-auto px-5 py-2 rounded-full bg-[#08fdc6] text-[#002117] text-xs font-bold uppercase tracking-wider hover:scale-105 active:scale-95 transition-transform"
        >
          Mulai Analisis
        </Link>
      </div>
    </nav>
  );
}
