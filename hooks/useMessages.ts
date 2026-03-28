'use client'

import { useState, useEffect } from 'react'
import { Message } from '@/lib/types'
import { subscribeToMessages } from '@/lib/firestore'

export function useMessages(matchId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!matchId) return
    const unsub = subscribeToMessages(matchId, (msgs) => {
      setMessages(msgs)
      setLoading(false)
    })
    return unsub
  }, [matchId])

  return { messages, loading }
}
