-- =====================================================================
-- Seawise Enterprise Apps (Pharmacy Store Edition)
-- Migration: Tindak Lanjut Barang Expired
-- Jalankan di Supabase SQL Editor.
-- Aman dijalankan berulang (idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Kolom po_id di product_batches (untuk deteksi supplier asal saat retur)
-- ---------------------------------------------------------------------
alter table public.product_batches
  add column if not exists po_id uuid references public.purchase_orders(id);

-- ---------------------------------------------------------------------
-- 2. Tabel PEMUSNAHAN (Berita Acara Pemusnahan Obat)
-- ---------------------------------------------------------------------
create table if not exists public.pemusnahan (
  id                uuid primary key default gen_random_uuid(),
  nomor_ba          text unique,
  batch_id          uuid references public.product_batches(id),
  product_id        uuid references public.products(id),
  tanggal_musnahkan date not null default current_date,
  qty_musnahkan     integer not null default 0,
  metode            text,
  saksi_1           text,
  saksi_2           text,
  keterangan        text,
  created_at        timestamptz not null default now()
);

-- Nomor BA otomatis: BA/YYYY/NNNN (reset tiap tahun)
create or replace function public.set_nomor_ba()
returns trigger
language plpgsql
as $$
declare
  next_seq integer;
  yr       text := to_char(coalesce(new.tanggal_musnahkan, current_date), 'YYYY');
begin
  if new.nomor_ba is null then
    select count(*) + 1 into next_seq
    from public.pemusnahan
    where to_char(coalesce(tanggal_musnahkan, created_at), 'YYYY') = yr;
    new.nomor_ba := 'BA/' || yr || '/' || lpad(next_seq::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_nomor_ba on public.pemusnahan;
create trigger trg_set_nomor_ba
  before insert on public.pemusnahan
  for each row execute function public.set_nomor_ba();

-- ---------------------------------------------------------------------
-- 3. Tabel RETUR_SUPPLIER
-- ---------------------------------------------------------------------
create table if not exists public.retur_supplier (
  id            uuid primary key default gen_random_uuid(),
  nomor_retur   text unique,
  batch_id      uuid references public.product_batches(id),
  product_id    uuid references public.products(id),
  supplier_id   uuid references public.suppliers(id),
  qty_retur     integer not null default 0,
  tanggal_retur date not null default current_date,
  alasan        text,
  status        text not null default 'diajukan', -- diajukan | disetujui | selesai
  created_at    timestamptz not null default now()
);

-- Nomor retur otomatis: RTR/YYYY/NNNN
create or replace function public.set_nomor_retur()
returns trigger
language plpgsql
as $$
declare
  next_seq integer;
  yr       text := to_char(coalesce(new.tanggal_retur, current_date), 'YYYY');
begin
  if new.nomor_retur is null then
    select count(*) + 1 into next_seq
    from public.retur_supplier
    where to_char(coalesce(tanggal_retur, created_at), 'YYYY') = yr;
    new.nomor_retur := 'RTR/' || yr || '/' || lpad(next_seq::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_nomor_retur on public.retur_supplier;
create trigger trg_set_nomor_retur
  before insert on public.retur_supplier
  for each row execute function public.set_nomor_retur();

-- ---------------------------------------------------------------------
-- 4. Row Level Security (samakan dgn tabel lain di project)
--    Sesuaikan policy jika project pakai auth per-user.
-- ---------------------------------------------------------------------
alter table public.pemusnahan     enable row level security;
alter table public.retur_supplier enable row level security;

drop policy if exists "allow all pemusnahan" on public.pemusnahan;
create policy "allow all pemusnahan" on public.pemusnahan
  for all using (true) with check (true);

drop policy if exists "allow all retur_supplier" on public.retur_supplier;
create policy "allow all retur_supplier" on public.retur_supplier
  for all using (true) with check (true);
