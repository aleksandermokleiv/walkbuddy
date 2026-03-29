'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn, signInWithGoogle } from '@/lib/auth'
import { getUserProfile, createUserProfile } from '@/lib/firestore'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      router.push('/dashboard')
    } catch {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setGoogleLoading(true)
    try {
      const cred = await signInWithGoogle()
      const existing = await getUserProfile(cred.user.uid)
      if (!existing) {
        await createUserProfile(cred.user.uid, {
          uid: cred.user.uid,
          email: cred.user.email ?? '',
          displayName: cred.user.displayName ?? '',
          photoURL: cred.user.photoURL ?? '',
          climbingLevel: 'beginner',
          disciplines: [],
          homeGym: '',
          bio: '',
          location: { lat: 0, lng: 0 },
          isAvailableNow: false,
        })
        router.push('/onboarding')
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Could not sign in with Google. Please try again.')
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-amber-900 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧗‍♀️</div>
          <h1 className="text-2xl font-black tracking-tight text-white">Welcome back, climber!</h1>
          <p className="text-stone-400 text-sm mt-1">Sign in to find your climbing crew</p>
        </div>
        <div className="bg-stone-800/80 backdrop-blur border border-stone-700 rounded-3xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-stone-700/50 border border-stone-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-white placeholder-stone-400 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-300 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full bg-stone-700/50 border border-stone-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-white placeholder-stone-400 transition-colors"
              />
            </div>
            {error && (
              <p className="text-red-300 text-sm bg-red-900/50 rounded-lg p-3">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-stone-600" />
            <span className="text-xs text-stone-500 font-medium">or</span>
            <div className="flex-1 h-px bg-stone-600" />
          </div>

          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-stone-600 rounded-xl py-3 text-stone-200 font-semibold hover:bg-stone-700 transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            {googleLoading ? 'Signing in...' : 'Continue with Google'}
          </button>
        </div>
        <p className="text-center text-sm text-stone-400 mt-4">
          New here?{' '}
          <Link href="/auth/signup" className="text-amber-400 font-semibold hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </main>
  )
}
