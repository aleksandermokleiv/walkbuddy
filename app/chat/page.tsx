'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { getUserProfile } from '@/lib/firestore'
import { Match, UserProfile } from '@/lib/types'

export default function ChatListPage() {
  return (
    <AuthGuard>
      <ChatListContent />
    </AuthGuard>
  )
}

function ChatListContent() {
  const { user } = useAuth()
  const { matches, loading } = useMatches(user?.uid ?? null)
  const acceptedMatches = matches.filter((m) => m.status === 'accepted')

  const pendingCount = matches.filter(
    (m) => m.status === 'pending' && m.initiatedBy !== user?.uid
  ).length

  return (
    <div className="min-h-screen bg-amber-50 pb-24">
      <div className="bg-white border-b border-amber-100 px-4 py-4">
        <h1 className="text-xl font-bold text-gray-800">Messages</h1>
        <p className="text-sm text-gray-500">Chat with your walk buddies</p>
      </div>

      <div className="max-w-sm mx-auto px-4 py-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-amber-100" />
            ))}
          </div>
        ) : acceptedMatches.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">💬</div>
            <p className="text-gray-600 font-medium">No active chats</p>
            <p className="text-gray-400 text-sm mt-1">Accept a walk match to start chatting</p>
            <Link
              href="/matches"
              className="inline-block mt-4 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors"
            >
              View Matches
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {acceptedMatches.map((m) => (
              <ChatListItem key={m.matchId} match={m} currentUserId={user?.uid ?? ''} />
            ))}
          </div>
        )}
      </div>

      <Navbar pendingCount={pendingCount} />
    </div>
  )
}

function ChatListItem({ match, currentUserId }: { match: Match; currentUserId: string }) {
  const otherId = match.participants.find((p) => p !== currentUserId) ?? ''
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    if (otherId) getUserProfile(otherId).then(setOtherUser)
  }, [otherId])

  return (
    <Link href={`/chat/${match.matchId}`}>
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-4 flex items-center gap-3 hover:bg-amber-50 transition-colors">
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden flex-shrink-0">
          {otherUser?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={otherUser.photoURL} alt={otherUser.displayName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-xl">👶</span>
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-gray-800">{otherUser?.displayName ?? 'Walk Buddy'}</p>
          <p className="text-xs text-green-600 font-medium">Walk confirmed 🚶</p>
        </div>
        <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
