'use client'

import { useState, useEffect } from 'react'
import { Friendship } from '@/lib/types'
import { subscribeToFriendships } from '@/lib/firestore'

export function useFriends(userId: string | null) {
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    const unsub = subscribeToFriendships(userId, (f) => {
      setFriendships(f)
      setLoading(false)
    })
    return unsub
  }, [userId])

  return { friendships, loading }
}
