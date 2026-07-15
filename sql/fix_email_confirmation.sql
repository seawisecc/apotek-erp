-- =====================================================================
-- FIX: login "Email atau password salah" karena email belum dikonfirmasi
-- Jalankan di Supabase SQL Editor (project hosted).
-- =====================================================================

-- -------------------------------------------------------------
-- 1) SEKARANG: konfirmasi semua user yang belum terkonfirmasi
--    (langsung bisa login). Aman dijalankan berulang.
-- -------------------------------------------------------------
update auth.users
  set email_confirmed_at = now()
  where email_confirmed_at is null;

-- Atau khusus satu akun saja:
-- update auth.users set email_confirmed_at = now()
--   where email = 'hello@sejahtera.co.id' and email_confirmed_at is null;


-- -------------------------------------------------------------
-- 2) KE DEPAN: auto-konfirmasi setiap user baru (pengganti toggle
--    "Confirm email = OFF"). Dengan ini pendaftar/karyawan baru
--    langsung bisa login tanpa verifikasi email.
-- -------------------------------------------------------------
create or replace function public.auto_confirm_email()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.email_confirmed_at is null then
    new.email_confirmed_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_confirm_email on auth.users;
create trigger trg_auto_confirm_email
  before insert on auth.users
  for each row execute function public.auto_confirm_email();

-- -------------------------------------------------------------
-- (Opsional) Untuk MEMBATALKAN auto-konfirmasi di kemudian hari:
-- drop trigger if exists trg_auto_confirm_email on auth.users;
-- drop function if exists public.auto_confirm_email();
-- =====================================================================
