'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { useFriends } from '@/hooks/useFriends'
import { getUserProfile } from '@/lib/firestore'
import { signOut } from '@/lib/auth'
import { UserProfile } from '@/lib/types'
import Image from 'next/image'

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-orange-100 text-orange-700',
  expert: 'bg-red-100 text-red-700',
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}

function DashboardContent() {
  const { user } = useAuth()
  const { matches } = useMatches(user?.uid ?? null)
  const { friendships } = useFriends(user?.uid ?? null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const router = useRouter()

  const pendingCount = matches.filter(
    (m) => m.status === 'pending' && m.initiatedBy !== user?.uid
  ).length

  const completedSessions = matches.filter((m) => m.status === 'completed').length

  const pendingFriendRequests = friendships.filter(
    (f) => f.status === 'pending' && f.initiatedBy !== user?.uid
  ).length

  useEffect(() => {
    if (!user) return
    getUserProfile(user.uid).then(setProfile)
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <div className="bg-white border-b border-stone-200 px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-black tracking-tight text-stone-900">Climb Squad 🧗</h1>
        <button onClick={handleSignOut} className="text-sm text-stone-500 hover:text-stone-700">
          Sign out
        </button>
      </div>

      <div className="max-w-sm mx-auto px-4 py-6 space-y-4">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-300 flex-shrink-0">
              {profile?.photoURL ? (
                <Image src={profile.photoURL} alt={profile.displayName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-amber-100 flex items-center justify-center text-3xl">
                  🧗
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-stone-800 text-lg">
                {profile?.displayName ?? user?.email}
              </h2>
              {profile?.username && (
                <p className="text-amber-500 text-xs font-medium">@{profile.username}</p>
              )}
              {profile?.climbingLevel && (
                <div className="flex flex-wrap items-center gap-1.5 mt-1">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full capitalize ${LEVEL_COLORS[profile.climbingLevel]}`}>
                    {profile.climbingLevel}
                  </span>
                  {profile.disciplines?.slice(0, 3).map((d) => (
                    <span key={d} className="text-xs bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full capitalize">
                      {d}
                    </span>
                  ))}
                </div>
              )}
              {profile?.homeGym && (
                <p className="text-stone-500 text-xs mt-1">🏟️ {profile.homeGym}</p>
              )}
            </div>
          </div>
          {profile?.bio && (
            <p className="text-stone-600 text-sm mt-3 bg-stone-50 rounded-xl p-3">{profile.bio}</p>
          )}
          {/* Stats row */}
          <div className="flex gap-4 mt-3 pt-3 border-t border-stone-100">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">{completedSessions}</p>
              <p className="text-xs text-stone-400">Sessions completed</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">
                {friendships.filter((f) => f.status === 'accepted').length}
              </p>
              <p className="text-xs text-stone-400">Friends</p>
            </div>
          </div>
          <Link
            href="/profile/edit"
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-stone-50 hover:bg-stone-100 text-stone-700 text-sm font-medium transition-colors"
          >
            Edit Profile ✏️
          </Link>
        </div>

        {pendingCount > 0 && (
          <div className="bg-amber-500 rounded-2xl p-4 text-white">
            <p className="font-semibold">
              🔔 You have {pendingCount} pending session request{pendingCount !== 1 ? 's' : ''}!
            </p>
            <Link href="/matches" className="text-sm underline mt-1 block">
              View requests →
            </Link>
          </div>
        )}

        {pendingFriendRequests > 0 && (
          <div className="bg-blue-500 rounded-2xl p-4 text-white">
            <p className="font-semibold">
              👋 You have {pendingFriendRequests} friend request{pendingFriendRequests !== 1 ? 's' : ''}!
            </p>
            <Link href="/friends" className="text-sm underline mt-1 block">
              View requests →
            </Link>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          <Link
            href="/map"
            className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-stone-100 hover:bg-stone-50 transition-colors"
          >
            <span className="text-2xl">🗺️</span>
            <span className="text-xs font-medium text-stone-600">Find Climbers</span>
          </Link>
          <Link
            href="/matches"
            className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-stone-100 hover:bg-stone-50 transition-colors relative"
          >
            <span className="text-2xl">🤝</span>
            <span className="text-xs font-medium text-stone-600">Sessions</span>
            {pendingCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href="/friends"
            className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-stone-100 hover:bg-stone-50 transition-colors relative"
          >
            <span className="text-2xl">💬</span>
            <span className="text-xs font-medium text-stone-600">Messages</span>
            {pendingFriendRequests > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {pendingFriendRequests}
              </span>
            )}
          </Link>
        </div>

        {/* Tip */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">💡 Tip</p>
          <p className="text-sm text-amber-700">
            Tap the map and toggle availability when you&apos;re at the wall — other climbers can find you!
          </p>
        </div>
      </div>

      <Navbar pendingCount={pendingCount} pendingFriendRequests={pendingFriendRequests} />
    </div>
  )
}
