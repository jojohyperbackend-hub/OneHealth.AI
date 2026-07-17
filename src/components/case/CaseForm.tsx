/**
 * components/case/CaseForm.tsx — OneHealth.AI
 * Form input data pasien (Alur 1, Phase 1 PLANNING-FE)
 *
 * Field & enum di form ini WAJIB match §8 PRD (types/case.ts) — lihat DECISIONS.md
 * untuk catatan rekonsiliasi kontrak.
 * Validasi client-side harus match batas server (§13 PRD) — cek komentar di setiap field.
 * Derived state dipakai untuk bolehSubmit — tidak pakai useState terpisah (§7 Defend-my-frontend).
 */

'use client';

import { useState, type FormEvent } from 'react';
import type { CaseInput } from '@/types/case';
type DurasiGejala = CaseInput['durasi'];
type JenisKelamin = CaseInput['jenis_kelamin'];
import { cn } from '@/lib/utils';

interface CaseFormProps {
  onSubmit: (data: Omit<CaseInput, 'case_id'>) => void;
  isLoading: boolean;
}

const DURASI_OPTIONS: { value: DurasiGejala; label: string }[] = [
  { value: 'hari_ini', label: 'Hari ini' },
  { value: '1-3_hari', label: '1–3 hari' },
  { value: '>3_hari', label: 'Lebih dari 3 hari' },
  { value: '>1_minggu', label: 'Lebih dari 1 minggu' },
];

export function CaseForm({ onSubmit, isLoading }: CaseFormProps) {
  const [gejala, setGejala] = useState('');
  const [umur, setUmur] = useState('');
  const [jenisKelamin, setJenisKelamin] = useState<JenisKelamin | ''>('');
  const [durasi, setDurasi] = useState<DurasiGejala | ''>('');
  const [riwayatPaparan, setRiwayatPaparan] = useState('');
  const [catatanNakes, setCatatanNakes] = useState('');

  // ── Derived state — TIDAK ada useState untuk bolehSubmit ──────────────────
  // Ini mencegah bug desinkronisasi di mana tombol aktif padahal input kosong.
  const bolehSubmit =
    gejala.trim().length >= 10 &&
    gejala.trim().length <= 2000 &&
    umur.trim() !== '' &&
    Number(umur) >= 0 &&
    Number(umur) <= 150 &&
    jenisKelamin !== '' &&
    durasi !== '' &&
    !isLoading;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!bolehSubmit) return;

    onSubmit({
      gejala: gejala.trim(),
      umur: Number(umur),
      jenis_kelamin: jenisKelamin as JenisKelamin,
      durasi: durasi as DurasiGejala,
      riwayat_paparan: riwayatPaparan.trim() || undefined,
      catatan_nakes: catatanNakes.trim() || undefined,
    });
  }

  const inputBase = cn(
    'w-full bg-white border border-[#c1c7d2] rounded-[1rem] px-4 py-3 text-sm text-[#121c28]',
    'placeholder:text-[#727782] focus:outline-none focus:ring-2 focus:ring-[#00559a] focus:border-[#00559a]',
    'transition-all duration-150'
  );

  const labelBase = 'block text-xs font-semibold tracking-widest uppercase text-[#414751] mb-1.5';

  return (
    <form onSubmit={handleSubmit} className="space-y-6" aria-label="Form analisis kasus klinis" noValidate>
      {/* Gejala Utama */}
      <div>
        <label htmlFor="gejala" className={labelBase}>
          Gejala Utama <span className="text-[#ba1a1a]">*</span>
        </label>
        <textarea
          id="gejala"
          value={gejala}
          onChange={e => setGejala(e.target.value)}
          placeholder="Deskripsikan gejala utama pasien secara lengkap (min. 10 karakter)..."
          rows={4}
          maxLength={2000}
          className={cn(inputBase, 'resize-none')}
          aria-describedby="gejala-hint"
          required
        />
        <p id="gejala-hint" className="text-xs text-[#727782] mt-1 text-right">
          {gejala.length}/2000 karakter
        </p>
      </div>

      {/* Umur & Jenis Kelamin */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="umur" className={labelBase}>
            Umur (Tahun) <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="umur"
            type="number"
            value={umur}
            onChange={e => setUmur(e.target.value)}
            placeholder="Contoh: 45"
            min={0}
            max={150}
            className={inputBase}
            required
          />
        </div>
        <div>
          <label htmlFor="jenis-kelamin" className={labelBase}>
            Jenis Kelamin <span className="text-[#ba1a1a]">*</span>
          </label>
          <select
            id="jenis-kelamin"
            value={jenisKelamin}
            onChange={e => setJenisKelamin(e.target.value as JenisKelamin)}
            className={cn(inputBase, 'cursor-pointer')}
            required
          >
            <option value="">Pilih...</option>
            <option value="L">Laki-laki</option>
            <option value="P">Perempuan</option>
          </select>
        </div>
      </div>

      {/* Durasi Gejala */}
      <div>
        <label htmlFor="durasi" className={labelBase}>
          Durasi Gejala <span className="text-[#ba1a1a]">*</span>
        </label>
        <select
          id="durasi"
          value={durasi}
          onChange={e => setDurasi(e.target.value as DurasiGejala)}
          className={cn(inputBase, 'cursor-pointer')}
          required
        >
          <option value="">Pilih durasi...</option>
          {DURASI_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Riwayat Paparan (Opsional) */}
      <div>
        <label htmlFor="riwayat-paparan" className={labelBase}>
          Riwayat Paparan <span className="text-[#727782] font-normal normal-case tracking-normal">(opsional)</span>
        </label>
        <textarea
          id="riwayat-paparan"
          value={riwayatPaparan}
          onChange={e => setRiwayatPaparan(e.target.value)}
          placeholder="Kontak hewan, makanan, perjalanan, dll..."
          rows={2}
          maxLength={1000}
          className={cn(inputBase, 'resize-none')}
        />
      </div>

      {/* Catatan Nakes (Opsional) */}
      <div>
        <label htmlFor="catatan-nakes" className={labelBase}>
          Catatan Nakes <span className="text-[#727782] font-normal normal-case tracking-normal">(opsional)</span>
        </label>
        <textarea
          id="catatan-nakes"
          value={catatanNakes}
          onChange={e => setCatatanNakes(e.target.value)}
          placeholder="Observasi klinis tambahan, riwayat penyakit, obat saat ini, dll..."
          rows={2}
          maxLength={1000}
          className={cn(inputBase, 'resize-none')}
        />
      </div>

      {/* Submit Button */}
      <button
        id="btn-submit-analisis"
        type="submit"
        disabled={!bolehSubmit}
        className={cn(
          'w-full py-4 rounded-full font-bold text-sm uppercase tracking-widest',
          'transition-all duration-200 flex items-center justify-center gap-2',
          bolehSubmit
            ? 'bg-[#08fdc6] text-[#002117] hover:scale-[1.02] active:scale-[0.98] shadow-md cursor-pointer'
            : 'bg-[#dfe9fa] text-[#727782] cursor-not-allowed opacity-60'
        )}
        aria-disabled={!bolehSubmit}
      >
        {isLoading ? (
          <>
            <span className="material-symbols-outlined animate-spin text-base">progress_activity</span>
            Menganalisis...
          </>
        ) : (
          <>
            <span className="material-symbols-outlined text-base">science</span>
            Mulai Analisis Kasus
          </>
        )}
      </button>
    </form>
  );
}
