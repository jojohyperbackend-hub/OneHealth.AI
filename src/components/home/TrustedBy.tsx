/**
 * components/home/TrustedBy.tsx — OneHealth.AI
 * Strip logo teknologi/sumber data, marquee looping tanpa stroke/shadow.
 * Server Component (CSS-only animation, tidak ada state).
 */

import Image from 'next/image';

// width/height = dimensi asli file (dipakai next/image buat hitung aspect ratio,
// bukan ukuran render — render size diatur className h-full w-auto di card).
const TRUSTED_LOGOS = [
  { src: '/hermes.png', alt: 'Hermes Agent', card: 'light' as const, width: 907, height: 152 },
  { src: '/pubmed-logo-white.svg', alt: 'PubMed', card: 'dark' as const, width: 202, height: 69 },
  { src: '/nextjs-logo.jpg', alt: 'Next.js', card: 'light' as const, width: 1512, height: 605 },
  { src: '/epmc.png', alt: 'Europe PMC', card: 'light' as const, width: 1081, height: 251 },
  { src: '/qwen.jpg', alt: 'Qwen', card: 'light' as const, width: 815, height: 245 },
];

export function TrustedBy() {
  return (
    <section className="py-6 border-y border-[#c1c7d2] bg-[#f8f9ff] overflow-hidden" aria-label="Teknologi dan sumber data yang dipakai">
      <div className="trusted-marquee-track flex items-center gap-4 w-max">
        {[...TRUSTED_LOGOS, ...TRUSTED_LOGOS].map(({ src, alt, card, width, height }, i) => (
          <div
            key={`${src}-${i}`}
            aria-hidden={i >= TRUSTED_LOGOS.length}
            className={
              card === 'dark'
                ? 'h-24 shrink-0 rounded-[1rem] bg-[#00559a] px-6 flex items-center'
                : 'h-24 shrink-0 rounded-[1rem] bg-white px-6 flex items-center'
            }
          >
            <Image
              src={src}
              alt={i >= TRUSTED_LOGOS.length ? '' : alt}
              width={width}
              height={height}
              className="h-12 w-auto object-contain"
            />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes trusted-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .trusted-marquee-track {
          animation: trusted-marquee 22s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .trusted-marquee-track {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}
