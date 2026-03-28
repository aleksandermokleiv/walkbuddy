'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'
import MapView from '@/components/MapView'
import { useAuth } from '@/hooks/useAuth'
import { useNearbyParents } from '@/hooks/useNearbyParents'
import { useMatches } from '@/hooks/useMatches'
import { useFriends } from '@/hooks/useFriends'
import { getUserProfile, updateUserProfile } from '@/lib/firestore'
import { UserProfile } from '@/lib/types'
import { Timestamp } from 'firebase/firestore'

export default function MapPage() {
  return (
    <AuthGuard>
      <MapContent />
    </AuthGuard>
  )
}

function MapContent() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoaded, setProfileLoaded] = useState(false)

  // Filter state
  const [minAge, setMinAge] = useState(0)
  const [maxAge, setMaxAge] = useState(24)
  const [showFilter, setShowFilter] = useState(false)

  const { parents, loading } = useNearbyParents(
    profile?.location ?? null,
    user?.uid ?? null,
    5,
    minAge,
    maxAge
  )
  const { matches } = useMatches(user?.uid ?? null)
  const { friendships } = useFriends(user?.uid ?? null)

  const pendingCount = matches.filter(
    (m) => m.status === 'pending' && m.initiatedBy !== user?.uid
  ).length

  const pendingFriendRequests = friendships.filter(
    (f) => f.status === 'pending' && f.initiatedBy !== user?.uid
  ).length

  useEffect(() => {
    if (!user) return
    getUserProfile(user.uid).then((p) => {
      setProfile(p)
      setProfileLoaded(true)
    })
  }, [user])

  // Auto-off: if availability has expired, update Firestore
  useEffect(() => {
    if (!user || !profile) return
    if (profile.isAvailableNow && profile.availabilityExpiresAt) {
      const expiresAt = profile.availabilityExpiresAt.toDate()
      if (expiresAt < new Date()) {
        updateUserProfile(user.uid, { isAvailableNow: false })
        setProfile((prev) => prev ? { ...prev, isAvailableNow: false } : prev)
      }
    }
  }, [user, profile])

  const toggleAvailability = async () => {
    if (!user || !profile) return
    const next = !profile.isAvailableNow
    const update: Partial<UserProfile> = { isAvailableNow: next }
    if (next) {
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 2)
      update.availabilityExpiresAt = Timestamp.fromDate(expiresAt)
    } else {
      update.availabilityExpiresAt = undefined
    }
    await updateUserProfile(user.uid, update)
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            isAvailableNow: next,
            availabilityExpiresAt: update.availabilityExpiresAt,
          }
        : prev
    )
  }

  const defaultCenter = { lat: 40.7128, lng: -74.006 }
  const center = profile?.location?.lat ? profile.location : defaultCenter

  const filterActive = minAge !== 0 || maxAge !== 24

  return (
    <div className="flex flex-col h-screen">
      {/* Map fills the screen */}
      <div className="flex-1 relative" style={{ paddingBottom: '64px' }}>
        {!profileLoaded ? (
          <div className="flex items-center justify-center h-full bg-amber-50">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <MapView
            center={center}
            parents={parents}
            currentUserId={user?.uid ?? ''}
            profileLoaded={profileLoaded}
          />
        )}

        {/* Availability pill - top center */}
        {profileLoaded && (
          <button
            onClick={toggleAvailability}
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 px-5 py-2.5 rounded-full shadow-lg font-semibold text-sm transition-all ${
              profile?.isAvailableNow
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-600'
            }`}
          >
            {profile?.isAvailableNow ? '🟢 I\'m heading out!' : '⚪ I\'m staying in'}
          </button>
        )}

        {/* Filter button - top right */}
        {profileLoaded && (
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`absolute top-4 right-4 z-10 px-3 py-2 rounded-full shadow-lg font-semibold text-sm transition-all ${
              filterActive ? 'bg-amber-400 text-white' : 'bg-white text-gray-600'
            }`}
          >
            🔽 Filter
          </button>
        )}

        {/* Filter dropdown */}
        {showFilter && (
          <div className="absolute top-16 right-4 z-20 bg-white rounded-2xl shadow-xl border border-amber-100 p-4 w-56">
            <p className="text-sm font-semibold text-gray-700 mb-3">Baby Age Filter</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Min age (months)</label>
                <select
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {Array.from({ length: 25 }, (_, i) => (
                    <option key={i} value={i}>{i === 0 ? 'Newborn' : `${i}mo`}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Max age (months)</label>
                <select
                  value={maxAge}
                  onChange={(e) => setMaxAge(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-800 mt-1 focus:outline-none focus:ring-2 focus:ring-amber-400"
                >
                  {Array.from({ length: 25 }, (_, i) => (
                    <option key={i} value={i}>{i === 0 ? 'Newborn' : `${i}mo`}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => { setMinAge(0); setMaxAge(24); }}
                className="w-full text-xs text-amber-600 hover:text-amber-700 font-medium"
              >
                Reset to default
              </button>
            </div>
          </div>
        )}

        {/* Bottom-left chip: nearby count */}
        {profileLoaded && (
          <div className="absolute bottom-20 left-4 z-10 bg-white rounded-full px-3 py-1.5 shadow text-sm font-medium text-gray-700">
            👶 {parents.length} nearby
          </div>
        )}

        {/* Empty state overlay */}
        {profileLoaded && !loading && parents.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-white rounded-2xl shadow-lg border border-amber-100 p-6 mx-8 text-center pointer-events-auto">
              <p className="text-lg font-semibold text-gray-800">No one nearby right now 👀</p>
              <p className="text-sm text-gray-500 mt-2">
                Turn on availability to appear on the map, or check back later!
              </p>
            </div>
          </div>
        )}
      </div>

      <Navbar pendingCount={pendingCount} pendingFriendRequests={pendingFriendRequests} />
    </div>
  )
}
