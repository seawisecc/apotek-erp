-- =====================================================================
-- Seawise Enterprise Apps (Pharmacy Store Edition)
-- Migration: Multi-apotek (companies) + Super Admin
-- Jalankan di Supabase SQL Editor. Idempotent.
-- =====================================================================

-- 1. Daftar apotek yang mendaftar layanan
create table if not exists public.companies (
  id            uuid primary key default gen_random_uuid(),
  nama          text not null,
  slug          text,
  admin_nama    text,
  admin_email   text,
  user_count    integer not null default 1,
  status        text not null default 'nonaktif',  -- aktif | nonaktif (menunggu aktivasi)
  valid_sampai  date,                               -- null = tanpa batas
  created_at    timestamptz not null default now()
);
create index if not exists idx_companies_admin_email on public.companies (admin_email);

alter table public.companies enable row level security;
drop policy if exists "allow all companies" on public.companies;
create policy "allow all companies" on public.companies for all using (true) with check (true);

-- 2. Daftar super admin (email). Email di sini = super user penyedia layanan.
create table if not exists public.super_admins (
  email      text primary key,
  created_at timestamptz not null default now()
);

alter table public.super_admins enable row level security;
drop policy if exists "allow all super_admins" on public.super_admins;
create policy "allow all super_admins" on public.super_admins for all using (true) with check (true);

-- 3. Jadikan akun ini sebagai super user
insert into public.super_admins (email) values ('seawise.cc@gmail.com')
  on conflict (email) do nothing;
