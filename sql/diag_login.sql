-- =====================================================================
-- TRACE / DIAGNOSA: kenapa akun tidak bisa login
-- Ganti email di bawah sesuai akun yang bermasalah, jalankan di Supabase SQL Editor.
-- =====================================================================

-- 1) Apakah akun ada di Auth & sudah dikonfirmasi?
--    Jika email_confirmed_at = NULL  -> INI penyebabnya (email belum dikonfirmasi).
select id, email, email_confirmed_at, created_at, last_sign_in_at
from auth.users
where email = 'hello@sejahtera.co.id';

-- 2) Status apotek (companies)
select nama, admin_email, status, valid_sampai
from public.companies
where admin_email = 'hello@sejahtera.co.id';

-- 3) Terdaftar di manajemen pengguna?
select nama, email, role, status
from public.app_users
where email = 'hello@sejahtera.co.id';

-- =====================================================================
-- FIX (pilih salah satu):
-- =====================================================================

-- A) Konfirmasi manual email akun ini (langsung bisa login):
-- update auth.users
--   set email_confirmed_at = now()
--   where email = 'hello@sejahtera.co.id' and email_confirmed_at is null;

-- B) Atau matikan konfirmasi email untuk SEMUA user ke depan:
--    Dashboard Supabase -> Authentication -> Providers -> Email -> "Confirm email" = OFF
