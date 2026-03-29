'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import Link from 'next/link'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-stone-900">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-amber-900 flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm mx-auto">
        <div className="text-7xl mb-4">🧗</div>
        <h1 className="text-4xl font-black tracking-tight text-white mb-3">Climb Squad</h1>
        <p className="text-stone-300 text-lg mb-8 leading-relaxed">
          Find your perfect climbing partner. Whether you&apos;re crushing V10s or just starting out — your crew is waiting.
        </p>
        <div className="space-y-3">
          <Link
            href="/auth/signup"
            className="block w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md"
          >
            Get Started 🧗
          </Link>
          <Link
            href="/auth/login"
            className="block w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-2xl transition-all border border-white/20"
          >
            Sign In
          </Link>
        </div>
        <p className="text-xs text-stone-500 mt-6">
          Free to join. Connect with climbers near you.
        </p>
      </div>
    </main>
  )
}
