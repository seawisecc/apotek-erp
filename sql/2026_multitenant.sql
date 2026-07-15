-- =====================================================================
-- Seawise Enterprise Apps (Pharmacy Store Edition)
-- Migration: Multi-tenant — isolasi data per apotek (company_id + RLS)
-- Jalankan di Supabase SQL Editor.
--
-- CATATAN: Data lama dianggap DATA UJI dan akan DIKOSONGKAN (truncate)
-- sesuai keputusan. Setiap apotek mulai dari data kosong & terisolasi.
-- =====================================================================

-- 1) Tambah kolom company_id ke semua tabel data apotek DULU
--    (harus ada sebelum fungsi/policy yang memakainya dibuat)
do $$
declare
  t text;
  tables text[] := array[
    'products','product_batches','suppliers','product_suppliers',
    'transactions','transaction_items','purchase_orders','po_items',
    'pemusnahan','retur_supplier','faktur','settings','app_users'
  ];
begin
  foreach t in array tables loop
    execute format('alter table public.%I add column if not exists company_id uuid', t);
  end loop;
end $$;

-- 2) Fungsi: company_id milik user yang sedang login (berdasar email di JWT)
create or replace function public.auth_company_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select coalesce(
    (select id from public.companies
       where lower(admin_email) = lower(auth.jwt() ->> 'email') limit 1),
    (select company_id from public.app_users
       where lower(email) = lower(auth.jwt() ->> 'email') limit 1)
  );
$$;

-- 3) Trigger: isi company_id otomatis saat insert
create or replace function public.set_company_id()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.company_id is null then
    new.company_id := public.auth_company_id();
  end if;
  return new;
end;
$$;

-- 4) Pasang trigger + RLS scoped ke tiap tabel
do $$
declare
  t text;
  pol record;
  tables text[] := array[
    'products','product_batches','suppliers','product_suppliers',
    'transactions','transaction_items','purchase_orders','po_items',
    'pemusnahan','retur_supplier','faktur','settings','app_users'
  ];
begin
  foreach t in array tables loop
    execute format('drop trigger if exists trg_set_company_id on public.%I', t);
    execute format('create trigger trg_set_company_id before insert on public.%I
                    for each row execute function public.set_company_id()', t);

    execute format('alter table public.%I enable row level security', t);

    for pol in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I', pol.policyname, t);
    end loop;

    execute format('create policy "tenant_all" on public.%I
                    for all using (company_id = public.auth_company_id())
                    with check (company_id = public.auth_company_id())', t);
  end loop;
end $$;

-- 5) Kosongkan data uji lama (companies & super_admins TIDAK disentuh)
truncate table
  transaction_items, po_items, product_batches, product_suppliers,
  pemusnahan, retur_supplier, faktur, transactions, purchase_orders,
  products, suppliers, settings, app_users
cascade;
