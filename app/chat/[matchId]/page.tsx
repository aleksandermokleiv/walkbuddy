'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AuthGuard from '@/components/AuthGuard'
import ChatWindow from '@/components/ChatWindow'
import { useAuth } from '@/hooks/useAuth'
import { getUserProfile } from '@/lib/firestore'
import { db } from '@/lib/firebase'
import { doc, getDoc } from 'firebase/firestore'
import { Match, UserProfile } from '@/lib/types'

export default function ChatPage() {
  return (
    <AuthGuard>
      <ChatContent />
    </AuthGuard>
  )
}

function ChatContent() {
  const { matchId } = useParams<{ matchId: string }>()
  const { user } = useAuth()
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!matchId || !user) return
    const fetchData = async () => {
      try {
        const matchDoc = await getDoc(doc(db, 'matches', matchId))
        if (!matchDoc.exists()) {
          setError('This conversation was not found.')
          setLoading(false)
          return
        }
        const matchData = matchDoc.data() as Match
        if (!matchData.participants.includes(user.uid)) {
          setError('You do not have access to this conversation.')
          setLoading(false)
          return
        }
        const otherId = matchData.participants.find((p) => p !== user.uid) ?? ''
        if (otherId) {
          const other = await getUserProfile(otherId)
          setOtherUser(other)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [matchId, user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-amber-50 px-6 text-center">
        <div className="text-4xl mb-3">😔</div>
        <p className="text-gray-600 mb-4">{error}</p>
        <Link href="/chat" className="text-amber-600 font-semibold hover:underline">
          ← Back to messages
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Back button */}
      <div className="bg-white border-b border-amber-100 px-4 py-2">
        <Link href="/chat" className="text-amber-600 hover:underline text-sm font-medium flex items-center gap-1">
          ← Back
        </Link>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatWindow
          matchId={matchId}
          currentUserId={user?.uid ?? ''}
          otherUser={otherUser}
        />
      </div>
    </div>
  )
}
