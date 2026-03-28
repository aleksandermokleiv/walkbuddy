'use client'

import { useState, useEffect } from 'react'
import { Match } from '@/lib/types'
import { subscribeToMatches } from '@/lib/firestore'

export function useMatches(userId: string | null) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    const unsub = subscribeToMatches(userId, (m) => {
      setMatches(m)
      setLoading(false)
    })
    return unsub
  }, [userId])

  return { matches, loading }
}
