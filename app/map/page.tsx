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
import { GYMS } from '@/lib/gyms'
import { Timestamp } from 'firebase/firestore'

const DISCIPLINE_OPTIONS = [
  { value: 'sport', label: 'Sport', emoji: '🏔️' },
  { value: 'bouldering', label: 'Bouldering', emoji: '🪨' },
  { value: 'trad', label: 'Trad', emoji: '🪛' },
  { value: 'top-rope', label: 'Top-rope', emoji: '🔗' },
  { value: 'multi-pitch', label: 'Multi-pitch', emoji: '⛰️' },
  { value: 'ice', label: 'Ice', emoji: '🧊' },
]

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

  const [selectedDisciplines, setSelectedDisciplines] = useState<string[]>([])
  const [showFilter, setShowFilter] = useState(false)

  const { parents, loading } = useNearbyParents(
    profile?.location ?? null,
    user?.uid ?? null,
    5,
    selectedDisciplines
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
        ? { ...prev, isAvailableNow: next, availabilityExpiresAt: update.availabilityExpiresAt }
        : prev
    )
  }

  const toggleDiscipline = (value: string) => {
    setSelectedDisciplines((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    )
  }

  const defaultCenter = { lat: 59.9139, lng: 10.7522 }
  const center = profile?.location?.lat ? profile.location : defaultCenter

  const filterActive = selectedDisciplines.length > 0

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 relative" style={{ paddingBottom: '64px' }}>
        {!profileLoaded ? (
          <div className="flex items-center justify-center h-full bg-stone-50">
            <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <MapView
            center={center}
            parents={parents}
            currentUserId={user?.uid ?? ''}
            profileLoaded={profileLoaded}
            gyms={GYMS}
          />
        )}

        {/* Availability pill */}
        {profileLoaded && (
          <button
            onClick={toggleAvailability}
            className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 px-5 py-2.5 rounded-full shadow-lg font-semibold text-sm transition-all ${
              profile?.isAvailableNow
                ? 'bg-green-500 text-white'
                : 'bg-white text-stone-600'
            }`}
          >
            {profile?.isAvailableNow ? '🧗 I\'m at the wall!' : '💤 Not climbing today'}
          </button>
        )}

        {/* Filter button */}
        {profileLoaded && (
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`absolute top-4 right-4 z-10 px-3 py-2 rounded-full shadow-lg font-semibold text-sm transition-all ${
              filterActive ? 'bg-amber-400 text-white' : 'bg-white text-stone-600'
            }`}
          >
            🔽 Filter
          </button>
        )}

        {/* Filter bottom sheet */}
        {showFilter && (
          <div className="absolute top-16 right-4 z-20 bg-white rounded-2xl shadow-xl border border-stone-100 p-4 w-64">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-stone-700">Filter by Discipline</p>
              {filterActive && (
                <button
                  onClick={() => setSelectedDisciplines([])}
                  className="text-xs text-amber-600 font-medium hover:text-amber-700"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {DISCIPLINE_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  onClick={() => toggleDiscipline(d.value)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border-2 text-xs font-semibold transition-all ${
                    selectedDisciplines.includes(d.value)
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <span>{d.emoji}</span>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Nearby climbers count */}
        {profileLoaded && (
          <div className="absolute bottom-20 left-4 z-10 bg-white rounded-full px-3 py-1.5 shadow text-sm font-medium text-stone-700">
            🧗 {parents.length} climbers nearby
          </div>
        )}

        {/* Empty state overlay */}
        {profileLoaded && !loading && parents.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="bg-white rounded-2xl shadow-lg border border-stone-100 p-6 mx-8 text-center pointer-events-auto">
              <p className="text-lg font-bold text-stone-800">No climbers nearby right now 🧗</p>
              <p className="text-sm text-stone-500 mt-2">
                Turn on availability to appear on the map!
              </p>
            </div>
          </div>
        )}
      </div>

      <Navbar pendingCount={pendingCount} pendingFriendRequests={pendingFriendRequests} />
    </div>
  )
}
