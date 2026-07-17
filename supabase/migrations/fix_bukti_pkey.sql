-- Fix: bukti.id (PK) dulunya = ID artikel Europe PMC mentah, yang bentrok
-- (duplicate key value violates unique constraint "bukti_pkey") kalau
-- artikel yang sama disitasi di kasus berbeda. Root cause dari
-- saveCaseResult gagal simpan bukti[] -> dashboard/educate selalu
-- "EVIDENCE_INSUFFICIENT" meski analyze sukses.
--
-- Fix: bukti dapat PK sendiri (UUID, auto-generate), ID artikel Europe PMC
-- pindah ke kolom external_id. Constraint unik sekarang per (case_id,
-- external_id) — artikel yang sama BOLEH muncul di banyak kasus, tapi
-- tidak boleh dobel di kasus yang SAMA.
--
-- Jalankan di Supabase SQL Editor. Aman dijalankan meski tabel `bukti`
-- masih ada isinya (kolom id lama otomatis jadi external_id, PK baru
-- di-generate buat semua row existing).

BEGIN;

ALTER TABLE bukti RENAME COLUMN id TO external_id;
ALTER TABLE bukti DROP CONSTRAINT IF EXISTS bukti_pkey;
ALTER TABLE bukti ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE bukti ADD PRIMARY KEY (id);
ALTER TABLE bukti ADD CONSTRAINT bukti_case_external_unique UNIQUE (case_id, external_id);

COMMIT;
