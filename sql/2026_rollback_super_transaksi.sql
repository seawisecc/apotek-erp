-- =====================================================================
-- Seawise Enterprise Apps (Pharmacy Store Edition)
-- ROLLBACK transaksi tes Super Admin  (v3 — pilih per ID / per apotek)
--
-- Temuan: email super (seawise.cc@gmail.com) terikat ke sebuah apotek
-- (Apotek Sejahtera). Karena RLS, transaksi tes super mendarat & hanya
-- mengurangi stok apotek TERSEBUT — apotek lain TIDAK terpengaruh (query
-- deteksi lintas-apotek = 0 baris). Jadi yang perlu dibalik hanyalah
-- transaksi tes di apotek itu.
--
-- Transaksi tes tercampur dengan data apotek itu, jadi cara teraman:
-- LIHAT daftarnya (Langkah 1) lalu BALIK berdasarkan ID (Langkah 2A).
-- Jalankan di Supabase SQL Editor, blok per blok.
-- =====================================================================


-- ── LANGKAH 1: Lihat semua transaksi apotek yang terikat email super ────
-- Perhatikan created_at & isinya untuk mengenali mana transaksi tes kamu.
select
  t.id                as transaction_id,
  t.created_at,
  t.total,
  t.status,
  t.metode_bayar,
  string_agg(ti.nama_obat || ' x' || ti.jumlah, ', ') as isi
from public.transactions t
left join public.transaction_items ti on ti.transaction_id = t.id
where t.company_id = (
  select id from public.companies
  where lower(admin_email) = 'seawise.cc@gmail.com' limit 1
)
group by t.id, t.created_at, t.total, t.status, t.metode_bayar
order by t.created_at;


-- ── LANGKAH 2A (DIREKOMENDASIKAN): balik transaksi berdasarkan ID ───────
-- Tempel transaction_id dari Langkah 1 yang ingin dibatalkan ke dalam array.
-- Stok tiap itemnya dikembalikan, lalu transaksinya ditandai 'dibatalkan'.
do $$
declare
  ids uuid[] := array[
    -- tempel ID di sini, pisahkan dengan koma, contoh:
    -- 'aaaaaaaa-1111-2222-3333-444444444444',
    -- 'bbbbbbbb-5555-6666-7777-888888888888'
  ]::uuid[];
  r record;
  n_trx int := 0;
  n_qty bigint := 0;
begin
  if array_length(ids, 1) is null then
    raise notice 'Belum ada ID yang diisi di array "ids". Tidak ada yang diproses.';
    return;
  end if;

  for r in
    select ti.product_id, ti.jumlah
    from public.transaction_items ti
    where ti.transaction_id = any(ids)
      and ti.product_id is not null
  loop
    update public.products
      set stok_total = coalesce(stok_total, 0) + r.jumlah
      where id = r.product_id;
    n_qty := n_qty + r.jumlah;
  end loop;

  update public.transactions
    set status = 'dibatalkan'
    where id = any(ids)
      and status is distinct from 'dibatalkan';
  get diagnostics n_trx = row_count;

  raise notice 'Selesai: % transaksi dibatalkan, % unit stok dikembalikan.', n_trx, n_qty;
end $$;


-- ── LANGKAH 2B (opsional): balik SEMUA transaksi apotek tsb ─────────────
-- Pakai HANYA bila apotek yang terikat email super memang apotek UJI kamu
-- dan seluruh transaksinya boleh dihapus. Aman diulang.
--
-- do $$
-- declare
--   cid uuid;
--   r record; n_trx int := 0; n_qty bigint := 0;
-- begin
--   select id into cid from public.companies
--     where lower(admin_email) = 'seawise.cc@gmail.com' limit 1;
--   if cid is null then raise notice 'Email super tidak terkait apotek.'; return; end if;
--
--   create temp table _t on commit drop as
--     select id from public.transactions
--     where company_id = cid and status is distinct from 'dibatalkan';
--
--   for r in
--     select ti.product_id, ti.jumlah from public.transaction_items ti
--     where ti.transaction_id in (select id from _t) and ti.product_id is not null
--   loop
--     update public.products set stok_total = coalesce(stok_total,0) + r.jumlah where id = r.product_id;
--     n_qty := n_qty + r.jumlah;
--   end loop;
--
--   update public.transactions set status='dibatalkan' where id in (select id from _t);
--   get diagnostics n_trx = row_count;
--   raise notice 'Apotek %: % transaksi dibatalkan, % unit stok dikembalikan.', cid, n_trx, n_qty;
-- end $$;


-- ── LANGKAH 3 (opsional): hapus permanen transaksi yang sudah dibatalkan ─
-- Stok SUDAH dikembalikan di Langkah 2. Ini hanya membersihkan barisnya.
-- Ganti daftar ID sesuai yang kamu balik, lalu hapus tanda komentar.
--
-- delete from public.transaction_items where transaction_id = any(array[
--   -- 'aaaaaaaa-1111-2222-3333-444444444444'
-- ]::uuid[]);
-- delete from public.transactions where id = any(array[
--   -- 'aaaaaaaa-1111-2222-3333-444444444444'
-- ]::uuid[]) and status = 'dibatalkan';
