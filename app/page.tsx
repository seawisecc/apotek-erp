'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email atau password salah')
    } else {
      window.location.href = '/dashboard'
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden md:flex w-1/2 bg-[#1a2e2e] flex-col justify-between p-12">
        <div className="text-[#e8e4d9] text-xl font-semibold tracking-tight">
          💊 ApotekERP
        </div>
        <div>
          <p className="text-xs uppercase tracking-widest text-[#7a9e9e] mb-4">
            Sistem Manajemen Apotek
          </p>
          <h1 className="text-4xl font-bold text-[#e8e4d9] leading-tight">
            Kelola Apotek<br />Lebih Cerdas.
          </h1>
          <p className="text-[#7a9e9e] mt-4 text-sm leading-relaxed max-w-xs">
            Stok, transaksi, dan laporan dalam satu platform yang dirancang khusus untuk apotek Indonesia.
          </p>
        </div>
        <p className="text-[#4a6e6e] text-xs">© 2025 ApotekERP</p>
      </div>

      <div className="flex-1 bg-[#f5f2eb] flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-[#1a2e2e] mb-1">Selamat datang</h2>
            <p className="text-sm text-[#6b7280]">Masuk ke akun apotek Anda</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a2e2e] mb-1">Email</label>
              <input
                type="email"
                placeholder="email@apotek.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-[#d1cdc4] bg-white rounded-lg px-4 py-2.5 text-sm text-[#1a2e2e] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2e2e] mb-1">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-[#d1cdc4] bg-white rounded-lg px-4 py-2.5 text-sm text-[#1a2e2e] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#1a2e2e]"
              />
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-[#1a2e2e] text-[#e8e4d9] py-2.5 rounded-lg text-sm font-medium hover:bg-[#2a4040] transition disabled:opacity-50"
            >
              {loading ? 'Memproses...' : 'Masuk'}
            </button>
          </div>

          <p className="text-center text-xs text-[#9ca3af] mt-8">
            Butuh bantuan?{' '}
            <span className="text-[#1a2e2e] font-medium cursor-pointer hover:underline">
              Hubungi support
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}