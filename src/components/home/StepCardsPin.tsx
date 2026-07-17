'use client';

/**
 * components/home/StepCardsPin.tsx — OneHealth.AI
 * Kartu step "Cara Kerja" full-width, satu tampil di layar dalam satu waktu.
 * Section di-pin (GSAP ScrollTrigger) selama user scroll — kartu berikutnya
 * masuk dari kanan, kartu sebelumnya keluar bergeser ke kiri.
 *
 * `prefers-reduced-motion: reduce` → pin & animasi dimatikan (gsap.matchMedia),
 * kartu tampil statis bertumpuk normal di alur dokumen.
 */

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export interface Step {
  title: string;
  desc: string;
}

interface StepCardsPinProps {
  steps: Step[];
}

export function StepCardsPin({ steps }: StepCardsPinProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const cards = cardsRef.current.filter((el): el is HTMLDivElement => el !== null);
    if (!containerRef.current || cards.length === 0) return;

    const mm = gsap.matchMedia();

    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.set(cards[0], { xPercent: 0, autoAlpha: 1 });
      gsap.set(cards.slice(1), { xPercent: 100, autoAlpha: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: 'top top',
          end: `+=${(cards.length - 1) * 100}%`,
          scrub: 1,
          pin: true,
        },
      });

      for (let i = 0; i < cards.length - 1; i++) {
        tl.to(cards[i], { xPercent: -100, autoAlpha: 0, duration: 1, ease: 'power2.inOut' }, i)
          .to(cards[i + 1], { xPercent: 0, autoAlpha: 1, duration: 1, ease: 'power2.inOut' }, i);
      }

      return () => {
        tl.kill();
      };
    });

    mm.add('(prefers-reduced-motion: reduce)', () => {
      gsap.set(cards, { xPercent: 0, autoAlpha: 1, position: 'relative' });
    });

    return () => mm.revert();
  }, []);

  return (
    <div ref={containerRef} className="relative h-screen overflow-hidden flex items-center mb-16">
      <div className="relative w-full px-4 md:px-12 max-w-[1280px] mx-auto h-[75vh] md:h-[520px]">
        {steps.map((step, i) => (
          <div
            key={step.title}
            ref={el => {
              cardsRef.current[i] = el;
            }}
            className="absolute inset-0 w-full flex flex-col items-center justify-center text-center p-10 md:p-16"
          >
            <h3 className="font-[family-name:var(--font-jakarta)] font-bold text-4xl md:text-7xl text-[#00559a] mb-4 leading-snug">
              {step.title}
            </h3>
            <p className="text-2xl md:text-3xl text-[#414751] max-w-3xl leading-relaxed">
              {step.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
