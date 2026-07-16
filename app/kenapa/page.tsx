'use client'

import { useEffect } from 'react'
import {
  FlaskConical, ShoppingCart, ClipboardList, Receipt, BarChart2, Database,
  Users, ShieldCheck, Pill, Truck, CalendarClock, Wallet, Check, ArrowRight
} from 'lucide-react'

const CSS = `
:root { --sw-green:#1e3a2c; --sw-rust:#c2632f; --sw-ink:#1c2620; }
.kn-ambient {
  background:
    radial-gradient(1100px 560px at 8% -8%, #d9e4d3 0%, rgba(217,228,211,0) 55%),
    radial-gradient(1000px 520px at 102% -4%, #f1ded0 0%, rgba(241,222,208,0) 52%),
    radial-gradient(900px 720px at 104% 60%, #e7d4c2 0%, rgba(231,212,194,0) 55%),
    #f3f1ea;
}
.kn-dark { background: linear-gradient(160deg,#16281d 0%,#1e3a2c 45%,#3a3320 100%); }
.reveal { opacity:0; transform: translateY(30px); transition: opacity .8s cubic-bezier(.22,.61,.36,1), transform .8s cubic-bezier(.22,.61,.36,1); }
.reveal.in { opacity:1; transform:none; }
.kn-nav { backdrop-filter: saturate(160%) blur(12px); -webkit-backdrop-filter: saturate(160%) blur(12px); }
.kn-win { box-shadow: 0 40px 90px -30px rgba(20,40,29,.55); }
.kn-headline { letter-spacing:-0.02em; line-height:1.02; }
@media (prefers-reduced-motion: reduce){ .reveal{ opacity:1; transform:none; transition:none; } }
`

// Mini mockup jendela aplikasi (memakai tema asli)
function AppWindow({ children }: { children: React.ReactNode }) {
  return (
    <div className="kn-win rounded-2xl overflow-hidden border border-black/5 bg-white/80 backdrop-blur-sm w-full">
      <div className="h-9 flex items-center gap-2 px-4 bg-[#eef0ea] border-b border-black/5">
        <span className="w-3 h-3 rounded-full bg-[#e2726a]" />
        <span className="w-3 h-3 rounded-full bg-[#e6b95c]" />
        <span className="w-3 h-3 rounded-full bg-[#8fbf7f]" />
      </div>
      <div className="flex min-h-[240px]">
        <div className="w-16 sm:w-20 shrink-0 bg-gradient-to-b from-[#1e3a2c] to-[#2c3320] flex flex-col items-center py-4 gap-4">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center"><FlaskConical size={16} className="text-white" /></div>
          {[Pill, ShoppingCart, ClipboardList, BarChart2].map((I, i) => <I key={i} size={16} className="text-[#9db3a5]" />)}
        </div>
        <div className="flex-1 p-5">{children}</div>
      </div>
    </div>
  )
}

