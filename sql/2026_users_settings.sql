-- =====================================================================
-- Seawise Enterprise Apps (Pharmacy Store Edition)
-- Migration: Manajemen Pengguna / Role + kolom Profil Apotek
-- Jalankan di Supabase SQL Editor. Idempotent.
-- =====================================================================

-- 1. Kolom tambahan untuk profil apotek (menyerupai profil Farmacare)
alter table public.settings add column if not exists sektor_usaha text default 'Apotek';
alter table public.settings add column if not exists kota         text;
alter table public.settings add column if not exists email        text;
alter table public.settings add column if not exists logo_url     text;

-- 2. Tabel pengguna / role (anggota tim apotek)
create table if not exists public.app_users (
  id         uuid primary key default gen_random_uuid(),
  nama       text not null,
  email      text,
  role       text not null default 'kasir',   -- pemilik | apoteker | asisten_apoteker | kasir | admin
  status     text not null default 'aktif',   -- aktif | nonaktif
  created_at timestamptz not null default now()
);

alter table public.app_users enable row level security;

drop policy if exists "allow all app_users" on public.app_users;
create policy "allow all app_users" on public.app_users
  for all using (true) with check (true);
