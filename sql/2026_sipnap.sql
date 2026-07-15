-- =====================================================================
-- Seawise Enterprise Apps (Pharmacy Store Edition)
-- Migration: Data pasien pada transaksi (untuk laporan SIPNAP)
-- Jalankan di Supabase SQL Editor. Idempotent.
-- =====================================================================

-- Diisi hanya untuk transaksi yang memuat obat golongan
-- Narkotika / Psikotropika / Prekursor.
alter table public.transactions add column if not exists nama_pasien   text;
alter table public.transactions add column if not exists alamat_pasien text;
alter table public.transactions add column if not exists kontak_pasien text;
alter table public.transactions add column if not exists nomor_resep   text;
