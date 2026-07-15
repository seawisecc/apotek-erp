'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FlaskConical } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { AMBIENT } from '../../lib/theme'

export default function Register() {
  const [namaApotek, setNamaApotek] = useState('')
  const [namaLengkap, setNamaLengkap] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [konfirmasi, setKonfirmasi] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sukses, setSukses] = useState('')

  const handleRegister = async () => {
    setError(''); setSukses('')
    if (!namaApotek || !email || !password) return setError('Nama apotek, email, dan password wajib diisi')
    if (password.length < 6) return setError('Password minimal 6 karakter')
    if (password !== konfirmasi) return setError('Konfirmasi password tidak cocok')

    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nama_apotek: namaApotek, nama_lengkap: namaLengkap } },
    })

    if (error) { setLoading(false); setError(error.message); return }

    // Daftarkan apotek ke daftar companies (status menunggu aktivasi super admin)
    const slug = namaApotek.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)
      + '-' + Math.random().toString(36).slice(2, 6)
    await supabase.from('companies').insert([{
      nama: namaApotek.trim(), slug, admin_nama: namaLengkap.trim(),
      admin_email: email.trim().toLowerCase(), status: 'nonaktif', user_count: 1,
    }])
    setLoading(false)

    if (data.session) {
      setSukses('Pendaftaran berhasil! Akun apotek Anda menunggu aktivasi dari tim Seawise sebelum bisa digunakan.')
    } else {
      setSukses('Pendaftaran berhasil! Cek email untuk verifikasi. Akun juga menunggu aktivasi tim Seawise.')
    }
  }

  const inputCls =
    'w-full border border-[#e2ddd3] bg-white rounded-xl px-4 py-3 text-sm text-[#1c2620] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]'

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={AMBIENT}>
      <div className="w-full max-w-4xl rounded-[28px] overflow-hidden grid md:grid-cols-2 shadow-2xl border border-black/5 sw-anim-card"
        style={{ background: '#f5f3ee' }}>

        {/* ── Brand side (angled) ── */}
        <div
          className="relative hidden md:flex bg-gradient-to-br from-[#1b3426] via-[#22392a] to-[#6f5236] flex-col items-center justify-center text-center px-10 py-14 order-1"
          style={{ clipPath: 'polygon(0 0, 100% 0, 86% 100%, 0% 100%)' }}
        >
          <div className="relative mb-6">
            <FlaskConical size={44} className="text-white" strokeWidth={1.5} />
            <span className="absolute top-2 right-1 w-2 h-2 rounded-full bg-[#c2632f]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Sudah punya akun?</h2>
          <p className="text-[#c9d6cc] text-sm leading-relaxed max-w-xs mb-6">
            Masuk dan lanjutkan mengelola apotekmu dari tempat terakhir.
          </p>
          <Link href="/"
            className="px-6 py-2.5 rounded-xl border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition">
            Masuk
          </Link>
        </div>

        {/* ── Form side ── */}
        <div className="p-8 sm:p-10 md:p-12 flex flex-col justify-center order-2">
          <div className="flex items-center gap-3 mb-8">
            <div className="relative w-11 h-11 rounded-2xl bg-[#1e3a2c] flex items-center justify-center">
              <FlaskConical size={22} className="text-white" strokeWidth={1.8} />
              <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full bg-[#c2632f]" />
            </div>
            <div>
              <div className="font-bold text-[#1c2620] leading-tight">Seawise Enterprise Apps</div>
              <div className="text-xs text-[#8a8f88]">Pharmacy Store Edition</div>
            </div>
          </div>

          <p className="text-[#c2632f] text-xs font-semibold uppercase tracking-[0.18em] mb-2">
            Gabung Sekarang
          </p>
          <h1 className="text-3xl font-bold text-[#1c2620] mb-1">Daftarkan Apotek</h1>
          <p className="text-sm text-[#6b7280] mb-6">Gratis mendaftar — aktivasi dilakukan oleh tim Seawise.</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">{error}</div>
          )}
          {sukses && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">{sukses}</div>
          )}

          <div className="space-y-3.5">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Nama Apotek</label>
              <input value={namaApotek} onChange={e => setNamaApotek(e.target.value)}
                placeholder="Apotek Sehat Sentosa" className={inputCls} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Nama Lengkap</label>
                <input value={namaLengkap} onChange={e => setNamaLengkap(e.target.value)}
                  placeholder="Nama apoteker" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="kamu@apotek.com" className={inputCls} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 6 karakter" className={inputCls} />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Konfirmasi</label>
                <input type="password" value={konfirmasi} onChange={e => setKonfirmasi(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()}
                  placeholder="Ulangi password" className={inputCls} />
              </div>
            </div>
            <button onClick={handleRegister} disabled={loading}
              className="w-full bg-[#1e3a2c] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#24462f] transition disabled:opacity-50">
              {loading ? 'Memproses...' : 'Daftarkan Apotek'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
