-- =====================================================================
-- Seawise Enterprise Apps (Pharmacy Store Edition)
-- Migration: Pembayaran Faktur (invoice pembelian)
-- Jalankan di Supabase SQL Editor. Idempotent.
-- =====================================================================

create table if not exists public.faktur (
  id                  uuid primary key default gen_random_uuid(),
  nomor_faktur        text,
  po_id               uuid references public.purchase_orders(id),
  supplier_id         uuid references public.suppliers(id),
  tanggal_faktur      date not null default current_date,
  term_of_payment     integer not null default 30,          -- dalam hari (0 = tunai)
  tanggal_jatuh_tempo date,
  total               numeric not null default 0,
  status              text not null default 'belum_bayar',  -- belum_bayar | lunas
  tanggal_bayar       date,
  metode_bayar        text,
  catatan_bayar       text,
  created_at          timestamptz not null default now()
);

create index if not exists idx_faktur_jatuh_tempo on public.faktur (tanggal_jatuh_tempo);
create index if not exists idx_faktur_status on public.faktur (status);

alter table public.faktur enable row level security;

drop policy if exists "allow all faktur" on public.faktur;
create policy "allow all faktur" on public.faktur
  for all using (true) with check (true);
