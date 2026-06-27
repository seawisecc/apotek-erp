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
              <h1 className="text-2xl font-bold text-[#1a2e2e] mb-1">Pembelian</h1>
              <p className="text-[#6b7280] text-sm">Halaman ini akan segera tersedia.</p>
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
              <p className="text-[#6b7280] text-sm mb-6">Data apotek untuk struk dan laporan</p>
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