-- =====================================================================
-- Seawise Enterprise Apps (Pharmacy Store Edition)
-- Migration: Metode pembayaran pada transaksi kasir
-- Jalankan di Supabase SQL Editor. Idempotent.
-- =====================================================================

alter table public.transactions add column if not exists metode_bayar text default 'Tunai';
