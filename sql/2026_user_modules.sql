-- =====================================================================
-- Seawise Enterprise Apps (Pharmacy Store Edition)
-- Migration: Akses modul per pengguna (checkbox)
-- Jalankan di Supabase SQL Editor. Idempotent.
-- =====================================================================

-- Daftar id modul yang boleh dibuka user ini (mis: ["dashboard","transaksi"]).
-- Jika kosong, akses jatuh ke default berdasarkan role.
alter table public.app_users
  add column if not exists modules jsonb not null default '[]'::jsonb;
