-- =====================================================================
-- Seawise Enterprise Apps (Pharmacy Store Edition)
-- Migration: Layanan Jasa (services) — racikan resep, cek gula, dll
-- Jalankan di Supabase SQL Editor. Idempotent.
-- =====================================================================

create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  nama        text not null,
  harga       numeric not null default 0,
  deskripsi   text,
  status      text not null default 'aktif',   -- aktif | nonaktif
  company_id  uuid,
  created_at  timestamptz not null default now()
);

-- Isi company_id otomatis + scoping RLS per apotek (mengikuti pola tabel lain)
drop trigger if exists trg_set_company_id on public.services;
create trigger trg_set_company_id before insert on public.services
  for each row execute function public.set_company_id();

alter table public.services enable row level security;
drop policy if exists "tenant_all" on public.services;
create policy "tenant_all" on public.services
  for all
  using (company_id = public.auth_company_id() or public.is_super_admin())
  with check (company_id = public.auth_company_id() or public.is_super_admin());

-- Item transaksi boleh tanpa produk (baris layanan jasa)
alter table public.transaction_items alter column product_id drop not null;
