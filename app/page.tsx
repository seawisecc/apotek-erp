'use client'

import { useState } from 'react'
import Link from 'next/link'
import { FlaskConical } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { AMBIENT } from '../lib/theme'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needConfirm, setNeedConfirm] = useState(false)
  const [info, setInfo] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError(''); setInfo(''); setNeedConfirm(false)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
    if (error) {
      const m = error.message.toLowerCase()
      if (m.includes('not confirmed') || m.includes('confirm')) {
        setNeedConfirm(true)
        setError('Email belum dikonfirmasi. Konfirmasi dulu lewat email verifikasi, atau matikan "Confirm email" di Supabase.')
      } else if (m.includes('invalid login')) {
        setError('Email atau password salah.')
      } else {
        setError(error.message) // tampilkan pesan asli dari Supabase untuk trace
      }
    } else {
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  const resendConfirmation = async () => {
    setInfo(''); setError('')
    const { error } = await supabase.auth.resend({ type: 'signup', email: email.trim().toLowerCase() })
    if (error) setError('Gagal kirim ulang: ' + error.message)
    else setInfo('Email verifikasi dikirim ulang. Cek inbox/spam.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={AMBIENT}>
      <div className="w-full max-w-4xl rounded-[28px] overflow-hidden grid md:grid-cols-2 shadow-2xl border border-black/5 sw-anim-card"
        style={{ background: '#f5f3ee' }}>

        {/* ── Form side ── */}
        <div className="p-8 sm:p-10 md:p-12 flex flex-col justify-center">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
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
            Selamat Datang Kembali
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1c2620] mb-8">Masuk</h1>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
              {needConfirm && (
                <button onClick={resendConfirmation} className="block mt-2 text-[#1e3a2c] font-medium underline">
                  Kirim ulang email verifikasi
                </button>
              )}
            </div>
          )}
          {info && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {info}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Email</label>
              <input
                type="email"
                placeholder="nama@apotek.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full border border-[#e2ddd3] bg-white rounded-xl px-4 py-3 text-sm text-[#1c2620] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full border border-[#e2ddd3] bg-white rounded-xl px-4 py-3 text-sm text-[#1c2620] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#1e3a2c]"
              />
            </div>
            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#1e3a2c] text-white py-3 rounded-xl text-sm font-semibold hover:bg-[#24462f] transition disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>
        </div>

        {/* ── Brand side (angled) ── */}
        <div
          className="relative hidden md:flex bg-gradient-to-br from-[#1b3426] via-[#22392a] to-[#6f5236] flex-col items-center justify-center text-center px-10 py-14"
          style={{ clipPath: 'polygon(14% 0, 100% 0, 100% 100%, 0% 100%)' }}
        >
          <div className="relative mb-6 sw-anim-panel">
            <FlaskConical size={44} className="text-white" strokeWidth={1.5} />
            <span className="absolute top-2 right-1 w-2 h-2 rounded-full bg-[#c2632f]" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3 sw-anim-panel">Apotek baru di sini?</h2>
          <p className="text-[#c9d6cc] text-sm leading-relaxed max-w-xs mb-6">
            Daftarkan apotekmu dan kelola stok, transaksi, hingga tindak lanjut barang expired
            dalam satu aplikasi.
          </p>
          <Link href="/register"
            className="px-6 py-2.5 rounded-xl border border-white/40 text-white text-sm font-medium hover:bg-white/10 transition">
            Daftarkan Apotek
          </Link>
        </div>
      </div>
    </div>
  )
}
