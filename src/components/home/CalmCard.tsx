'use client';

/**
 * components/ui/CalmCard.tsx — OneHealth.AI
 * "CALM Card" — visual representasi state EVIDENCE_INSUFFICIENT (silence).
 * Dipakai di halaman /kenapa-beda sebagai showcase wedge produk.
 *
 * Fitur: 3D tilt on hover (mouse tracking), glow effect, floating label.
 * Ini adalah visual utama yang menjelaskan wedge "AI yang berani diam" ke juri.
 */

import { useRef, type MouseEvent } from 'react';
import BorderGlow from '@/components/reactbits/BorderGlow';

export function CalmCard() {
  const cardRef = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (!card) return;
    const { left, top, width, height } = card.getBoundingClientRect();
    const x = (e.clientX - left) / width - 0.5;
    const y = (e.clientY - top) / height - 0.5;
    card.style.transform = `perspective(1000px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) scale(1.02)`;
  }

  function handleMouseLeave() {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg) scale(1)';
  }

  return (
    <div className="relative group" aria-label="Demonstrasi state AI Sengaja Diam">
      {/* Floating Label */}
      <div className="absolute -top-4 left-8 z-20">
        <span className="bg-[#08fdc6] text-[#002117] px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
          SAAT BUKTI BELUM MEMADAI
        </span>
      </div>

      {/* CALM Card — border statis diganti BorderGlow (react-bits), warna brand mint/biru */}
      <BorderGlow
        backgroundColor="transparent"
        borderRadius={16}
        glowColor="166 90% 55%"
        colors={['#08fdc6', '#00e0af', '#00559a']}
        glowRadius={36}
        animated
      >
        <div
          ref={cardRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="relative overflow-hidden rounded-[1rem] p-10 max-w-md transition-all duration-300 cursor-default"
          style={{
            background: 'rgba(29, 82, 139, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            willChange: 'transform',
          }}
          role="figure"
          aria-label="Contoh pesan saat bukti jurnal tidak cukup kuat"
        >
          <div className="flex flex-col gap-6 items-start">
            {/* Icon */}
            <span
              className="material-symbols-outlined text-[#08fdc6] text-5xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
              aria-hidden="true"
            >
              verified_user
            </span>

            {/* Message */}
            <h3 className="font-[family-name:var(--font-jakarta)] font-bold text-white text-3xl leading-snug">
              Agent Tidak Memberikan Rekomendasi
            </h3>
            <p className="text-white/80 text-base leading-relaxed">
              Belum ditemukan evidensi dari jurnal medis dengan tingkat relevansi yang memadai untuk
              mendukung rekomendasi pada kasus ini.
            </p>

            {/* Divider */}
            <div className="h-px w-full bg-[#08fdc6]/20" aria-hidden="true" />

            {/* Subtext */}
            <p className="text-[#08fdc6] text-base font-semibold leading-relaxed">
              Silakan lanjutkan penilaian klinis sesuai pertimbangan profesional.
            </p>
          </div>

          {/* Atmospheric background icon */}
          <div className="absolute -right-6 -bottom-6 opacity-10 pointer-events-none select-none" aria-hidden="true">
            <span className="material-symbols-outlined text-white" style={{ fontSize: '120px' }}>
              analytics
            </span>
          </div>
        </div>
      </BorderGlow>
    </div>
  );
}
