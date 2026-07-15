-- =====================================================================
-- Seawise Enterprise Apps (Pharmacy Store Edition)
-- Migration: Izinkan Super Admin menulis data ke apotek mana pun
-- (untuk membantu migrasi/onboarding client). Jalankan di Supabase SQL Editor.
-- =====================================================================

-- Apakah user yang login adalah super admin?
create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.super_admins
    where lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

-- Perbarui policy semua tabel data: izinkan bila company milik user ATAU super admin
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
    execute format('drop policy if exists "tenant_all" on public.%I', t);
    execute format('create policy "tenant_all" on public.%I
      for all
      using (company_id = public.auth_company_id() or public.is_super_admin())
      with check (company_id = public.auth_company_id() or public.is_super_admin())', t);
  end loop;
end $$;
