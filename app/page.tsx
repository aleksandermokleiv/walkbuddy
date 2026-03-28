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
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <div className="w-10 h-10 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 flex flex-col items-center justify-center px-6 text-center">
      <div className="max-w-sm mx-auto">
        <div className="text-7xl mb-4">🚶‍♀️👶</div>
        <h1 className="text-4xl font-bold text-amber-700 mb-3">WalkBuddy</h1>
        <p className="text-gray-600 text-lg mb-8 leading-relaxed">
          Connect with other new parents nearby for refreshing walks and friendship.
        </p>
        <div className="space-y-3">
          <Link
            href="/auth/signup"
            className="block w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-4 rounded-2xl transition-colors shadow-md"
          >
            Get Started 🌟
          </Link>
          <Link
            href="/auth/login"
            className="block w-full bg-white hover:bg-amber-50 text-amber-700 font-semibold py-4 rounded-2xl transition-colors border border-amber-200"
          >
            Sign In
          </Link>
        </div>
        <p className="text-xs text-gray-400 mt-6">
          Free to join. Safe community for parents.
        </p>
      </div>
    </main>
  )
}
