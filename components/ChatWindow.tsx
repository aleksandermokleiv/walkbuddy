'use client'

import { useState, useEffect, useRef } from 'react'
import { useMessages } from '@/hooks/useMessages'
import { sendMessage } from '@/lib/firestore'
import { format } from 'date-fns'
import { UserProfile } from '@/lib/types'

interface ChatWindowProps {
  matchId: string
  currentUserId: string
  otherUser: UserProfile | null
}

export default function ChatWindow({ matchId, currentUserId, otherUser }: ChatWindowProps) {
  const { messages, loading } = useMessages(matchId)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await sendMessage(matchId, currentUserId, text.trim())
      setText('')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-4 py-3 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center overflow-hidden">
          {otherUser?.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={otherUser.photoURL} alt={otherUser.displayName} className="w-full h-full object-cover" />
          ) : (
            <span>🧗</span>
          )}
        </div>
        <div>
          <p className="font-semibold text-stone-800">{otherUser?.displayName ?? 'Climbing Partner'}</p>
          <p className="text-xs text-stone-500">Climbing partner</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-stone-50">
        {messages.length === 0 && (
          <div className="text-center text-stone-500 text-sm mt-8">
            <p className="text-3xl mb-2">🧗</p>
            <p>Start planning your session! 🧗</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMine = msg.senderId === currentUserId
          const time = msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'h:mm a') : ''
          return (
            <div key={msg.messageId} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div
                  className={`px-4 py-2.5 rounded-2xl text-sm ${
                    isMine
                      ? 'bg-amber-500 text-white rounded-br-sm'
                      : 'bg-white text-stone-800 shadow-sm rounded-bl-sm'
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-xs text-stone-400">{time}</span>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="bg-white border-t border-stone-100 px-4 py-3 flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-stone-50 border border-stone-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-colors"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white rounded-full w-10 h-10 flex items-center justify-center transition-colors flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  )
}
