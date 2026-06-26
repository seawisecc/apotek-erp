'use client'

import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Pill, ShoppingCart, PackageOpen, BarChart2, LogOut,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'

const menuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'produk', label: 'Produk & Stok', icon: Pill },
  { id: 'transaksi', label: 'Transaksi', icon: ShoppingCart },
  { id: 'pembelian', label: 'Pembelian', icon: PackageOpen },
  { id: 'laporan', label: 'Laporan', icon: BarChart2 },
]

export default function Dashboard() {
  const [activePage, setActivePage] = useState('dashboard')
  const [products, setProducts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (activePage === 'produk') fetchProducts()
  }, [activePage])

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('kode')
    setProducts(data || [])
    setLoading(false)
  }

  const filteredProducts = products.filter(p =>
    p.nama_obat?.toLowerCase().includes(search.toLowerCase()) ||
    p.nama_generik?.toLowerCase().includes(search.toLowerCase()) ||
    p.kandungan?.toLowerCase().includes(search.toLowerCase())
  )

  const formatRupiah = (num: number) =>
    'Rp ' + num?.toLocaleString('id-ID')

  const kategoriLabel: Record<string, string> = {
    bebas: 'Bebas',
    bebas_terbatas: 'Bebas Terbatas',
    keras: 'Keras',
    suplemen: 'Suplemen',
    psikotropika: 'Psikotropika',
    narkotika: 'Narkotika',
    prekursor: 'Prekursor',
    alkes: 'Alkes',
    lainnya: 'Lainnya',
  }

  return (
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
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition text-left ${
                  activePage === item.id
                    ? 'bg-[#2a4040] text-[#e8e4d9] font-medium'
                    : 'text-[#7a9e9e] hover:bg-[#2a4040] hover:text-[#e8e4d9]'
                }`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
        <div className="px-6 py-4 border-t border-[#2a4040]">
          <div className="text-[#7a9e9e] text-xs">Masuk sebagai</div>
          <div className="text-[#e8e4d9] text-sm font-medium mt-0.5">admin@apotek.com</div>
          <button className="flex items-center gap-1.5 text-[#4a6e6e] text-xs mt-2 hover:text-[#e8e4d9] transition">
            <LogOut size={12} /> Keluar
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8">

        {activePage === 'dashboard' && (
          <div>
            <h1 className="text-2xl font-bold text-[#1a2e2e] mb-1">Dashboard</h1>
            <p className="text-[#6b7280] text-sm mb-8">Ringkasan aktivitas apotek hari ini</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-sm text-[#6b7280] mb-1">Total Produk</p>
                <p className="text-3xl font-bold text-[#1a2e2e]">0</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-sm text-[#6b7280] mb-1">Transaksi Hari Ini</p>
                <p className="text-3xl font-bold text-[#1a2e2e]">0</p>
              </div>
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <p className="text-sm text-[#6b7280] mb-1">Stok Hampir Habis</p>
                <p className="text-3xl font-bold text-red-500">0</p>
              </div>
            </div>
          </div>
        )}

        {activePage === 'produk' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-[#1a2e2e] mb-1">Produk & Stok</h1>
                <p className="text-[#6b7280] text-sm">Daftar semua produk obat di apotek</p>
              </div>
              <button className="bg-[#1a2e2e] text-[#e8e4d9] px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#2a4040] transition">
                + Tambah Produk
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Cari nama obat, generik, atau kandungan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-[#d1cdc4] bg-white rounded-lg px-4 py-2.5 text-sm text-[#1a2e2e] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]"
              />
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
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#9ca3af]" colSpan={7}>Memuat data...</td>
                    </tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr>
                      <td className="px-4 py-8 text-center text-[#9ca3af]" colSpan={7}>Tidak ada produk ditemukan</td>
                    </tr>
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
                        <td className="px-4 py-3 text-right text-[#1a2e2e]">{formatRupiah(p.harga_jual)}</td>
                        <td className={`px-4 py-3 text-right font-medium ${p.stok_total <= p.stok_minimum ? 'text-red-500' : 'text-[#1a2e2e]'}`}>
                          {p.stok_total}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === 'aktif' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activePage === 'transaksi' && (
          <div>
            <h1 className="text-2xl font-bold text-[#1a2e2e] mb-1">Transaksi</h1>
            <p className="text-[#6b7280] text-sm">Halaman ini akan segera tersedia.</p>
          </div>
        )}

        {activePage === 'pembelian' && (
          <div>
            <h1 className="text-2xl font-bold text-[#1a2e2e] mb-1">Pembelian</h1>
            <p className="text-[#6b7280] text-sm">Halaman ini akan segera tersedia.</p>
          </div>
        )}

        {activePage === 'laporan' && (
          <div>
            <h1 className="text-2xl font-bold text-[#1a2e2e] mb-1">Laporan</h1>
            <p className="text-[#6b7280] text-sm">Halaman ini akan segera tersedia.</p>
          </div>
        )}

      </div>
    </div>
  )
}