function Stat({ chip, label, value, Icon }: any) {
  return (
    <div className="bg-white/70 border border-white/60 shadow-sm rounded-xl p-3">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${chip}`}><Icon size={15} /></div>
      <p className="text-[10px] text-[#6b7280] uppercase tracking-wide">{label}</p>
      <p className="text-base font-bold text-[#1c2620]">{value}</p>
    </div>
  )
}

export default function Kenapa() {
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in') })
    }, { threshold: 0.15 })
    document.querySelectorAll('.reveal').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  const spotlights = [
    { tag: 'KASIR & KEPATUHAN', title: 'Jual cepat, tetap patuh aturan.', body: 'Kasir ringan dengan metode bayar Tunai, QRIS, Transfer. Untuk obat Narkotika, Psikotropika & Prekursor, data pasien dan nomor resep wajib terisi otomatis — tercatat rapi untuk pelaporan.', Icon: ShoppingCart,
      visual: (<AppWindow><div className="space-y-2"><div className="h-8 rounded-lg bg-[#f5f2eb] flex items-center px-3 text-xs text-[#9ca3af]">Cari obat…</div><div className="rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800">⚠ Narkotika — isi data pasien & resep</div><div className="grid grid-cols-3 gap-1.5">{['Tunai','QRIS','Transfer'].map(m=><div key={m} className="text-[10px] text-center py-1.5 rounded-lg bg-[#1e3a2c] text-white">{m}</div>)}</div></div></AppWindow>) },
    { tag: 'STOK & EXPIRED', title: 'Tak ada lagi obat kadaluarsa terbuang.', body: 'Pantau batch & tanggal expired, dapat peringatan dini, lalu tindak lanjuti: musnahkan dengan Berita Acara resmi atau retur ke supplier — stok berkurang hanya setelah dikonfirmasi.', Icon: CalendarClock,
      visual: (<AppWindow><table className="w-full text-[11px]"><thead><tr className="text-[#9ca3af]"><th className="text-left font-medium pb-1">Batch</th><th className="text-left font-medium pb-1">Exp</th><th className="text-right font-medium pb-1">Aksi</th></tr></thead><tbody>{[['BT-2401','30 hari','#dc2626'],['BT-2312','≤60 hari','#b45309'],['BT-2408','Aman','#16a34a']].map((r,i)=>(<tr key={i} className="border-t border-[#f0ede6]"><td className="py-1.5 font-mono text-[#1c2620]">{r[0]}</td><td className="py-1.5" style={{color:r[2]}}>{r[1]}</td><td className="py-1.5 text-right"><span className="text-[10px] px-2 py-0.5 rounded bg-[#1e3a2c] text-white">Tindak Lanjut</span></td></tr>))}</tbody></table></AppWindow>) },
    { tag: 'LAPORAN SIPNAP', title: 'Laporan SIPNAP, otomatis.', body: 'Narkotika, Psikotropika, dan Prekursor per periode — penerimaan dari pembelian, pengeluaran lengkap dengan data pasien & resep, siap cetak dengan tanda tangan Apoteker Penanggung Jawab. Hemat berjam-jam kerja manual.', Icon: BarChart2,
      visual: (<AppWindow><div className="text-center"><p className="text-[11px] font-bold text-[#1c2620]">LAPORAN PENGGUNAAN NARKOTIKA</p><p className="text-[9px] text-[#9ca3af] mb-2">Periode: Bulan berjalan</p><div className="border border-[#e2ddd3] rounded"><div className="grid grid-cols-4 text-[8px] bg-[#f5f2eb] text-[#6b7280]"><span className="p-1 border-r border-[#e2ddd3]">Sediaan</span><span className="p-1 border-r border-[#e2ddd3]">Masuk</span><span className="p-1 border-r border-[#e2ddd3]">Keluar</span><span className="p-1">Sisa</span></div>{[['Codein 10mg','20','5','15'],['Pethidin 50ml','10','2','8']].map((r,i)=>(<div key={i} className="grid grid-cols-4 text-[8px] border-t border-[#f0ede6]">{r.map((c,j)=><span key={j} className={`p-1 ${j<3?'border-r border-[#f0ede6]':''}`}>{c}</span>)}</div>))}</div></div></AppWindow>) },
    { tag: 'PEMBELIAN & KEUANGAN', title: 'Pembelian sampai bayar faktur, terpantau.', body: 'Buat PO ke supplier, terima barang beserta batch & faktur, lalu kelola pembayaran faktur — diurutkan berdasarkan jatuh tempo, dengan pengingat yang lewat tempo dan bukti pembayaran yang bisa dicetak.', Icon: Receipt,
      visual: (<AppWindow><div className="space-y-1.5">{[['INV/0087','Jatuh tempo 3 hari','#b45309'],['INV/0091','Terlambat','#dc2626'],['INV/0080','Lunas','#16a34a']].map((r,i)=>(<div key={i} className="flex items-center justify-between text-[11px] bg-white/70 border border-[#f0ede6] rounded-lg px-3 py-2"><span className="font-mono text-[#1c2620]">{r[0]}</span><span style={{color:r[2]}}>{r[1]}</span></div>))}</div></AppWindow>) },
    { tag: 'ONBOARDING', title: 'Pindah data lama? Cukup satu klik.', body: 'Unduh template, isi di Excel, upload CSV — daftar produk, supplier, stok awal, hingga saldo hutang langsung masuk. Client baru bisa langsung jalan tanpa input manual berhari-hari.', Icon: Database,
      visual: (<AppWindow><div className="grid grid-cols-2 gap-2">{['Produk','Supplier','Stok Awal','Faktur Awal'].map((t,i)=>(<div key={i} className="rounded-lg border border-[#e2ddd3] p-2.5"><Database size={14} className="text-[#2f5741] mb-1"/><p className="text-[11px] font-semibold text-[#1c2620]">{t}</p><p className="text-[9px] text-[#9ca3af]">Template + Upload CSV</p></div>))}</div></AppWindow>) },
  ]

  const grid = [
    { Icon: ShoppingCart, t: 'Kasir & Struk', d: 'POS cepat, multi metode bayar, cetak struk.' },
    { Icon: Pill, t: 'Produk & Stok', d: 'Katalog obat, harga, margin, batch & expired.' },
    { Icon: Truck, t: 'Supplier & PO', d: 'Kelola supplier dan purchase order.' },
    { Icon: Receipt, t: 'Pembayaran Faktur', d: 'Hutang supplier, jatuh tempo, bukti bayar.' },
    { Icon: ClipboardList, t: 'Tindak Lanjut Expired', d: 'Musnahkan (Berita Acara) & retur supplier.' },
    { Icon: BarChart2, t: 'Laporan & SIPNAP', d: 'Penjualan, omzet, dan laporan wajib.' },
    { Icon: Users, t: 'Pengguna & Role', d: 'Akun tim dengan hak akses per modul.' },
    { Icon: ShieldCheck, t: 'Data Aman & Terpisah', d: 'Tiap apotek terisolasi di level database.' },
    { Icon: Database, t: 'Migrasi & Backup', d: 'Import/ekspor CSV kapan saja.' },
  ]

  return (
    <div className="kn-ambient min-h-screen text-[#1c2620]">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      {/* Nav */}
      <nav className="kn-nav sticky top-0 z-30 bg-white/60 border-b border-black/5">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative w-9 h-9 rounded-xl bg-[#1e3a2c] flex items-center justify-center">
              <FlaskConical size={18} className="text-white" /><span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#c2632f]" />
            </div>
            <div className="leading-tight"><div className="font-bold text-sm">Seawise Enterprise Apps</div><div className="text-[10px] text-[#8a8f88]">Pharmacy Store Edition</div></div>
          </div>
          <div className="flex items-center gap-2">
            <a href="/" className="hidden sm:inline text-sm font-medium text-[#1e3a2c] px-3 py-2">Masuk</a>
            <a href="/" className="text-sm font-semibold bg-[#1e3a2c] text-white px-4 py-2 rounded-xl hover:bg-[#24462f] transition">Daftarkan Apotek</a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-5xl mx-auto px-5 pt-20 sm:pt-28 pb-16 text-center">
        <p className="reveal text-[#c2632f] text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] mb-5">Sistem Manajemen Apotek</p>
        <h1 className="reveal kn-headline text-4xl sm:text-6xl md:text-7xl font-bold mb-6" style={{ transitionDelay: '.05s' }}>
          Apotek Anda,<br />dikelola dengan tenang.
        </h1>
        <p className="reveal text-lg sm:text-xl text-[#4b5563] max-w-2xl mx-auto mb-9" style={{ transitionDelay: '.1s' }}>
          Kasir, stok, pembelian, kepatuhan SIPNAP, hingga barang expired — semuanya dalam satu aplikasi yang dirancang khusus untuk apotek Indonesia.
        </p>
        <div className="reveal flex items-center justify-center gap-3 mb-14" style={{ transitionDelay: '.15s' }}>
          <a href="/" className="inline-flex items-center gap-2 bg-[#1e3a2c] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#24462f] transition">Coba Sekarang <ArrowRight size={17} /></a>
          <a href="#harga" className="px-6 py-3 rounded-xl font-semibold border border-[#d1cdc4] hover:bg-white/60 transition">Lihat Harga</a>
        </div>
        <div className="reveal max-w-3xl mx-auto" style={{ transitionDelay: '.2s' }}>
          <AppWindow>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Stat chip="bg-[#dce5db] text-[#2f5741]" Icon={Pill} label="Produk" value="1.240" />
              <Stat chip="bg-[#dce5db] text-[#2f5741]" Icon={ShoppingCart} label="Transaksi" value="87" />
              <Stat chip="bg-[#f5e6c8] text-[#8a6d1f]" Icon={CalendarClock} label="Expired ≤60h" value="3" />
              <Stat chip="bg-[#f0dcd2] text-[#a75a34]" Icon={Wallet} label="Omzet" value="Rp8,4jt" />
            </div>
          </AppWindow>
        </div>
      </header>

      {/* Problem (dark) */}
      <section className="kn-dark text-white py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold mb-6">Mengelola apotek nggak harus ribet.</h2>
          <p className="reveal text-[#c9d6cc] text-lg max-w-2xl mx-auto mb-12" style={{ transitionDelay: '.05s' }}>Kebocoran yang diam-diam menggerus keuntungan — dan bikin repot saat audit.</p>
          <div className="grid sm:grid-cols-3 gap-5 text-left">
            {[
              ['Obat kadaluarsa terbuang', 'Tanpa pantauan batch & expired, stok mati jadi kerugian.'],
              ['Laporan SIPNAP manual', 'Rekap narkotika/psikotropika makan waktu dan rawan salah.'],
              ['Hutang & stok tercecer', 'Faktur jatuh tempo terlewat, data ada di banyak tempat.'],
            ].map((p, i) => (
              <div key={i} className="reveal bg-white/[0.06] border border-white/10 rounded-2xl p-6" style={{ transitionDelay: `${i * .07}s` }}>
                <p className="font-semibold text-lg mb-1.5">{p[0]}</p>
                <p className="text-[#9db3a5] text-sm leading-relaxed">{p[1]}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Spotlights */}
      <section className="py-8 sm:py-16">
        {spotlights.map((s, i) => (
          <div key={i} className="max-w-6xl mx-auto px-5 py-14 sm:py-20">
            <div className={`grid md:grid-cols-2 gap-10 sm:gap-14 items-center ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
              <div className="reveal">
                <p className="text-[#c2632f] text-xs font-semibold uppercase tracking-[0.18em] mb-3">{s.tag}</p>
                <h3 className="kn-headline text-3xl sm:text-4xl font-bold mb-4">{s.title}</h3>
                <p className="text-[#4b5563] text-lg leading-relaxed">{s.body}</p>
              </div>
              <div className="reveal" style={{ transitionDelay: '.08s' }}>{s.visual}</div>
            </div>
          </div>
        ))}
      </section>

      {/* Feature grid */}
      <section className="max-w-6xl mx-auto px-5 py-16">
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold text-center mb-3">Semua yang apotek Anda butuhkan.</h2>
        <p className="reveal text-center text-[#4b5563] text-lg mb-12" style={{ transitionDelay: '.05s' }}>Satu langganan, seluruh operasional tercakup.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {grid.map((g, i) => (
            <div key={i} className="reveal bg-white/70 border border-white/60 shadow-sm rounded-2xl p-6" style={{ transitionDelay: `${(i % 3) * .06}s` }}>
              <div className="w-11 h-11 rounded-xl bg-[#dce5db] text-[#2f5741] flex items-center justify-center mb-4"><g.Icon size={20} /></div>
              <p className="font-bold text-lg mb-1">{g.t}</p>
              <p className="text-[#6b7280] text-sm leading-relaxed">{g.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="harga" className="kn-dark text-white py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <p className="reveal text-[#e0b48f] text-xs font-semibold uppercase tracking-[0.2em] mb-4">Harga</p>
          <h2 className="reveal kn-headline text-4xl sm:text-6xl font-bold mb-3" style={{ transitionDelay: '.05s' }}>Hanya Rp6.000<span className="text-[#9db3a5] text-2xl sm:text-3xl font-semibold">/hari</span></h2>
          <p className="reveal text-[#c9d6cc] text-lg mb-10" style={{ transitionDelay: '.1s' }}>Lebih murah dari satu strip obat yang terbuang karena kadaluarsa.</p>
          <div className="reveal grid sm:grid-cols-2 gap-5 text-left" style={{ transitionDelay: '.15s' }}>
            <div className="bg-white/[0.06] border border-white/10 rounded-2xl p-7">
              <p className="text-[#9db3a5] text-sm mb-1">Bulanan</p>
              <p className="text-3xl font-bold mb-1">Rp216.000<span className="text-base text-[#9db3a5] font-medium">/bulan</span></p>
              <p className="text-[#9db3a5] text-sm">Fleksibel, bisa berhenti kapan saja.</p>
            </div>
            <div className="relative bg-white text-[#1c2620] rounded-2xl p-7 shadow-xl">
              <span className="absolute -top-3 right-5 bg-[#c2632f] text-white text-xs font-semibold px-3 py-1 rounded-full">Hemat 2 bulan</span>
              <p className="text-[#6b7280] text-sm mb-1">Tahunan</p>
              <p className="text-3xl font-bold mb-1">Rp2.160.000<span className="text-base text-[#6b7280] font-medium">/tahun</span></p>
              <p className="text-[#16a34a] text-sm font-medium">Setara Rp6.000/hari · gratis 2 bulan (hemat Rp432.000).</p>
            </div>
          </div>
          <div className="reveal mt-8 space-y-2 text-left max-w-md mx-auto" style={{ transitionDelay: '.2s' }}>
            {['Semua fitur — tanpa batasan', 'Multi-pengguna dengan hak akses', 'Migrasi data & pendampingan awal', 'Update fitur berkelanjutan'].map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 text-[#e8efe9]"><Check size={16} className="text-[#8fbf7f] shrink-0" /> <span className="text-sm">{f}</span></div>
            ))}
          </div>
          <a href="/" className="reveal inline-flex items-center gap-2 mt-10 bg-white text-[#1e3a2c] px-7 py-3.5 rounded-xl font-bold hover:bg-[#f0ede6] transition" style={{ transitionDelay: '.25s' }}>
            Daftarkan Apotek Sekarang <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Closing */}
      <section className="max-w-4xl mx-auto px-5 py-24 text-center">
        <h2 className="reveal kn-headline text-3xl sm:text-5xl font-bold mb-5">Siap membuat apotek lebih tenang?</h2>
        <p className="reveal text-[#4b5563] text-lg mb-8" style={{ transitionDelay: '.05s' }}>Mulai hari ini. Aktivasi dibantu langsung oleh tim Seawise.</p>
        <a href="/" className="reveal inline-flex items-center gap-2 bg-[#1e3a2c] text-white px-7 py-3.5 rounded-xl font-bold hover:bg-[#24462f] transition">Mulai Sekarang <ArrowRight size={18} /></a>
      </section>

      <footer className="border-t border-black/5 py-8 text-center text-sm text-[#9ca3af]">
        <div className="flex items-center justify-center gap-2 mb-2">
          <FlaskConical size={16} className="text-[#1e3a2c]" /> <span className="font-semibold text-[#1c2620]">Seawise Enterprise Apps</span>
        </div>
        © {new Date().getFullYear()} Seawise Creative · Pharmacy Store Edition
      </footer>
    </div>
  )
}
