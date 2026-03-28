'use client'

import { useState, useEffect } from 'react'
import { Group } from '@/lib/types'
import { subscribeToGroups } from '@/lib/firestore'

export function useGroups(userId: string | null) {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    const unsub = subscribeToGroups(userId, (g) => {
      setGroups(g)
      setLoading(false)
    })
    return unsub
  }, [userId])

  return { groups, loading }
}
