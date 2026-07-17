import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

/**
 * Root Layout — OneHealth.AI
 * Font: Plus Jakarta Sans (satu keluarga, banyak weight) untuk headline & body —
 * menggantikan pasangan Archivo Narrow + Inter (revisi desain via impeccable).
 * `--font-jakarta` dipakai di seluruh komponen; `--font-archivo-narrow` dan
 * `--font-inter` tetap dialiaskan ke sana di globals.css supaya class lama tetap jalan.
 * Anti-cache: diimplementasikan di level fetch (lib/utils NO_CACHE_HEADERS), bukan di sini
 */

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-jakarta',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'OneHealth.AI — Copilot Literatur Medis untuk Nakes',
    template: '%s | OneHealth.AI',
  },
  description:
    'AI kesehatan yang berani diam. Copilot literatur medis berbasis bukti untuk tenaga kesehatan Indonesia — didukung Europe PMC, bukan tebakan.',
  keywords: [
    'AI kesehatan',
    'literatur medis',
    'copilot nakes',
    'Europe PMC',
    'evidence-based medicine',
    'OneHealth AI',
  ],
  openGraph: {
    title: 'OneHealth.AI — Copilot Literatur Medis untuk Nakes',
    description: 'AI kesehatan yang berani diam. Bukti jurnal, bukan tebakan.',
    type: 'website',
    locale: 'id_ID',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={plusJakartaSans.variable}>
      <head>
        {/* Material Symbols untuk ikon — loaded via stylesheet agar SSR-safe */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-[#f8f9ff] text-[#121c28] font-[family-name:var(--font-jakarta)] antialiased">
        {children}
      </body>
    </html>
  );
}
