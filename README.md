# OneHealth.AI

Copilot literatur medis untuk tenaga kesehatan. Nakes memasukkan data pasien; sistem menarik dan
merangkum bukti dari jurnal medis (Europe PMC) yang relevan, lengkap dengan sitasi — supaya nakes
tidak perlu membuka puluhan paper sendiri. AI menyajikan bukti, tidak pernah memvonis: kalau
evidensinya belum cukup, sistem memilih diam daripada mengarang jawaban.

## Tech Stack

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- GSAP (ScrollTrigger) untuk animasi scroll
- [react-bits](https://reactbits.dev) untuk komponen visual (CardSwap, SideRays, BorderGlow, Radar)

## Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

## Struktur Proyek

- `src/app/` — routes (App Router)
- `src/components/home/` — section-section homepage
- `src/components/case/` — komponen Alur 1 (analisis kasus klinis)
- `src/components/reactbits/` — komponen visual dari react-bits
- `src/types/` — kontrak data (`CaseInput`, `HasilAnalisis`, dll)

Keputusan desain & teknis dicatat di `DECISIONS.md`.
