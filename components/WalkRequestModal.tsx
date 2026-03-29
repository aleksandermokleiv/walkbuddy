'use client'

import { useState } from 'react'
import { UserProfile, Match } from '@/lib/types'
import { createMatch } from '@/lib/firestore'
import { Timestamp } from 'firebase/firestore'

interface WalkRequestModalProps {
  fromUserId: string
  toParent: UserProfile
  onClose: () => void
  onSuccess: () => void
}

type SessionType = Match['sessionType']

const SESSION_TYPES: { value: SessionType; label: string; emoji: string }[] = [
  { value: 'gym', label: 'Gym Session', emoji: '🏟️' },
  { value: 'outdoor', label: 'Outdoor Crag', emoji: '🌄' },
  { value: 'bouldering', label: 'Bouldering', emoji: '🪨' },
  { value: 'multi-pitch', label: 'Multi-pitch', emoji: '⛰️' },
]

export default function WalkRequestModal({
  fromUserId,
  toParent,
  onClose,
  onSuccess,
}: WalkRequestModalProps) {
  const [sessionType, setSessionType] = useState<SessionType>('gym')
  const [dateTime, setDateTime] = useState('')
  const [locationName, setLocationName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dateTime || !locationName) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError('')
    try {
      const proposedTime = Timestamp.fromDate(new Date(dateTime))
      const meetingLat = (toParent.location?.lat ?? 0) + (Math.random() - 0.5) * 0.01
      const meetingLng = (toParent.location?.lng ?? 0) + (Math.random() - 0.5) * 0.01
      await createMatch({
        participants: [fromUserId, toParent.uid],
        status: 'pending',
        proposedTime,
        proposedLocation: {
          lat: meetingLat,
          lng: meetingLng,
          name: locationName,
        },
        initiatedBy: fromUserId,
        sessionType,
      })
      onSuccess()
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black tracking-tight text-stone-800">Request a Climb Session</h2>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-2xl">×</button>
          </div>
          <p className="text-sm text-stone-500 mb-4">
            Send a session request to <span className="font-semibold text-amber-600">{toParent.displayName}</span>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Session type selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Session Type</label>
              <div className="grid grid-cols-2 gap-2">
                {SESSION_TYPES.map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    onClick={() => setSessionType(st.value)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-left ${
                      sessionType === st.value
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <span className="text-xl">{st.emoji}</span>
                    <span className={`text-sm font-semibold ${sessionType === st.value ? 'text-amber-700' : 'text-stone-700'}`}>
                      {st.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
                Proposed Date &amp; Time
              </label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
                Location / Gym
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Klatreverket Nydalen"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-colors"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg p-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white font-bold py-3.5 rounded-2xl transition-all shadow-md"
            >
              {loading ? 'Sending...' : 'Send Session Request 🧗'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
