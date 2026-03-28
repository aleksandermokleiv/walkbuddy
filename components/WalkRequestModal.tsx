'use client'

import { useState } from 'react'
import { UserProfile } from '@/lib/types'
import { createMatch } from '@/lib/firestore'
import { Timestamp } from 'firebase/firestore'

interface WalkRequestModalProps {
  fromUserId: string
  toParent: UserProfile
  onClose: () => void
  onSuccess: () => void
}

export default function WalkRequestModal({
  fromUserId,
  toParent,
  onClose,
  onSuccess,
}: WalkRequestModalProps) {
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
            <h2 className="text-xl font-bold text-gray-800">Request a Walk</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            Send a walk request to <span className="font-semibold text-amber-600">{toParent.displayName}</span>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proposed Date & Time
              </label>
              <input
                type="datetime-local"
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Spot
              </label>
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g. Riverside Park entrance"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm bg-red-50 rounded-lg p-2">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm"
            >
              {loading ? 'Sending...' : 'Send Walk Request 🚶'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
