'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { useFriends } from '@/hooks/useFriends'
import { updateMatchStatus, getUserProfile } from '@/lib/firestore'
import { Match, UserProfile } from '@/lib/types'
import { format } from 'date-fns'

export default function MatchesPage() {
  return (
    <AuthGuard>
      <MatchesContent />
    </AuthGuard>
  )
}

function MatchCard({
  match,
  currentUserId,
  onAccept,
  onDecline,
}: {
  match: Match
  currentUserId: string
  onAccept?: () => void
  onDecline?: () => void
}) {
  const otherId = match.participants.find((p) => p !== currentUserId) ?? ''
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null)
  const isIncoming = match.initiatedBy !== currentUserId && match.status === 'pending'

  useEffect(() => {
    if (otherId) getUserProfile(otherId).then(setOtherUser)
  }, [otherId])

  const proposedDate = match.proposedTime?.toDate ? match.proposedTime.toDate() : null
  const timeStr = proposedDate ? format(proposedDate, 'EEE, MMM d • h:mm a') : ''

  const now = new Date()
  const isExpired = proposedDate ? proposedDate < new Date(now.getTime() - 24 * 60 * 60 * 1000) : false
  const isSoon = proposedDate
    ? proposedDate > now && proposedDate < new Date(now.getTime() + 2 * 60 * 60 * 1000)
    : false

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-green-100 text-green-700',
    declined: 'bg-red-100 text-red-700',
    completed: 'bg-stone-100 text-stone-600',
  }

  const sessionTypeLabels: Record<string, string> = {
    gym: '🏟️ Gym Session',
    outdoor: '🌄 Outdoor Crag',
    bouldering: '🪨 Bouldering',
    'multi-pitch': '⛰️ Multi-pitch',
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {otherUser?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={otherUser.photoURL} alt={otherUser.displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl">🧗</span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-stone-800">{otherUser?.displayName ?? 'Loading...'}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[match.status]}`}>
              {match.status === 'accepted' ? 'Session confirmed 🧗' : match.status}
            </span>
            {isExpired && match.status === 'pending' && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-stone-200 text-stone-500">
                Expired
              </span>
            )}
          </div>
        </div>
      </div>
      {match.sessionType && (
        <div className="text-xs text-stone-500 mb-2 font-medium">
          {sessionTypeLabels[match.sessionType] ?? match.sessionType}
        </div>
      )}
      {timeStr && (
        <div className="text-sm text-stone-700 mb-2 font-medium">
          <span>📅 {timeStr}</span>
          {isSoon && (
            <span className="ml-2 text-amber-600 font-bold text-xs">⚡ Soon!</span>
          )}
        </div>
      )}
      {match.proposedLocation?.name && (
        <div className="text-sm text-stone-600 mb-3">
          <span>📍 {match.proposedLocation.name}</span>
        </div>
      )}
      {isIncoming && (
        <div className="flex gap-2">
          <button
            onClick={onDecline}
            className="flex-1 border border-stone-200 text-stone-600 py-2 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={isExpired}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-xl text-sm font-bold transition-colors"
          >
            Accept Session! 🧗
          </button>
        </div>
      )}
      {match.status === 'accepted' && (
        <Link
          href={`/chat/${match.matchId}`}
          className="block w-full text-center bg-stone-50 hover:bg-stone-100 text-stone-700 font-semibold py-2 rounded-xl text-sm transition-colors"
        >
          💬 Open Chat
        </Link>
      )}
    </div>
  )
}

function MatchesContent() {
  const { user } = useAuth()
  const { matches, loading } = useMatches(user?.uid ?? null)
  const { friendships } = useFriends(user?.uid ?? null)
  const [updating, setUpdating] = useState<string | null>(null)

  const pending = matches.filter((m) => m.status === 'pending')
  const accepted = matches.filter((m) => m.status === 'accepted')
  const other = matches.filter((m) => m.status === 'declined' || m.status === 'completed')

  const pendingCount = pending.filter((m) => m.initiatedBy !== user?.uid).length
  const pendingFriendRequests = friendships.filter(
    (f) => f.status === 'pending' && f.initiatedBy !== user?.uid
  ).length

  const handleAccept = async (matchId: string) => {
    setUpdating(matchId)
    await updateMatchStatus(matchId, 'accepted')
    setUpdating(null)
  }

  const handleDecline = async (matchId: string) => {
    setUpdating(matchId)
    await updateMatchStatus(matchId, 'declined')
    setUpdating(null)
  }

  void updating

  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      <div className="bg-white border-b border-stone-200 px-4 py-4">
        <h1 className="text-3xl font-black tracking-tight text-stone-900">Climb Sessions</h1>
        <p className="text-sm text-stone-600">Your climbing plans</p>
      </div>

      <div className="max-w-sm mx-auto px-4 py-4 space-y-6">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-stone-100" />
            ))}
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                  Pending Requests
                </h2>
                <div className="space-y-3">
                  {pending.map((m) => (
                    <MatchCard
                      key={m.matchId}
                      match={m}
                      currentUserId={user?.uid ?? ''}
                      onAccept={() => handleAccept(m.matchId)}
                      onDecline={() => handleDecline(m.matchId)}
                    />
                  ))}
                </div>
              </section>
            )}

            {accepted.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                  Your Climbing Sessions
                </h2>
                <div className="space-y-3">
                  {accepted.map((m) => (
                    <MatchCard key={m.matchId} match={m} currentUserId={user?.uid ?? ''} />
                  ))}
                </div>
              </section>
            )}

            {other.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-3">
                  Past Requests
                </h2>
                <div className="space-y-3">
                  {other.map((m) => (
                    <MatchCard key={m.matchId} match={m} currentUserId={user?.uid ?? ''} />
                  ))}
                </div>
              </section>
            )}

            {matches.length === 0 && (
              <div className="text-center py-12">
                <div className="text-5xl mb-3">🧗</div>
                <p className="text-stone-800 font-bold">No sessions yet</p>
                <p className="text-stone-500 text-sm mt-1">
                  Head to the map to find climbing partners!
                </p>
                <Link
                  href="/map"
                  className="inline-block mt-4 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold px-6 py-2.5 rounded-2xl transition-all shadow-md"
                >
                  Find Climbers 🗺️
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      <Navbar pendingCount={pendingCount} pendingFriendRequests={pendingFriendRequests} />
    </div>
  )
}
