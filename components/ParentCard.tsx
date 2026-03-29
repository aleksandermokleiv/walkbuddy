'use client'

import Image from 'next/image'
import { UserProfile } from '@/lib/types'

interface ParentCardProps {
  parent: UserProfile
  onRequestWalk: (parent: UserProfile) => void
  onClose?: () => void
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-orange-100 text-orange-700',
  expert: 'bg-red-100 text-red-700',
}

export default function ParentCard({ parent, onRequestWalk, onClose }: ParentCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-stone-100 p-4 w-72 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-stone-400 hover:text-stone-600 text-xl font-bold"
        >
          ×
        </button>
      )}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-300 flex-shrink-0">
          {parent.photoURL ? (
            <Image src={parent.photoURL} alt={parent.displayName} fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-amber-100 flex items-center justify-center text-2xl">
              🧗
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-stone-800">{parent.displayName}</h3>
          {parent.username && (
            <p className="text-xs text-amber-500">@{parent.username}</p>
          )}
          {parent.climbingLevel && (
            <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full capitalize mt-0.5 ${LEVEL_COLORS[parent.climbingLevel]}`}>
              {parent.climbingLevel}
            </span>
          )}
        </div>
      </div>
      {parent.disciplines && parent.disciplines.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {parent.disciplines.map((d) => (
            <span key={d} className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full capitalize">
              {d}
            </span>
          ))}
        </div>
      )}
      {parent.homeGym && (
        <p className="text-xs text-stone-500 mb-2">🏟️ {parent.homeGym}</p>
      )}
      {parent.bio && (
        <p className="text-sm text-stone-600 mb-3 bg-stone-50 rounded-lg p-2">{parent.bio}</p>
      )}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-xs text-green-600 font-medium">At the wall 🧗</span>
      </div>
      <button
        onClick={() => onRequestWalk(parent)}
        className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold py-2.5 rounded-2xl transition-all shadow-md"
      >
        Request a Session 🧗
      </button>
    </div>
  )
}
