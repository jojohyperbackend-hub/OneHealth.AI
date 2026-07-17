'use client';

/**
 * components/case/RelevanceBar.tsx — OneHealth.AI
 * Animated relevance bar — animasi width dari 0% ke nilai aktual saat masuk viewport.
 * Dipakai di EvidencePreview (UI/03) dan bisa dipakai di EvidenceList nanti.
 *
 * Menggunakan IntersectionObserver — client-only, harus 'use client'.
 */

import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface RelevanceBarProps {
  score: number;     // 0–100 (persen)
  label?: boolean;   // tampilkan label "Skor Relevansi" & angka
  size?: 'sm' | 'md';
}

export function RelevanceBar({ score, label = true, size = 'md' }: RelevanceBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const observed = useRef(false);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar || observed.current) return;
    observed.current = true;

    // Start at 0, animate to target on scroll-in
    bar.style.width = '0%';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            if (bar) bar.style.width = `${score}%`;
          }, 100);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    observer.observe(bar);

    return () => observer.disconnect();
  }, [score]);

  const scoreColor =
    score >= 85
      ? 'text-[#006c52]'
      : score >= 75
      ? 'text-[#00559a]'
      : 'text-[#727782]';

  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between items-end mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#414751]">
            Skor Relevansi
          </span>
          <span className={cn('font-bold text-base', scoreColor)}>{score}%</span>
        </div>
      )}
      <div
        className={cn(
          'w-full bg-[#d9e3f4] rounded-full overflow-hidden',
          size === 'sm' ? 'h-1.5' : 'h-2'
        )}
        role="meter"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Skor relevansi: ${score}%`}
      >
        <div
          ref={barRef}
          className="h-full bg-[#00e0af] rounded-full"
          style={{
            width: '0%',
            transition: 'width 1s ease-in-out',
          }}
        />
      </div>
    </div>
  );
}
