'use client'

import { useEffect } from 'react'

// Halaman daftar kini menyatu dengan halaman masuk (animasi geser).
export default function RegisterRedirect() {
  useEffect(() => { window.location.replace('/') }, [])
  return null
}
