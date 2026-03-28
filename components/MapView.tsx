'use client'

import { useState } from 'react'
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import { UserProfile } from '@/lib/types'
import ParentCard from './ParentCard'
import WalkRequestModal from './WalkRequestModal'

interface MapViewProps {
  center: { lat: number; lng: number }
  parents: UserProfile[]
  currentUserId: string
  profileLoaded?: boolean
}

export default function MapView({ center, parents, currentUserId }: MapViewProps) {
  const [selectedParent, setSelectedParent] = useState<UserProfile | null>(null)
  const [requestParent, setRequestParent] = useState<UserProfile | null>(null)
  const [requestSuccess, setRequestSuccess] = useState(false)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

  return (
    <div className="relative w-full h-full">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={14}
          mapId="walkbuddy-map"
          gestureHandling="greedy"
          disableDefaultUI={true}
          className="w-full h-full"
        >
          {/* Current user marker */}
          <AdvancedMarker position={center}>
            <div className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white">
              You
            </div>
          </AdvancedMarker>

          {/* Nearby parents */}
          {parents.map((parent) => (
            <AdvancedMarker
              key={parent.uid}
              position={parent.location}
              onClick={() => setSelectedParent(parent)}
            >
              <div className="relative cursor-pointer hover:scale-110 transition-transform">
                <div className="w-12 h-12 rounded-full border-3 border-amber-400 overflow-hidden shadow-lg bg-amber-100 flex items-center justify-center border-[3px]">
                  {parent.photoURL ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={parent.photoURL} alt={parent.displayName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">👶</span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
              </div>
            </AdvancedMarker>
          ))}
        </Map>
      </APIProvider>

      {/* Parent card popup */}
      {selectedParent && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
          <ParentCard
            parent={selectedParent}
            onClose={() => setSelectedParent(null)}
            onRequestWalk={(p) => {
              setSelectedParent(null)
              setRequestParent(p)
            }}
          />
        </div>
      )}

      {/* Walk request modal */}
      {requestParent && (
        <WalkRequestModal
          fromUserId={currentUserId}
          toParent={requestParent}
          onClose={() => setRequestParent(null)}
          onSuccess={() => {
            setRequestParent(null)
            setRequestSuccess(true)
            setTimeout(() => setRequestSuccess(false), 3000)
          }}
        />
      )}

      {/* Success toast */}
      {requestSuccess && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg font-medium text-sm z-20">
          Walk request sent! 🎉
        </div>
      )}
    </div>
  )
}
