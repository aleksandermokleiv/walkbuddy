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

  const completedWalks = matches.filter((m) => m.status === 'completed').length

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
    <div className="min-h-screen bg-amber-50 pb-24">
      <div className="bg-white border-b border-amber-100 px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-amber-700">WalkBuddy 🚶‍♀️</h1>
        <button onClick={handleSignOut} className="text-sm text-gray-500 hover:text-gray-700">
          Sign out
        </button>
      </div>

      <div className="max-w-sm mx-auto px-4 py-6 space-y-4">
        {/* Profile card */}
        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-300 flex-shrink-0">
              {profile?.photoURL ? (
                <Image src={profile.photoURL} alt={profile.displayName} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-amber-100 flex items-center justify-center text-3xl">
                  👶
                </div>
              )}
            </div>
            <div>
              <h2 className="font-bold text-gray-800 text-lg">
                {profile?.displayName ?? user?.email}
              </h2>
              {profile?.username && (
                <p className="text-amber-500 text-xs font-medium">@{profile.username}</p>
              )}
              {profile?.babyName && (
                <p className="text-amber-600 text-sm">
                  Parent of {profile.babyName} ({profile.babyAgeMonths}mo)
                </p>
              )}
              {profile?.neighborhood && (
                <p className="text-gray-500 text-xs">{profile.neighborhood}</p>
              )}
            </div>
          </div>
          {profile?.bio && (
            <p className="text-gray-600 text-sm mt-3 bg-amber-50 rounded-xl p-3">{profile.bio}</p>
          )}
          {/* Stats row */}
          <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">{completedWalks}</p>
              <p className="text-xs text-gray-400">Walks taken</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-amber-600">
                {friendships.filter((f) => f.status === 'accepted').length}
              </p>
              <p className="text-xs text-gray-400">Friends</p>
            </div>
          </div>
          {/* Edit profile link */}
          <Link
            href="/profile/edit"
            className="mt-3 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 text-sm font-medium transition-colors"
          >
            Edit Profile ✏️
          </Link>
        </div>

        {/* Stats / notifications */}
        {pendingCount > 0 && (
          <div className="bg-amber-500 rounded-2xl p-4 text-white">
            <p className="font-semibold">
              🔔 You have {pendingCount} pending walk request{pendingCount !== 1 ? 's' : ''}!
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
            className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-amber-100 hover:bg-amber-50 transition-colors"
          >
            <span className="text-2xl">🗺️</span>
            <span className="text-xs font-medium text-gray-600">Find Walkers</span>
          </Link>
          <Link
            href="/matches"
            className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-amber-100 hover:bg-amber-50 transition-colors relative"
          >
            <span className="text-2xl">💛</span>
            <span className="text-xs font-medium text-gray-600">Matches</span>
            {pendingCount > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {pendingCount}
              </span>
            )}
          </Link>
          <Link
            href="/friends"
            className="bg-white rounded-2xl p-4 flex flex-col items-center gap-2 shadow-sm border border-amber-100 hover:bg-amber-50 transition-colors relative"
          >
            <span className="text-2xl">👥</span>
            <span className="text-xs font-medium text-gray-600">Friends</span>
            {pendingFriendRequests > 0 && (
              <span className="absolute top-2 right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
                {pendingFriendRequests}
              </span>
            )}
          </Link>
        </div>

        {/* Tips */}
        <div className="bg-gradient-to-r from-amber-100 to-orange-100 rounded-2xl p-4">
          <p className="text-sm font-semibold text-amber-800 mb-1">💡 Tip</p>
          <p className="text-sm text-amber-700">
            Tap the map and use the availability button when you&apos;re heading out — other parents can find you!
          </p>
        </div>
      </div>

      <Navbar pendingCount={pendingCount} pendingFriendRequests={pendingFriendRequests} />
    </div>
  )
}
