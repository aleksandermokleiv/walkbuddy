'use client'

import Image from 'next/image'
import { UserProfile } from '@/lib/types'

interface ParentCardProps {
  parent: UserProfile
  onRequestWalk: (parent: UserProfile) => void
  onClose?: () => void
}

export default function ParentCard({ parent, onRequestWalk, onClose }: ParentCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 w-72 relative">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-xl font-bold"
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
              👶
            </div>
          )}
        </div>
        <div>
          <h3 className="font-bold text-gray-800">{parent.displayName}</h3>
          <p className="text-sm text-amber-600">
            Baby {parent.babyName}, {parent.babyAgeMonths}mo
          </p>
          <p className="text-xs text-gray-500">{parent.neighborhood}</p>
        </div>
      </div>
      {parent.bio && (
        <p className="text-sm text-gray-600 mb-3 bg-amber-50 rounded-lg p-2">{parent.bio}</p>
      )}
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
        <span className="text-xs text-green-600 font-medium">Available now</span>
      </div>
      <button
        onClick={() => onRequestWalk(parent)}
        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm"
      >
        Request a Walk 🚶‍♀️
      </button>
    </div>
  )
}
