-- =====================================================================
-- Seawise Enterprise Apps (Pharmacy Store Edition)
-- RESET DATA UJI — kosongkan semua data operasional & katalog
--
-- Menghapus: produk, batch, supplier, mapping, transaksi, PO, faktur,
-- pemusnahan, retur, layanan jasa.
-- MEMPERTAHANKAN: companies, super_admins, app_users, settings
--   (supaya akun login, daftar apotek, & pengaturan tetap ada).
--
-- Jalankan di Supabase SQL Editor. Setelah ini semua apotek mulai kosong,
-- siap kamu isi ulang untuk uji coba.
-- =====================================================================

truncate table
  public.transaction_items,
  public.transactions,
  public.po_items,
  public.purchase_orders,
  public.faktur,
  public.product_batches,
  public.product_suppliers,
  public.pemusnahan,
  public.retur_supplier,
  public.services,
  public.products,
  public.suppliers
restart identity cascade;

-- Catatan:
--  • 'restart identity' mereset counter (mis. nomor urut) bila ada.
--  • 'cascade' menuntaskan baris turunan yang mereferensikan tabel di atas.
--  • Jika ingin IKUT mengosongkan pengaturan apotek, tambahkan baris
--    berikut (hapus tanda komentar):
--        truncate table public.settings restart identity cascade;
--  • Jika ingin IKUT menghapus semua user apotek (SELAIN super admin),
--    tambahkan (hati-hati):
--        truncate table public.app_users restart identity cascade;
