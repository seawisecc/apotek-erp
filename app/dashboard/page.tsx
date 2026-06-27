'use client'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Pill, ShoppingCart, PackageOpen, BarChart2, LogOut, Settings, Truck
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'produk', label: 'Produk & Stok', icon: Pill },
  { id: 'transaksi', label: 'Transaksi', icon: ShoppingCart },
  { id: 'pembelian', label: 'Pembelian', icon: PackageOpen },
  { id: 'supplier', label: 'Supplier', icon: Truck },
  { id: 'laporan', label: 'Laporan', icon: BarChart2 },
  { id: 'pengaturan', label: 'Pengaturan', icon: Settings },
]

export default function Dashboard() {
  const [activePage, setActivePage] = useState('dashboard')
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    nama_obat: '', nama_generik: '', kandungan: '',
    kategori: 'bebas', satuan: 'Tablet', isi_kemasan: 1,
    harga_beli: 0, harga_jual: 0, stok_total: 0, stok_minimum: 10
  })
  const [keranjang, setKeranjang] = useState<any[]>([])
  const [bayar, setBayar] = useState(0)
  const [prosesLoading, setProsesLoading] = useState(false)
  const [showStruk, setShowStruk] = useState(false)
  const [lastTrx, setLastTrx] = useState<any>(null)
  const [lastItems, setLastItems] = useState<any[]>([])
  const [riwayat, setRiwayat] = useState<any[]>([])
  const [statProduk, setStatProduk] = useState(0)
  const [statTrxHariIni, setStatTrxHariIni] = useState(0)
  const [statOmzet, setStatOmzet] = useState(0)
  const [settingsData, setSettingsData] = useState<any>({
    nama_apotek: '', alamat: '', nomor_ijin: '', nomor_telepon: ''
  })
  const [suppliers, setSuppliers] = useState<any[]>([])
  const [showSupplierForm, setShowSupplierForm] = useState(false)
  const [supplierForm, setSupplierForm] = useState({
    nama_supplier: '', jenis: 'PBF', alamat: '', telepon: '', email: ''
  })
  const [editProduk, setEditProduk] = useState<any>(null)
  const [produkSuppliers, setProdukSuppliers] = useState<any[]>([])

  useEffect(() => { fetchSettings() }, [])
  useEffect(() => { if (activePage === 'dashboard') fetchStats() }, [activePage])
  useEffect(() => { if (activePage === 'produk') fetchProducts() }, [activePage])
  useEffect(() => { if (activePage === 'laporan') fetchRiwayat() }, [activePage])
  useEffect(() => { if (activePage === 'supplier') fetchSuppliers() }, [activePage])
  useEffect(() => { if (activePage === 'pembelian') { fetchPOList(); fetchSuppliers() } }, [activePage])

  // PO States
  const [poList, setPoList] = useState<any[]>([])
  const [showPOForm, setShowPOForm] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null)
  const [supplierProducts, setSupplierProducts] = useState<any[]>([])
  const [poItems, setPoItems] = useState<any[]>([])
  const [poCatatan, setPoCatatan] = useState('')
  const [showPenerimaan, setShowPenerimaan] = useState<any>(null)
  const [showPODetail, setShowPODetail] = useState<any>(null)
  const [penerimaanItems, setPenerimaanItems] = useState<any[]>([])

  const fetchPOList = async () => {
    const { data } = await supabase.from('purchase_orders').select('*, suppliers(nama_supplier, kode, alamat, telepon)').order('created_at', { ascending: false })
    setPoList(data || [])
  }

  const fetchSupplierProducts = async (supplierId: string) => {
    const { data } = await supabase.from('product_suppliers').select('*, products(*)').eq('supplier_id', supplierId)
    setSupplierProducts(data?.map((d: any) => d.products) || [])
  }

  const addPoItem = (product: any) => {
    const exists = poItems.find(i => i.product_id === product.id)
    if (exists) return
    setPoItems([...poItems, {
      product_id: product.id,
      nama_produk: product.nama_obat,
      satuan: product.satuan,
      qty_pesan: 1,
      harga_beli: product.harga_beli || 0,
      subtotal: product.harga_beli || 0
    }])
  }

  const updatePoItem = (idx: number, field: string, value: number) => {
    const updated = [...poItems]
    updated[idx] = { ...updated[idx], [field]: value }
    updated[idx].subtotal = updated[idx].qty_pesan * updated[idx].harga_beli
    setPoItems(updated)
  }

  const submitPO = async () => {
    if (!selectedSupplier || poItems.length === 0) return alert('Pilih supplier dan tambah produk dulu!')
    const total_nilai = poItems.reduce((a, b) => a + b.subtotal, 0)
    const { data: po, error } = await supabase.from('purchase_orders').insert([{ supplier_id: selectedSupplier.id, total_nilai, catatan: poCatatan }]).select().single()
    if (error) { alert('Error: ' + error.message); return }
    await supabase.from('po_items').insert(poItems.map(i => ({ ...i, po_id: po.id })))
    setShowPOForm(false); setSelectedSupplier(null); setPoItems([]); setPoCatatan(''); setSupplierProducts([])
    fetchPOList()
    alert(`✅ PO ${po.nomor_po} berhasil dibuat!`)
  }

  const openPenerimaan = async (po: any) => {
    const { data: items } = await supabase.from('po_items').select('*, products(nama_obat, stok_total)').eq('po_id', po.id)
    setPenerimaanItems(items?.map((item: any) => ({
      ...item,
      qty_terima: item.qty_terima || item.qty_pesan,
      batch_number: item.batch_number || '',
      expired_date: item.expired_date || '',
      harga_beli: item.harga_beli || 0,
    })) || [])
    setShowPenerimaan(po)
  }

  const submitPenerimaan = async (closePO: boolean) => {
    if (!showPenerimaan) return
    for (const item of penerimaanItems) {
      if (item.qty_terima > 0) {
        // Update stok produk
        await supabase.from('products').update({
          stok_total: (item.products?.stok_total || 0) + item.qty_terima,
          harga_beli: item.harga_beli
        }).eq('id', item.product_id)

        // Catat ke product_batches
        if (item.batch_number && item.expired_date) {
          await supabase.from('product_batches').insert([{
            product_id: item.product_id,
            batch_number: item.batch_number,
            expired_date: item.expired_date,
            stok_batch: item.qty_terima
          }])
        }

        // Update po_items
        await supabase.from('po_items').update({
          qty_terima: item.qty_terima,
          batch_number: item.batch_number,
          expired_date: item.expired_date,
          harga_beli: item.harga_beli,
          subtotal: item.qty_terima * item.harga_beli
        }).eq('id', item.id)
      }
    }

    const newStatus = closePO ? 'selesai' : 'dikirim'
    const newStatusPenerimaan = closePO ? 'selesai' : 'partial'
    await supabase.from('purchase_orders').update({
      status: newStatus,
      status_penerimaan: newStatusPenerimaan,
      tanggal_terima: new Date().toISOString().split('T')[0]
    }).eq('id', showPenerimaan.id)

    setShowPenerimaan(null)
    setPenerimaanItems([])
    fetchPOList()
    alert(closePO ? '✅ PO selesai! Stok dan batch sudah diupdate.' : '✅ Penerimaan parsial disimpan. PO masih terbuka.')
  }

  const printPO = async (po: any) => {
    const { data: items } = await supabase.from('po_items').select('*').eq('po_id', po.id)
    const supplier = po.suppliers
    const win = window.open('', '_blank', 'width=800,height=900')
    win?.document.write(`<html><head><title>PO - ${po.nomor_po}</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:Arial,sans-serif;font-size:12px;padding:32px;}
      .header{display:flex;justify-content:space-between;margin-bottom:24px;}
      h1{font-size:18px;font-weight:bold;margin-bottom:4px;}
      table{width:100%;border-collapse:collapse;margin:16px 0;}
      th{background:#1a2e2e;color:white;padding:8px;text-align:left;font-size:11px;}
      td{padding:8px;border-bottom:1px solid #eee;font-size:11px;}
      .total-row td{font-weight:bold;border-top:2px solid #1a2e2e;}
      .divider{border-top:2px solid #1a2e2e;margin:12px 0;}
      .ttd{margin-top:48px;display:flex;justify-content:space-between;}
      .ttd-box{text-align:center;}
      .ttd-line{border-top:1px solid black;width:200px;margin:48px auto 4px;}
    </style></head><body>
    <div class="header">
      <div>
        <h1>${settingsData.nama_apotek}</h1>
        <p>${settingsData.alamat}</p>
        <p>SIA: ${settingsData.nomor_ijin} | Telp: ${settingsData.nomor_telepon}</p>
      </div>
      <div style="text-align:right;">
        <h1>PURCHASE ORDER</h1>
        <p><b>No. PO:</b> ${po.nomor_po}</p>
        <p><b>Tanggal:</b> ${new Date(po.tanggal_po || po.created_at).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}</p>
        <p><b>Status:</b> ${po.status?.toUpperCase()}</p>
      </div>
    </div>
    <div class="divider"></div>
    <div style="margin:12px 0;">
      <p><b>Kepada Yth:</b></p>
      <p>${supplier?.nama_supplier || '-'}</p>
      <p>${supplier?.alamat || ''}</p>
      <p>${supplier?.telepon || ''}</p>
    </div>
    <table>
      <thead><tr><th>No</th><th>Nama Produk</th><th>Satuan</th><th>Qty</th><th>Harga Beli</th><th>Subtotal</th></tr></thead>
      <tbody>
        ${items?.map((item: any, i: number) => `<tr>
          <td>${i+1}</td><td>${item.nama_produk}</td><td>${item.satuan}</td>
          <td>${item.qty_pesan}</td>
          <td>Rp ${item.harga_beli?.toLocaleString('id-ID')}</td>
          <td>Rp ${item.subtotal?.toLocaleString('id-ID')}</td>
        </tr>`).join('')}
        <tr class="total-row"><td colspan="5">TOTAL</td><td>Rp ${po.total_nilai?.toLocaleString('id-ID')}</td></tr>
      </tbody>
    </table>
    ${po.catatan ? `<p><b>Catatan:</b> ${po.catatan}</p>` : ''}
    <div class="ttd">
      <div class="ttd-box">
        <p>Hormat kami,</p>
        <div class="ttd-line"></div>
        <p><b>${settingsData.nama_apoteker || 'Apoteker'}</b></p>
        <p>SIPA: ${settingsData.nomor_sipa || '-'}</p>
      </div>
      <div class="ttd-box">
        <p>Diterima oleh,</p>
        <div class="ttd-line"></div>
        <p><b>${supplier?.nama_supplier || '-'}</b></p>
      </div>
    </div>
    </body></html>`)
    win?.document.close(); win?.print()
  }

  const statusPOColor: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-700',
    dikirim: 'bg-blue-100 text-blue-700',
    selesai: 'bg-green-100 text-green-700',
    dibatalkan: 'bg-red-100 text-red-700',
  }

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*').single()
    if (data) setSettingsData(data)
  }

  const fetchStats = async () => {
    const { count: produkCount } = await supabase.from('products').select('*', { count: 'exact', head: true })
    setStatProduk(produkCount || 0)
    const today = new Date().toISOString().split('T')[0]
    const { data: trxHariIni } = await supabase.from('transactions').select('total').gte('created_at', today)
    setStatTrxHariIni(trxHariIni?.length || 0)
    setStatOmzet(trxHariIni?.reduce((a: number, b: any) => a + b.total, 0) || 0)
  }

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase.from('products').select('*').order('kode')
    setProducts(data || [])
    setLoading(false)
  }

  const fetchRiwayat = async () => {
    const { data } = await supabase.from('transactions').select('*').order('created_at', { ascending: false })
    setRiwayat(data || [])
  }

  const fetchSuppliers = async () => {
    const { data } = await supabase.from('suppliers').select('*').order('kode')
    setSuppliers(data || [])
  }

  const fetchProdukSuppliers = async (productId: string) => {
    const { data } = await supabase.from('product_suppliers').select('*, suppliers(*)').eq('product_id', productId)
    setProdukSuppliers(data || [])
  }

  const toggleSupplierProduk = async (productId: string, supplierId: string, isActive: boolean) => {
    if (isActive) {
      await supabase.from('product_suppliers').delete().eq('product_id', productId).eq('supplier_id', supplierId)
    } else {
      await supabase.from('product_suppliers').insert([{ product_id: productId, supplier_id: supplierId }])
    }
    fetchProdukSuppliers(productId)
  }

  const handleTambahProduk = async () => {
    const { error } = await supabase.from('products').insert([form])
    if (!error) {
      setShowForm(false)
      setForm({ nama_obat: '', nama_generik: '', kandungan: '', kategori: 'bebas', satuan: 'Tablet', isi_kemasan: 1, harga_beli: 0, harga_jual: 0, stok_total: 0, stok_minimum: 10 })
      fetchProducts()
    }
  }

  const handleTambahSupplier = async () => {
    const { error } = await supabase.from('suppliers').insert([supplierForm])
    if (!error) {
      setShowSupplierForm(false)
      setSupplierForm({ nama_supplier: '', jenis: 'PBF', alamat: '', telepon: '', email: '' })
      fetchSuppliers()
    }
  }

  const filteredProducts = products.filter(p =>
    p.nama_obat?.toLowerCase().includes(search.toLowerCase()) ||
    p.nama_generik?.toLowerCase().includes(search.toLowerCase()) ||
    p.kandungan?.toLowerCase().includes(search.toLowerCase())
  )

  const kategoriLabel: Record<string, string> = {
    bebas: 'Bebas', bebas_terbatas: 'Bebas Terbatas', keras: 'Keras',
    suplemen: 'Suplemen', psikotropika: 'Psikotropika', narkotika: 'Narkotika',
    prekursor: 'Prekursor', alkes: 'Alkes', lainnya: 'Lainnya',
  }

  return (
    <>
      {/* Modal Edit Produk */}
      {editProduk && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#1a2e2e] mb-4">Edit Produk — {editProduk.kode}</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Nama Obat</label>
                  <input value={editProduk.nama_obat} onChange={e => setEditProduk({...editProduk, nama_obat: e.target.value})}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Nama Generik</label>
                  <input value={editProduk.nama_generik || ''} onChange={e => setEditProduk({...editProduk, nama_generik: e.target.value})}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#6b7280] mb-1 block">Kandungan</label>
                <input value={editProduk.kandungan || ''} onChange={e => setEditProduk({...editProduk, kandungan: e.target.value})}
                  className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Harga Beli</label>
                  <input type="number" value={editProduk.harga_beli} onChange={e => setEditProduk({...editProduk, harga_beli: +e.target.value})}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Harga Jual</label>
                  <input type="number" value={editProduk.harga_jual} onChange={e => setEditProduk({...editProduk, harga_jual: +e.target.value})}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Stok</label>
                  <input type="number" value={editProduk.stok_total} onChange={e => setEditProduk({...editProduk, stok_total: +e.target.value})}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6b7280] mb-1 block">Stok Minimum</label>
                  <input type="number" value={editProduk.stok_minimum} onChange={e => setEditProduk({...editProduk, stok_minimum: +e.target.value})}
                    className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                </div>
              </div>

              {/* Assign Supplier */}
              <div className="border-t border-[#f0ede6] pt-3">
                <label className="text-xs font-medium text-[#6b7280] mb-2 block">Supplier Produk Ini</label>
                {suppliers.length === 0 ? (
                  <p className="text-xs text-[#9ca3af]">Belum ada supplier — tambah di menu Supplier dulu</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {suppliers.map(s => {
                      const isActive = produkSuppliers.some(ps => ps.supplier_id === s.id)
                      return (
                        <div key={s.id} onClick={() => toggleSupplierProduk(editProduk.id, s.id, isActive)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer border transition ${
                            isActive ? 'border-[#1a2e2e] bg-[#f5f2eb]' : 'border-[#d1cdc4] hover:bg-gray-50'
                          }`}>
                          <div>
                            <div className="text-sm font-medium text-[#1a2e2e]">{s.nama_supplier}</div>
                            <div className="text-xs text-[#9ca3af]">{s.jenis} · {s.kode}</div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isActive ? 'border-[#1a2e2e] bg-[#1a2e2e]' : 'border-[#d1cdc4]'
                          }`}>
                            {isActive && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setEditProduk(null); setProdukSuppliers([]) }}
                className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">Batal</button>
              <button onClick={async () => {
                const { error } = await supabase.from('products').update({
                  nama_obat: editProduk.nama_obat, nama_generik: editProduk.nama_generik,
                  kandungan: editProduk.kandungan, harga_beli: editProduk.harga_beli,
                  harga_jual: editProduk.harga_jual, stok_total: editProduk.stok_total,
                  stok_minimum: editProduk.stok_minimum,
                }).eq('id', editProduk.id)
                if (!error) { setEditProduk(null); setProdukSuppliers([]); fetchProducts() }
              }} className="flex-1 bg-[#1a2e2e] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium">
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detail PO */}
{showPODetail && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#1a2e2e]">Detail PO</h2>
          <p className="text-xs text-[#6b7280]">{showPODetail.nomor_po}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusPOColor[showPODetail.status] || 'bg-gray-100 text-gray-600'}`}>
          {showPODetail.status}
        </span>
      </div>

      {/* Info PO */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-4 bg-[#f5f2eb] rounded-xl text-sm">
        <div>
          <p className="text-xs text-[#6b7280] mb-0.5">Supplier</p>
          <p className="font-medium text-[#1a2e2e]">{showPODetail.suppliers?.nama_supplier}</p>
        </div>
        <div>
          <p className="text-xs text-[#6b7280] mb-0.5">Tanggal PO</p>
          <p className="font-medium text-[#1a2e2e]">
            {new Date(showPODetail.tanggal_po || showPODetail.created_at).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'})}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#6b7280] mb-0.5">Tanggal Terima</p>
          <p className="font-medium text-[#1a2e2e]">
            {showPODetail.tanggal_terima ? new Date(showPODetail.tanggal_terima).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'}) : '-'}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#6b7280] mb-0.5">Total Nilai</p>
          <p className="font-bold text-[#1a2e2e]">Rp {showPODetail.total_nilai?.toLocaleString('id-ID')}</p>
        </div>
        {showPODetail.catatan && (
          <div className="col-span-2">
            <p className="text-xs text-[#6b7280] mb-0.5">Catatan</p>
            <p className="text-[#1a2e2e]">{showPODetail.catatan}</p>
          </div>
        )}
      </div>

      {/* Tabel Item */}
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="bg-[#1a2e2e]">
            <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">Produk</th>
            <th className="text-center px-3 py-2 text-xs text-[#e8e4d9]">Qty Pesan</th>
            <th className="text-center px-3 py-2 text-xs text-[#e8e4d9]">Qty Terima</th>
            <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">No. Batch</th>
            <th className="text-left px-3 py-2 text-xs text-[#e8e4d9]">Expired</th>
            <th className="text-right px-3 py-2 text-xs text-[#e8e4d9]">Harga Beli</th>
            <th className="text-right px-3 py-2 text-xs text-[#e8e4d9]">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {showPODetail.items?.map((item: any, i: number) => (
            <tr key={i} className="border-b border-[#f0ede6] hover:bg-[#faf9f6]">
              <td className="px-3 py-2 font-medium text-[#1a2e2e]">{item.nama_produk}</td>
              <td className="px-3 py-2 text-center text-[#6b7280]">{item.qty_pesan} {item.satuan}</td>
              <td className="px-3 py-2 text-center">
                <span className={`font-medium ${item.qty_terima < item.qty_pesan ? 'text-yellow-600' : 'text-green-600'}`}>
                  {item.qty_terima || 0} {item.satuan}
                </span>
              </td>
              <td className="px-3 py-2 text-[#6b7280] font-mono text-xs">{item.batch_number || '-'}</td>
              <td className="px-3 py-2 text-[#6b7280] text-xs">
                {item.expired_date ? new Date(item.expired_date).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'}) : '-'}
              </td>
              <td className="px-3 py-2 text-right text-[#1a2e2e]">Rp {item.harga_beli?.toLocaleString('id-ID')}</td>
              <td className="px-3 py-2 text-right font-medium text-[#1a2e2e]">Rp {item.subtotal?.toLocaleString('id-ID')}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-[#1a2e2e] bg-[#f5f2eb]">
            <td colSpan={6} className="px-3 py-2 font-bold text-sm text-[#1a2e2e]">TOTAL</td>
            <td className="px-3 py-2 text-right font-bold text-[#1a2e2e]">
              Rp {showPODetail.items?.reduce((a: number, b: any) => a + (b.subtotal || 0), 0).toLocaleString('id-ID')}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex gap-3">
        <button onClick={() => setShowPODetail(null)}
          className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">Tutup</button>
        <button onClick={() => { printPO(showPODetail); }}
          className="flex-1 bg-[#1a2e2e] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium">🖨️ Print PO</button>
      </div>
    </div>
  </div>
)}
{/* Modal Penerimaan Barang */}
      {showPenerimaan && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-[#1a2e2e]">Penerimaan Barang</h2>
                <p className="text-xs text-[#6b7280]">PO: {showPenerimaan.nomor_po} · {showPenerimaan.suppliers?.nama_supplier}</p>
              </div>
            </div>

            <table className="w-full text-sm mb-4">
              <thead>
                <tr className="bg-[#f5f2eb]">
                  <th className="text-left px-3 py-2 text-xs text-[#6b7280]">Produk</th>
                  <th className="text-center px-3 py-2 text-xs text-[#6b7280]">Qty PO</th>
                  <th className="text-center px-3 py-2 text-xs text-[#6b7280]">Qty Terima</th>
                  <th className="text-left px-3 py-2 text-xs text-[#6b7280]">No. Batch</th>
                  <th className="text-left px-3 py-2 text-xs text-[#6b7280]">Expired Date</th>
                  <th className="text-right px-3 py-2 text-xs text-[#6b7280]">Harga Beli</th>
                </tr>
              </thead>
              <tbody>
                {penerimaanItems.map((item, idx) => (
                  <tr key={idx} className="border-t border-[#f0ede6]">
                    <td className="px-3 py-2">
                      <div className="font-medium text-[#1a2e2e] text-sm">{item.nama_produk}</div>
                      <div className="text-xs text-[#9ca3af]">{item.satuan}</div>
                    </td>
                    <td className="px-3 py-2 text-center text-[#6b7280]">{item.qty_pesan}</td>
                    <td className="px-3 py-2">
                      <input type="number" min={0} max={item.qty_pesan} value={item.qty_terima}
                        onChange={e => {
                          const updated = [...penerimaanItems]
                          updated[idx].qty_terima = +e.target.value
                          setPenerimaanItems(updated)
                        }}
                        className="w-16 text-center border border-[#d1cdc4] rounded px-1 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2e2e]" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="text" value={item.batch_number} placeholder="BT-001"
                        onChange={e => {
                          const updated = [...penerimaanItems]
                          updated[idx].batch_number = e.target.value
                          setPenerimaanItems(updated)
                        }}
                        className="w-28 border border-[#d1cdc4] rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2e2e]" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="date" value={item.expired_date}
                        onChange={e => {
                          const updated = [...penerimaanItems]
                          updated[idx].expired_date = e.target.value
                          setPenerimaanItems(updated)
                        }}
                        className="w-36 border border-[#d1cdc4] rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2e2e]" />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" value={item.harga_beli}
                        onChange={e => {
                          const updated = [...penerimaanItems]
                          updated[idx].harga_beli = +e.target.value
                          setPenerimaanItems(updated)
                        }}
                        className="w-28 text-right border border-[#d1cdc4] rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[#1a2e2e]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="bg-[#f5f2eb] rounded-lg p-3 mb-4 text-xs text-[#6b7280]">
              <p>💡 <b>Penerimaan Parsial:</b> Isi qty terima sesuai barang yang datang. Klik "Simpan Parsial" jika ada sisa yang belum datang, atau "Tutup PO" jika selesai.</p>
            </div>

            <div className="flex gap-3">
              <button onClick={() => { setShowPenerimaan(null); setPenerimaanItems([]) }}
                className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">Batal</button>
              <button onClick={async () => {
                await supabase.from('purchase_orders').update({ status: 'dibatalkan' }).eq('id', showPenerimaan.id)
                setShowPenerimaan(null); setPenerimaanItems([]); fetchPOList()
              }} className="px-4 border border-red-200 text-red-500 py-2 rounded-lg text-sm hover:bg-red-50 transition">
                Batalkan PO
              </button>
              <button onClick={() => submitPenerimaan(false)}
                className="flex-1 border-2 border-[#1a2e2e] text-[#1a2e2e] py-2 rounded-lg text-sm font-medium hover:bg-[#f5f2eb] transition">
                Simpan Parsial
              </button>
              <button onClick={() => submitPenerimaan(true)}
                className="flex-1 bg-[#1a2e2e] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium hover:bg-[#2a4040] transition">
                Terima & Tutup PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Struk */}
      {showStruk && lastTrx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
            <div id="struk-print" className="p-6">
              <div className="text-center mb-4 border-b border-dashed border-gray-300 pb-4">
                <h2 className="font-bold text-lg text-[#1a2e2e]">{settingsData.nama_apotek}</h2>
                <p className="text-xs text-gray-500 mt-1">{settingsData.alamat}</p>
                <p className="text-xs text-gray-500">{settingsData.nomor_telepon}</p>
                {settingsData.nomor_ijin && <p className="text-xs text-gray-400 mt-1">SIA: {settingsData.nomor_ijin}</p>}
              </div>
              <div className="text-xs text-gray-500 mb-3 flex justify-between">
                <span>{lastTrx.nomor_transaksi}</span>
                <span>{new Date().toLocaleString('id-ID')}</span>
              </div>
              <div className="border-t border-dashed border-gray-300 pt-3 space-y-1.5">
                {lastItems.map((item, i) => (
                  <div key={i} className="text-xs">
                    <div className="flex justify-between text-[#1a2e2e] font-medium">
                      <span>{item.nama_obat}</span>
                      <span>Rp {item.subtotal?.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-gray-400">{item.jumlah} x Rp {item.harga_jual?.toLocaleString('id-ID')}</div>
                  </div>
                ))}
              </div>
              <div className="border-t border-dashed border-gray-300 mt-3 pt-3 space-y-1 text-xs">
                <div className="flex justify-between font-bold text-sm text-[#1a2e2e]">
                  <span>Total</span><span>Rp {lastTrx.total?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Bayar</span><span>Rp {lastTrx.bayar?.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Kembalian</span><span>Rp {lastTrx.kembalian?.toLocaleString('id-ID')}</span>
                </div>
              </div>
              <p className="text-center text-xs text-gray-400 mt-4 border-t border-dashed border-gray-300 pt-3">
                Terima kasih atas kunjungan Anda
              </p>
            </div>
            <div className="flex gap-2 p-4 border-t border-gray-100">
              <button onClick={() => setShowStruk(false)}
                className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">Tutup</button>
              <button onClick={() => {
                const win = window.open('', '_blank', 'width=350,height=600')
                win?.document.write(`<html><head><title>Struk</title><style>
                  * { margin:0; padding:0; box-sizing:border-box; }
                  body { font-family:'Courier New',monospace; font-size:12px; padding:16px; width:300px; }
                  h2 { font-size:13px; text-align:center; font-weight:bold; margin-bottom:2px; }
                  p { text-align:center; font-size:10px; color:#555; margin:1px 0; }
                  .divider { border-top:1px dashed #999; margin:8px 0; }
                  .row { display:flex; justify-content:space-between; margin:2px 0; }
                  .bold { font-weight:bold; }
                  .small { font-size:10px; color:#555; }
                </style></head><body>
                  <h2>${settingsData.nama_apotek}</h2>
                  <p>${settingsData.alamat}</p>
                  <p>SIA: ${settingsData.nomor_ijin}</p>
                  <p>Telp: ${settingsData.nomor_telepon}</p>
                  <div class="divider"></div>
                  <div class="row small"><span>No.</span><span>${lastTrx?.nomor_transaksi}</span></div>
                  <div class="row small"><span>Waktu</span><span>${new Date().toLocaleString('id-ID')}</span></div>
                  <div class="divider"></div>
                  ${lastItems.map(item => `
                    <div style="margin:4px 0;">
                      <div class="bold" style="font-size:11px;">${item.nama_obat}</div>
                      <div class="row small">
                        <span>${item.jumlah} x Rp ${item.harga_jual?.toLocaleString('id-ID')}</span>
                        <span>Rp ${item.subtotal?.toLocaleString('id-ID')}</span>
                      </div>
                    </div>`).join('')}
                  <div class="divider"></div>
                  <div class="row bold"><span>TOTAL</span><span>Rp ${lastTrx?.total?.toLocaleString('id-ID')}</span></div>
                  <div class="row small"><span>Bayar</span><span>Rp ${lastTrx?.bayar?.toLocaleString('id-ID')}</span></div>
                  <div class="row small" style="color:green;"><span>Kembalian</span><span>Rp ${lastTrx?.kembalian?.toLocaleString('id-ID')}</span></div>
                  <div class="divider"></div>
                  <p style="margin-top:8px;">Terima kasih atas kunjungan Anda</p>
                  <p>Semoga lekas sembuh</p>
                </body></html>`)
                win?.document.close()
                win?.print()
              }} className="flex-1 bg-[#1a2e2e] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium">
                🖨️ Print
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#f5f2eb] flex">
        {/* Sidebar */}
        <div className="w-64 bg-[#1a2e2e] flex flex-col">
          <div className="px-6 py-5 border-b border-[#2a4040]">
            <div className="text-[#e8e4d9] font-semibold text-lg">ApotekERP</div>
            <div className="text-[#4a6e6e] text-xs mt-0.5">Sistem Manajemen Apotek</div>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <button key={item.id} onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-left ${
                    activePage === item.id ? 'bg-[#2a4040] text-[#e8e4d9] font-medium' : 'text-[#7a9e9e] hover:bg-[#2a4040] hover:text-[#e8e4d9]'
                  }`}>
                  <Icon size={16} /><span>{item.label}</span>
                </button>
              )
            })}
          </nav>
          <div className="px-6 py-4 border-t border-[#2a4040]">
            <div className="text-[#7a9e9e] text-xs">Masuk sebagai</div>
            <div className="text-[#e8e4d9] text-sm font-medium mt-0.5">admin@apotek.com</div>
            <button onClick={async () => { await supabase.auth.signOut(); window.location.href = '/' }}
              className="flex items-center gap-1.5 text-[#4a6e6e] text-xs mt-2 hover:text-[#e8e4d9] transition">
              <LogOut size={12} /> Keluar
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">

          {/* DASHBOARD */}
          {activePage === 'dashboard' && (
            <div>
              <h1 className="text-2xl font-bold text-[#1a2e2e] mb-1">Dashboard</h1>
              <p className="text-[#6b7280] text-sm mb-8">Ringkasan aktivitas apotek hari ini</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <p className="text-sm text-[#6b7280] mb-1">Total Produk</p>
                  <p className="text-3xl font-bold text-[#1a2e2e]">{statProduk}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <p className="text-sm text-[#6b7280] mb-1">Transaksi Hari Ini</p>
                  <p className="text-3xl font-bold text-[#1a2e2e]">{statTrxHariIni}</p>
                </div>
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <p className="text-sm text-[#6b7280] mb-1">Omzet Hari Ini</p>
                  <p className="text-2xl font-bold text-[#1a2e2e]">Rp {statOmzet.toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          )}

          {/* PRODUK */}
          {activePage === 'produk' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#1a2e2e] mb-1">Produk & Stok</h1>
                  <p className="text-[#6b7280] text-sm">Daftar semua produk obat di apotek</p>
                </div>
                <button onClick={() => setShowForm(true)}
                  className="bg-[#1a2e2e] text-[#e8e4d9] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2a4040] transition">
                  + Tambah Produk
                </button>
              </div>

              {showForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
                    <h2 className="text-lg font-bold text-[#1a2e2e] mb-4">Tambah Produk Baru</h2>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">Nama Obat *</label>
                          <input value={form.nama_obat} onChange={e => setForm({...form, nama_obat: e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">Nama Generik</label>
                          <input value={form.nama_generik} onChange={e => setForm({...form, nama_generik: e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#6b7280] mb-1 block">Kandungan / Komposisi</label>
                        <input value={form.kandungan} onChange={e => setForm({...form, kandungan: e.target.value})}
                          className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">Kategori</label>
                          <select value={form.kategori} onChange={e => setForm({...form, kategori: e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]">
                            <option value="bebas">Bebas</option>
                            <option value="bebas_terbatas">Bebas Terbatas</option>
                            <option value="keras">Keras</option>
                            <option value="suplemen">Suplemen</option>
                            <option value="psikotropika">Psikotropika</option>
                            <option value="narkotika">Narkotika</option>
                            <option value="prekursor">Prekursor</option>
                            <option value="alkes">Alkes</option>
                            <option value="lainnya">Lainnya</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">Satuan</label>
                          <select value={form.satuan} onChange={e => setForm({...form, satuan: e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]">
                            <option>Tablet</option><option>Kapsul</option><option>Botol</option>
                            <option>Sachet</option><option>Tube</option><option>Ampul</option><option>Vial</option>
                          </select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">Harga Beli</label>
                          <input type="number" value={form.harga_beli} onChange={e => setForm({...form, harga_beli: +e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">Harga Jual</label>
                          <input type="number" value={form.harga_jual} onChange={e => setForm({...form, harga_jual: +e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[#6b7280] mb-1 block">Stok Awal</label>
                          <input type="number" value={form.stok_total} onChange={e => setForm({...form, stok_total: +e.target.value})}
                            className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setShowForm(false)}
                        className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">Batal</button>
                      <button onClick={handleTambahProduk}
                        className="flex-1 bg-[#1a2e2e] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium">Simpan Produk</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <input type="text" placeholder="Cari nama obat, generik, atau kandungan..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full border border-[#d1cdc4] bg-white rounded-lg px-4 py-2.5 text-sm text-[#1a2e2e] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
              </div>

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f0ede6]">
                      <th className="text-left px-4 py-3 text-[#6b7280] font-medium">Kode</th>
                      <th className="text-left px-4 py-3 text-[#6b7280] font-medium">Nama Obat</th>
                      <th className="text-left px-4 py-3 text-[#6b7280] font-medium">Kategori</th>
                      <th className="text-left px-4 py-3 text-[#6b7280] font-medium">Satuan</th>
                      <th className="text-right px-4 py-3 text-[#6b7280] font-medium">H. Jual</th>
                      <th className="text-right px-4 py-3 text-[#6b7280] font-medium">Stok</th>
                      <th className="text-center px-4 py-3 text-[#6b7280] font-medium">Status</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr><td className="px-4 py-8 text-center text-[#9ca3af]" colSpan={8}>Memuat data...</td></tr>
                    ) : filteredProducts.length === 0 ? (
                      <tr><td className="px-4 py-8 text-center text-[#9ca3af]" colSpan={8}>Tidak ada produk ditemukan</td></tr>
                    ) : (
                      filteredProducts.map((p) => (
                        <tr key={p.id} className="border-b border-[#f0ede6] hover:bg-[#faf9f6]">
                          <td className="px-4 py-3 text-[#6b7280] font-mono text-xs">{p.kode}</td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-[#1a2e2e]">{p.nama_obat}</div>
                            <div className="text-xs text-[#9ca3af]">{p.nama_generik}</div>
                          </td>
                          <td className="px-4 py-3 text-[#6b7280]">{kategoriLabel[p.kategori] || p.kategori}</td>
                          <td className="px-4 py-3 text-[#6b7280]">{p.satuan}</td>
                          <td className="px-4 py-3 text-right text-[#1a2e2e]">Rp {p.harga_jual?.toLocaleString('id-ID')}</td>
                          <td className={`px-4 py-3 text-right font-medium ${p.stok_total <= p.stok_minimum ? 'text-red-500' : 'text-[#1a2e2e]'}`}>
                            {p.stok_total}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button onClick={() => {
                              setEditProduk(p)
                              fetchProdukSuppliers(p.id)
                              if (suppliers.length === 0) fetchSuppliers()
                            }} className="text-xs text-[#1a2e2e] hover:underline font-medium">Edit</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* KASIR */}
          {activePage === 'transaksi' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#1a2e2e] mb-1">Kasir</h1>
                  <p className="text-[#6b7280] text-sm">Transaksi penjualan obat</p>
                </div>
              </div>
              <div className="grid grid-cols-5 gap-6">
                <div className="col-span-3 space-y-4">
                  <div className="bg-white rounded-xl shadow-sm p-4">
                    <input type="text" placeholder="Cari obat by nama, generik, atau kandungan..."
                      value={search} onChange={(e) => { setSearch(e.target.value); if (e.target.value.length > 1) fetchProducts() }}
                      className="w-full border border-[#d1cdc4] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                    {search && (
                      <div className="mt-3 space-y-1 max-h-64 overflow-y-auto">
                        {filteredProducts.map(p => (
                          <div key={p.id} onClick={() => {
                            const exists = keranjang.find(k => k.id === p.id)
                            if (exists) { setKeranjang(keranjang.map(k => k.id === p.id ? {...k, jumlah: k.jumlah + 1} : k)) }
                            else { setKeranjang([...keranjang, {...p, jumlah: 1}]) }
                            setSearch('')
                          }} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#f5f2eb] cursor-pointer">
                            <div>
                              <div className="text-sm font-medium text-[#1a2e2e]">{p.nama_obat}</div>
                              <div className="text-xs text-[#9ca3af]">{p.nama_generik} · Stok: {p.stok_total}</div>
                            </div>
                            <div className="text-sm font-medium text-[#1a2e2e]">Rp {p.harga_jual?.toLocaleString('id-ID')}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#f0ede6]">
                          <th className="text-left px-4 py-3 text-[#6b7280] font-medium">Produk</th>
                          <th className="text-center px-4 py-3 text-[#6b7280] font-medium">Qty</th>
                          <th className="text-right px-4 py-3 text-[#6b7280] font-medium">Harga</th>
                          <th className="text-right px-4 py-3 text-[#6b7280] font-medium">Subtotal</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {keranjang.length === 0 ? (
                          <tr><td colSpan={5} className="px-4 py-8 text-center text-[#9ca3af]">Belum ada produk — cari obat di atas</td></tr>
                        ) : (
                          keranjang.map(item => (
                            <tr key={item.id} className="border-b border-[#f0ede6]">
                              <td className="px-4 py-3">
                                <div className="font-medium text-[#1a2e2e]">{item.nama_obat}</div>
                                <div className="text-xs text-[#9ca3af]">{item.kode}</div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => setKeranjang(keranjang.map(k => k.id === item.id ? {...k, jumlah: Math.max(1, k.jumlah - 1)} : k))}
                                    className="w-6 h-6 rounded bg-[#f5f2eb] text-[#1a2e2e] font-bold text-xs">−</button>
                                  <input type="number" min={1} value={item.jumlah}
                                    onChange={e => setKeranjang(keranjang.map(k => k.id === item.id ? {...k, jumlah: Math.max(1, +e.target.value)} : k))}
                                    className="w-12 text-center text-sm border border-[#d1cdc4] rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-[#1a2e2e]" />
                                  <button onClick={() => setKeranjang(keranjang.map(k => k.id === item.id ? {...k, jumlah: k.jumlah + 1} : k))}
                                    className="w-6 h-6 rounded bg-[#f5f2eb] text-[#1a2e2e] font-bold text-xs">+</button>
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right text-[#1a2e2e]">Rp {item.harga_jual?.toLocaleString('id-ID')}</td>
                              <td className="px-4 py-3 text-right font-medium text-[#1a2e2e]">Rp {(item.harga_jual * item.jumlah)?.toLocaleString('id-ID')}</td>
                              <td className="px-4 py-3 text-center">
                                <button onClick={() => setKeranjang(keranjang.filter(k => k.id !== item.id))}
                                  className="text-red-400 hover:text-red-600 text-xs">✕</button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="bg-white rounded-xl shadow-sm p-5">
                    <h3 className="font-semibold text-[#1a2e2e] mb-4">Ringkasan Transaksi</h3>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-[#6b7280]">Total Item</span>
                        <span className="text-[#1a2e2e]">{keranjang.reduce((a, b) => a + b.jumlah, 0)} item</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t border-[#f0ede6] pt-2">
                        <span className="text-[#1a2e2e]">Total</span>
                        <span className="text-[#1a2e2e]">Rp {keranjang.reduce((a, b) => a + b.harga_jual * b.jumlah, 0).toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="text-xs font-medium text-[#6b7280] mb-1 block">Bayar (Rp)</label>
                      <input type="number" value={bayar} onChange={e => setBayar(+e.target.value)}
                        className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" placeholder="0" />
                    </div>
                    {bayar > 0 && (
                      <div className="flex justify-between text-sm font-semibold text-green-600 mb-4">
                        <span>Kembalian</span>
                        <span>Rp {Math.max(0, bayar - keranjang.reduce((a, b) => a + b.harga_jual * b.jumlah, 0)).toLocaleString('id-ID')}</span>
                      </div>
                    )}
                    <button disabled={prosesLoading} onClick={async () => {
                      if (prosesLoading) return
                      if (keranjang.length === 0) return alert('Keranjang kosong!')
                      const total = keranjang.reduce((a, b) => a + b.harga_jual * b.jumlah, 0)
                      if (bayar < total) return alert('Pembayaran kurang!')
                      const kembalian = bayar - total
                      setProsesLoading(true)
                      try {
                        const { data: trx, error: trxError } = await supabase.from('transactions').insert([{ total, bayar, kembalian }]).select().single()
                        if (trxError) { alert('Error: ' + trxError.message); setProsesLoading(false); return }
                        const items = keranjang.map(k => ({ transaction_id: trx.id, product_id: k.id, nama_obat: k.nama_obat, harga_jual: k.harga_jual, jumlah: k.jumlah, subtotal: k.harga_jual * k.jumlah }))
                        const { error: itemError } = await supabase.from('transaction_items').insert(items)
                        if (itemError) { alert('Error items: ' + itemError.message); setProsesLoading(false); return }
                        for (const k of keranjang) {
                          await supabase.from('products').update({ stok_total: k.stok_total - k.jumlah }).eq('id', k.id)
                        }
                        setLastTrx({ ...trx, total, bayar, kembalian })
                        setLastItems(keranjang.map(k => ({ ...k, subtotal: k.harga_jual * k.jumlah })))
                        setShowStruk(true)
                        setKeranjang([])
                        setBayar(0)
                      } catch(e) { alert('Terjadi kesalahan, coba lagi') }
                      finally { setProsesLoading(false) }
                    }} className="w-full bg-[#1a2e2e] text-[#e8e4d9] py-3 rounded-lg text-sm font-medium hover:bg-[#2a4040] transition disabled:opacity-50">
                      {prosesLoading ? 'Memproses...' : 'Proses Transaksi'}
                    </button>
                    <button onClick={() => { setKeranjang([]); setBayar(0) }}
                      className="w-full mt-2 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm hover:bg-gray-50 transition">
                      Batal / Reset
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PEMBELIAN */}
          {activePage === 'pembelian' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#1a2e2e] mb-1">Pembelian</h1>
                  <p className="text-[#6b7280] text-sm">Purchase Order ke supplier</p>
                </div>
                <button onClick={() => setShowPOForm(true)}
                  className="bg-[#1a2e2e] text-[#e8e4d9] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2a4040] transition">
                  + Buat PO
                </button>
              </div>

              {showPOForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
                    <h2 className="text-lg font-bold text-[#1a2e2e] mb-4">Buat Purchase Order</h2>
                    <div className="mb-4">
                      <label className="text-xs font-medium text-[#6b7280] mb-1 block">Pilih Supplier *</label>
                      <select onChange={async (e) => {
                        const s = suppliers.find((x: any) => x.id === e.target.value)
                        setSelectedSupplier(s || null); setPoItems([])
                        if (s) fetchSupplierProducts(s.id)
                      }} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]">
                        <option value="">-- Pilih Supplier --</option>
                        {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.nama_supplier} ({s.jenis})</option>)}
                      </select>
                    </div>
                    {selectedSupplier && (
                      <div className="mb-4">
                        <label className="text-xs font-medium text-[#6b7280] mb-2 block">Produk dari {selectedSupplier.nama_supplier}</label>
                        {supplierProducts.length === 0 ? (
                          <p className="text-xs text-[#9ca3af] p-3 bg-gray-50 rounded-lg">Belum ada produk yang di-assign ke supplier ini.</p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {supplierProducts.map((p: any) => (
                              <div key={p.id} onClick={() => addPoItem(p)}
                                className={`px-3 py-2 rounded-lg border cursor-pointer text-sm transition ${
                                  poItems.some(i => i.product_id === p.id) ? 'border-[#1a2e2e] bg-[#f5f2eb]' : 'border-[#d1cdc4] hover:bg-gray-50'
                                }`}>
                                <div className="font-medium text-[#1a2e2e]">{p.nama_obat}</div>
                                <div className="text-xs text-[#9ca3af]">{p.satuan} · Stok: {p.stok_total}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {poItems.length > 0 && (
                      <div className="mb-4">
                        <label className="text-xs font-medium text-[#6b7280] mb-2 block">Detail Order</label>
                        <table className="w-full text-sm border border-[#f0ede6] rounded-lg overflow-hidden">
                          <thead>
                            <tr className="bg-[#f5f2eb]">
                              <th className="text-left px-3 py-2 text-xs text-[#6b7280]">Produk</th>
                              <th className="text-left px-3 py-2 text-xs text-[#6b7280]">Satuan</th>
                              <th className="text-center px-3 py-2 text-xs text-[#6b7280]">Qty</th>
                              <th className="text-right px-3 py-2 text-xs text-[#6b7280]">Harga Beli</th>
                              <th className="text-right px-3 py-2 text-xs text-[#6b7280]">Subtotal</th>
                              <th className="px-2 py-2"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {poItems.map((item, idx) => (
                              <tr key={idx} className="border-t border-[#f0ede6]">
                                <td className="px-3 py-2 text-[#1a2e2e] font-medium">{item.nama_produk}</td>
                                <td className="px-3 py-2 text-[#6b7280]">{item.satuan}</td>
                                <td className="px-3 py-2">
                                  <input type="number" min={1} value={item.qty_pesan}
                                    onChange={e => updatePoItem(idx, 'qty_pesan', +e.target.value)}
                                    className="w-16 text-center border border-[#d1cdc4] rounded px-1 py-0.5 text-sm" />
                                </td>
                                <td className="px-3 py-2">
                                  <input type="number" value={item.harga_beli}
                                    onChange={e => updatePoItem(idx, 'harga_beli', +e.target.value)}
                                    className="w-24 text-right border border-[#d1cdc4] rounded px-1 py-0.5 text-sm" />
                                </td>
                                <td className="px-3 py-2 text-right text-[#1a2e2e]">Rp {item.subtotal?.toLocaleString('id-ID')}</td>
                                <td className="px-2 py-2 text-center">
                                  <button onClick={() => setPoItems(poItems.filter((_, i) => i !== idx))}
                                    className="text-red-400 hover:text-red-600 text-xs">✕</button>
                                </td>
                              </tr>
                            ))}
                            <tr className="border-t-2 border-[#1a2e2e] bg-[#f5f2eb]">
                              <td colSpan={4} className="px-3 py-2 font-bold text-sm text-[#1a2e2e]">TOTAL</td>
                              <td className="px-3 py-2 text-right font-bold text-[#1a2e2e]">Rp {poItems.reduce((a, b) => a + b.subtotal, 0).toLocaleString('id-ID')}</td>
                              <td></td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                    <div className="mb-4">
                      <label className="text-xs font-medium text-[#6b7280] mb-1 block">Catatan (opsional)</label>
                      <textarea value={poCatatan} onChange={e => setPoCatatan(e.target.value)} rows={2}
                        className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => { setShowPOForm(false); setSelectedSupplier(null); setPoItems([]); setPoCatatan('') }}
                        className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">Batal</button>
                      <button onClick={submitPO}
                        className="flex-1 bg-[#1a2e2e] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium">Buat PO</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f0ede6]">
                      <th className="text-left px-4 py-3 text-[#6b7280] font-medium">No. PO</th>
                      <th className="text-left px-4 py-3 text-[#6b7280] font-medium">Supplier</th>
                      <th className="text-left px-4 py-3 text-[#6b7280] font-medium">Tanggal</th>
                      <th className="text-right px-4 py-3 text-[#6b7280] font-medium">Total</th>
                      <th className="text-center px-4 py-3 text-[#6b7280] font-medium">Status</th>
                      <th className="text-center px-4 py-3 text-[#6b7280] font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {poList.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-[#9ca3af]">Belum ada PO — buat PO pertama</td></tr>
                    ) : (
                      poList.map((po: any) => (
                        <tr key={po.id} className="border-b border-[#f0ede6] hover:bg-[#faf9f6]">
                          <td className="px-4 py-3 font-mono text-xs text-[#1a2e2e] font-medium">{po.nomor_po}</td>
                          <td className="px-4 py-3 text-[#1a2e2e]">{po.suppliers?.nama_supplier}</td>
                          <td className="px-4 py-3 text-[#6b7280]">
                            {new Date(po.tanggal_po || po.created_at).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-[#1a2e2e]">Rp {po.total_nilai?.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusPOColor[po.status] || 'bg-gray-100 text-gray-600'}`}>{po.status}</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button onClick={() => printPO(po)} className="text-xs text-[#1a2e2e] hover:underline font-medium">Print</button>
<span className="text-[#d1cdc4]">|</span>
<button onClick={async () => {
  const { data: items } = await supabase.from('po_items').select('*').eq('po_id', po.id)
  setShowPODetail({ ...po, items: items || [] })
}} className="text-xs text-[#6b7280] hover:underline font-medium">Detail</button>
                              {po.status === 'draft' && (
                                <>
                                  <span className="text-[#d1cdc4]">|</span>
                                  <button onClick={async () => {
                                    await supabase.from('purchase_orders').update({ status: 'dikirim' }).eq('id', po.id)
                                    fetchPOList()
                                  }} className="text-xs text-blue-600 hover:underline font-medium">Kirim</button>
                                </>
                              )}
                              {po.status === 'dikirim' && (
                                <>
                                  <span className="text-[#d1cdc4]">|</span>
                                  <button onClick={() => openPenerimaan(po)} className="text-xs text-green-600 hover:underline font-medium">
                                    {po.status_penerimaan === 'partial' ? 'Terima Lagi' : 'Terima Barang'}
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUPPLIER */}
          {activePage === 'supplier' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-[#1a2e2e] mb-1">Supplier</h1>
                  <p className="text-[#6b7280] text-sm">Daftar PBF dan distributor apotek</p>
                </div>
                <button onClick={() => setShowSupplierForm(true)}
                  className="bg-[#1a2e2e] text-[#e8e4d9] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2a4040] transition">
                  + Tambah Supplier
                </button>
              </div>

              {showSupplierForm && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
                    <h2 className="text-lg font-bold text-[#1a2e2e] mb-4">Tambah Supplier</h2>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-medium text-[#6b7280] mb-1 block">Nama Supplier *</label>
                        <input value={supplierForm.nama_supplier} onChange={e => setSupplierForm({...supplierForm, nama_supplier: e.target.value})}
                          className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#6b7280] mb-1 block">Jenis</label>
                        <select value={supplierForm.jenis} onChange={e => setSupplierForm({...supplierForm, jenis: e.target.value})}
                          className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]">
                          <option value="PBF">PBF</option>
                          <option value="Subdistributor">Subdistributor</option>
                          <option value="Lainnya">Lainnya</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#6b7280] mb-1 block">Telepon</label>
                        <input value={supplierForm.telepon} onChange={e => setSupplierForm({...supplierForm, telepon: e.target.value})}
                          className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#6b7280] mb-1 block">Email</label>
                        <input value={supplierForm.email} onChange={e => setSupplierForm({...supplierForm, email: e.target.value})}
                          className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[#6b7280] mb-1 block">Alamat</label>
                        <textarea value={supplierForm.alamat} onChange={e => setSupplierForm({...supplierForm, alamat: e.target.value})}
                          rows={2} className="w-full border border-[#d1cdc4] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-5">
                      <button onClick={() => setShowSupplierForm(false)}
                        className="flex-1 border border-[#d1cdc4] text-[#6b7280] py-2 rounded-lg text-sm">Batal</button>
                      <button onClick={handleTambahSupplier}
                        className="flex-1 bg-[#1a2e2e] text-[#e8e4d9] py-2 rounded-lg text-sm font-medium">Simpan</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f0ede6]">
                      <th className="text-left px-4 py-3 text-[#6b7280] font-medium">Kode</th>
                      <th className="text-left px-4 py-3 text-[#6b7280] font-medium">Nama Supplier</th>
                      <th className="text-left px-4 py-3 text-[#6b7280] font-medium">Jenis</th>
                      <th className="text-left px-4 py-3 text-[#6b7280] font-medium">Telepon</th>
                      <th className="text-center px-4 py-3 text-[#6b7280] font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-[#9ca3af]">Belum ada supplier — tambah supplier dulu</td></tr>
                    ) : (
                      suppliers.map(s => (
                        <tr key={s.id} className="border-b border-[#f0ede6] hover:bg-[#faf9f6]">
                          <td className="px-4 py-3 font-mono text-xs text-[#6b7280]">{s.kode}</td>
                          <td className="px-4 py-3 font-medium text-[#1a2e2e]">{s.nama_supplier}</td>
                          <td className="px-4 py-3 text-[#6b7280]">{s.jenis}</td>
                          <td className="px-4 py-3 text-[#6b7280]">{s.telepon || '-'}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{s.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* LAPORAN */}
          {activePage === 'laporan' && (
            <div>
              <h1 className="text-2xl font-bold text-[#1a2e2e] mb-1">Riwayat Transaksi</h1>
              <p className="text-[#6b7280] text-sm mb-6">Semua transaksi penjualan apotek</p>
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f0ede6]">
                      <th className="text-left px-4 py-3 text-[#6b7280] font-medium">No. Transaksi</th>
                      <th className="text-left px-4 py-3 text-[#6b7280] font-medium">Waktu</th>
                      <th className="text-right px-4 py-3 text-[#6b7280] font-medium">Total</th>
                      <th className="text-right px-4 py-3 text-[#6b7280] font-medium">Bayar</th>
                      <th className="text-right px-4 py-3 text-[#6b7280] font-medium">Kembalian</th>
                      <th className="text-center px-4 py-3 text-[#6b7280] font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riwayat.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-[#9ca3af]">Belum ada transaksi</td></tr>
                    ) : (
                      riwayat.map(trx => (
                        <tr key={trx.id} className="border-b border-[#f0ede6] hover:bg-[#faf9f6]">
                          <td className="px-4 py-3 font-mono text-xs text-[#1a2e2e] font-medium">{trx.nomor_transaksi}</td>
                          <td className="px-4 py-3 text-[#6b7280]">
                            {new Date(trx.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-[#1a2e2e]">Rp {trx.total?.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-right text-[#6b7280]">Rp {trx.bayar?.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-right text-[#6b7280]">Rp {trx.kembalian?.toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">{trx.status}</span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              {riwayat.length > 0 && (
                <div className="mt-4 bg-white rounded-xl shadow-sm p-4 flex justify-between items-center">
                  <span className="text-sm text-[#6b7280]">Total {riwayat.length} transaksi</span>
                  <span className="text-sm font-semibold text-[#1a2e2e]">
                    Total Omzet: Rp {riwayat.reduce((a, b) => a + b.total, 0).toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* PENGATURAN */}
          {activePage === 'pengaturan' && (
            <div>
              <h1 className="text-2xl font-bold text-[#1a2e2e] mb-1">Pengaturan Apotek</h1>
              <p className="text-[#6b7280] text-sm mb-6">Data apotek untuk struk, laporan, dan PO</p>
              <div className="bg-white rounded-xl shadow-sm p-6 max-w-lg">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#1a2e2e] mb-1 block">Nama Apotek</label>
                    <input value={settingsData.nama_apotek} onChange={e => setSettingsData({...settingsData, nama_apotek: e.target.value})}
                      className="w-full border border-[#d1cdc4] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1a2e2e] mb-1 block">Alamat</label>
                    <textarea value={settingsData.alamat} onChange={e => setSettingsData({...settingsData, alamat: e.target.value})}
                      rows={3} className="w-full border border-[#d1cdc4] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1a2e2e] mb-1 block">Nomor Ijin (SIA)</label>
                    <input value={settingsData.nomor_ijin} onChange={e => setSettingsData({...settingsData, nomor_ijin: e.target.value})}
                      className="w-full border border-[#d1cdc4] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#1a2e2e] mb-1 block">Nomor Telepon</label>
                    <input value={settingsData.nomor_telepon} onChange={e => setSettingsData({...settingsData, nomor_telepon: e.target.value})}
                      className="w-full border border-[#d1cdc4] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                  </div>
                  <div className="border-t border-[#f0ede6] pt-4">
                    <p className="text-xs font-semibold text-[#1a2e2e] mb-3 uppercase tracking-wide">Data Apoteker</p>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-[#1a2e2e] mb-1 block">Nama Apoteker</label>
                        <input value={settingsData.nama_apoteker || ''} onChange={e => setSettingsData({...settingsData, nama_apoteker: e.target.value})}
                          placeholder="apt. Nama Apoteker, S.Farm"
                          className="w-full border border-[#d1cdc4] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#1a2e2e] mb-1 block">Nomor SIPA</label>
                        <input value={settingsData.nomor_sipa || ''} onChange={e => setSettingsData({...settingsData, nomor_sipa: e.target.value})}
                          placeholder="SIPA/001/2024/..."
                          className="w-full border border-[#d1cdc4] rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]" />
                      </div>
                    </div>
                  </div>
                  <button onClick={async () => {
                    const { error } = await supabase.from('settings').update(settingsData).eq('id', settingsData.id)
                    if (!error) alert('✅ Data apotek berhasil disimpan!')
                  }} className="w-full bg-[#1a2e2e] text-[#e8e4d9] py-2.5 rounded-lg text-sm font-medium hover:bg-[#2a4040] transition">
                    Simpan Perubahan
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  )
}