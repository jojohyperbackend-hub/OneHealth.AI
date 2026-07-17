/**
 * components/case/EvidenceList.tsx — OneHealth.AI
 * Menampilkan hasil analisis jurnal dalam 4 state berbeda (turunan dari
 * ai_status/ai_error_code/evidence_status §8-§9 PRD, lihat deriveEvidenceUiState):
 *
 * 1. SUKSES                → kartu bukti + ringkasan LLM, kondisi_terkait bersitasi
 * 2. SILENCE (BUKTI_TIDAK_CUKUP) → wedge state (AI diam, bukan error)
 * 3. AI_ERROR              → bukti mentah tampil, narasi LLM tidak ada
 * 4. RETRIEVAL_UNAVAILABLE → server tidak bisa dihubungi
 *
 * PENTING UNTUK JURI: State #2 (silence) di-desain TIDAK seperti error.
 * Visual berbeda — tenang, informatif, bukan merah menyala.
 */

import type { HasilAnalisis, JurnalBukti, KondisiTerkait } from '@/types/case';
import { cn, deriveEvidenceUiState, formatRelevanceScore } from '@/lib/utils';

interface EvidenceListProps {
  hasil: HasilAnalisis;
  onReset: () => void;
}

// ─── Sub-komponen: Kartu Bukti Jurnal ────────────────────────────────────────
function BuktiCard({ bukti, index }: { bukti: JurnalBukti; index: number }) {
  const scoreColor =
    bukti.relevance_score >= 0.85
      ? 'text-[#006c52] bg-[#08fdc6]/20 border-[#08fdc6]/40'
      : bukti.relevance_score >= 0.75
      ? 'text-[#00559a] bg-[#eef4ff] border-[#a3c9ff]'
      : 'text-[#727782] bg-[#f8f9ff] border-[#c1c7d2]';

  return (
    <article
      id={`bukti-${bukti.id}`}
      className="p-6 border border-[#c1c7d2] bg-white rounded-[1rem] space-y-3 scroll-mt-24 transition-all duration-500 opacity-0 translate-y-4"
      style={{ animationDelay: `${index * 100}ms` }}
      ref={el => {
        if (el) {
          requestAnimationFrame(() => {
            el.classList.add('opacity-100', '!translate-y-0');
            el.classList.remove('opacity-0', 'translate-y-4');
          });
        }
      }}
      aria-label={`Jurnal ${index + 1}: ${bukti.title}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-[#414751] tracking-wider uppercase mb-1">
            Jurnal {index + 1} · {bukti.source}
            {bukti.year !== null && ` · ${bukti.year}`}
          </p>
          <h3 className="font-[family-name:var(--font-jakarta)] font-semibold text-[#121c28] text-lg leading-snug">
            {bukti.title}
          </h3>
        </div>
        <span
          className={cn(
            'shrink-0 text-xs font-bold px-3 py-1 rounded-full border',
            scoreColor
          )}
          title="Skor relevansi berdasarkan cosine similarity terhadap query gejala"
        >
          {formatRelevanceScore(bukti.relevance_score)}
        </span>
      </div>

      <blockquote className="text-sm text-[#414751] italic leading-relaxed border-l-2 border-[#08fdc6] pl-4">
        "{bukti.snippet}"
      </blockquote>

      {bukti.url ? (
        <a
          href={bukti.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00559a] hover:underline"
          aria-label={`Buka jurnal di ${bukti.source}${bukti.doi ? `: DOI ${bukti.doi}` : ''}`}
        >
          <span className="material-symbols-outlined text-sm">open_in_new</span>
          {bukti.doi ? `DOI: ${bukti.doi}` : 'Buka sumber'}
        </a>
      ) : bukti.doi ? (
        <p className="text-xs font-semibold text-[#727782]">DOI: {bukti.doi}</p>
      ) : null}
    </article>
  );
}

// ─── Sub-komponen: Chip Kondisi Terkait (bersitasi ke bukti) ─────────────────
function KondisiChip({ kondisi, bukti }: { kondisi: KondisiTerkait; bukti: JurnalBukti[] }) {
  const rujukan = kondisi.dasar_jurnal
    .map(id => bukti.find(b => b.id === id))
    .filter((b): b is JurnalBukti => Boolean(b));

  return (
    <div className="px-4 py-2.5 rounded-[0.75rem] border border-[#00559a] bg-white space-y-1.5">
      <span className="text-[#00559a] text-xs font-semibold block">{kondisi.kondisi}</span>
      {rujukan.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {rujukan.map((b, i) => (
            <a
              key={b.id}
              href={`#bukti-${b.id}`}
              className="text-[10px] font-bold text-[#006c52] bg-[#08fdc6]/15 border border-[#08fdc6]/40 px-2 py-0.5 rounded-full hover:bg-[#08fdc6]/30 transition-colors"
              title={b.title}
            >
              Sitasi {i + 1}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── State: SILENCE / BUKTI_TIDAK_CUKUP ──────────────────────────────────────
// Desain sengaja: BUKAN merah, BUKAN icon error — ini fitur, bukan bug (§3.2, §4).
function SilenceState({ disclaimer, onReset }: { disclaimer: string; onReset: () => void }) {
  return (
    <div
      className="flex flex-col items-center text-center py-16 px-8 bg-[#eef4ff] rounded-[1.5rem] border border-[#c1c7d2]"
      role="status"
      aria-live="polite"
    >
      <div className="w-16 h-16 rounded-full bg-[#e5eeff] flex items-center justify-center mb-6">
        <span className="material-symbols-outlined text-3xl text-[#00559a]">
          auto_stories
        </span>
      </div>
      <h2 className="font-[family-name:var(--font-jakarta)] font-bold text-2xl text-[#121c28] mb-3">
        Belum Ada Rujukan Jurnal yang Cukup Kuat
      </h2>
      <p className="text-[#414751] text-sm leading-relaxed max-w-md mb-2">
        {disclaimer}
      </p>
      <p className="text-xs text-[#727782] mb-8">Silakan nakes putuskan secara manual.</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={onReset}
          id="btn-coba-gejala-lain"
          className="px-6 py-3 rounded-full bg-[#00559a] text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all"
        >
          Coba Deskripsi Gejala Lebih Detail
        </button>
        <a
          href="https://europepmc.org"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 rounded-full border border-[#c1c7d2] text-[#414751] font-semibold text-sm hover:bg-white transition-all text-center"
        >
          Cari Mandiri di Europe PMC
        </a>
      </div>
    </div>
  );
}

// ─── State: Error ─────────────────────────────────────────────────────────────
function ErrorState({
  isRetrieval,
  disclaimer,
  onReset,
}: {
  isRetrieval: boolean;
  disclaimer: string;
  onReset: () => void;
}) {
  return (
    <div
      className="flex flex-col items-center text-center py-12 px-8 bg-[#ffdad6]/30 rounded-[1.5rem] border border-[#ffdad6]"
      role="alert"
      aria-live="assertive"
    >
      <div className="w-14 h-14 rounded-full bg-[#ffdad6] flex items-center justify-center mb-5">
        <span className="material-symbols-outlined text-2xl text-[#93000a]">
          {isRetrieval ? 'cloud_off' : 'error_outline'}
        </span>
      </div>
      <h2 className="font-[family-name:var(--font-jakarta)] font-bold text-xl text-[#121c28] mb-2">
        {isRetrieval ? 'Sumber Data Tidak Terjangkau' : 'Analisis AI Gagal'}
      </h2>
      <p className="text-sm text-[#414751] mb-6 max-w-sm">
        {isRetrieval
          ? 'Server Europe PMC tidak dapat dihubungi saat ini. Silakan coba beberapa saat lagi.'
          : 'Terjadi kesalahan pada model AI. Bukti jurnal mentah tersedia di bawah.'}
      </p>
      <button
        onClick={onReset}
        className="px-6 py-3 rounded-full bg-[#121c28] text-white font-bold text-sm hover:scale-105 active:scale-95 transition-all"
      >
        Coba Lagi
      </button>
      <p className="text-xs text-[#727782] mt-4 italic">{disclaimer}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function EvidenceList({ hasil, onReset }: EvidenceListProps) {
  const { ringkasan, kondisi_terkait, bukti, disclaimer } = hasil;
  const uiState = deriveEvidenceUiState(hasil);

  if (uiState === 'SILENCE') {
    return <SilenceState disclaimer={disclaimer} onReset={onReset} />;
  }

  if (uiState === 'AI_ERROR' || uiState === 'RETRIEVAL_UNAVAILABLE') {
    return (
      <div className="space-y-6">
        <ErrorState isRetrieval={uiState === 'RETRIEVAL_UNAVAILABLE'} disclaimer={disclaimer} onReset={onReset} />
        {/* Untuk AI_ERROR: tampilkan bukti mentah jika retrieval sempat berhasil */}
        {uiState === 'AI_ERROR' && bukti.length > 0 && (
          <div className="space-y-4">
            <h3 className="font-[family-name:var(--font-jakarta)] font-bold text-lg text-[#121c28]">
              Bukti Jurnal (Tanpa Narasi AI)
            </h3>
            {bukti.map((b, i) => (
              <BuktiCard key={b.id} bukti={b} index={i} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── SUKSES ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8" aria-label="Hasil analisis jurnal medis">
      {/* Header hasil */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[#08fdc6]/20 border border-[#08fdc6]/40 text-[#006c52] text-xs font-bold uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              Analisis Selesai
            </span>
          </div>
          <h2 className="font-[family-name:var(--font-jakarta)] font-bold text-2xl text-[#121c28]">
            Hasil Tinjauan Literatur
          </h2>
        </div>
        <button
          onClick={onReset}
          id="btn-analisis-baru"
          className="shrink-0 px-4 py-2 rounded-full border border-[#c1c7d2] text-sm text-[#414751] font-semibold hover:bg-[#f8f9ff] transition-all"
        >
          Kasus Baru
        </button>
      </div>

      {/* Kondisi Terkait — tiap chip bersitasi ke bukti (§3.1) */}
      {kondisi_terkait.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#414751] mb-3">
            Kondisi Terkait
          </p>
          <div className="flex flex-wrap gap-2">
            {kondisi_terkait.map(k => (
              <KondisiChip key={k.kondisi} kondisi={k} bukti={bukti} />
            ))}
          </div>
        </div>
      )}

      {/* Ringkasan LLM */}
      {ringkasan && (
        <div className="p-6 bg-[#eef4ff] rounded-[1rem] border border-[#a3c9ff]/50">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[#00559a] text-xl">summarize</span>
            <h3 className="font-[family-name:var(--font-jakarta)] font-semibold text-[#121c28] text-lg">
              Ringkasan Analisis
            </h3>
          </div>
          <p className="text-sm text-[#121c28] leading-relaxed">{ringkasan}</p>
        </div>
      )}

      {/* Bukti Jurnal */}
      <div>
        <h3 className="font-[family-name:var(--font-jakarta)] font-bold text-lg text-[#121c28] mb-4">
          Bukti Jurnal ({bukti.length} sumber)
        </h3>
        <div className="space-y-4">
          {bukti.map((b, i) => (
            <BuktiCard key={b.id} bukti={b} index={i} />
          ))}
        </div>
      </div>

      {/* Disclaimer — selalu ditampilkan */}
      <div
        className="flex items-start gap-3 p-4 bg-[#f8f9ff] border border-[#c1c7d2] rounded-[1rem]"
        role="note"
        aria-label="Disclaimer klinis"
      >
        <span className="material-symbols-outlined text-[#727782] text-lg shrink-0 mt-0.5">
          info
        </span>
        <p className="text-xs text-[#727782] leading-relaxed italic">{disclaimer}</p>
      </div>
    </div>
  );
}
