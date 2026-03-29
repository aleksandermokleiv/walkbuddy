'use client'

import { useState } from 'react'
import { APIProvider, Map, AdvancedMarker } from '@vis.gl/react-google-maps'
import { UserProfile } from '@/lib/types'
import { Gym } from '@/lib/gyms'
import ParentCard from './ParentCard'
import WalkRequestModal from './WalkRequestModal'

const MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#f5f0eb' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6b6560' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f0eb' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e8e0d8' }] },
  { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#ddd5c8' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#d4c9b8' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9d8e8' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d8e8d0' }] },
  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#d0c8c0' }] },
]

const LEVEL_DOT_COLORS: Record<string, string> = {
  beginner: 'bg-green-400',
  intermediate: 'bg-amber-400',
  advanced: 'bg-orange-500',
  expert: 'bg-red-500',
}

interface MapViewProps {
  center: { lat: number; lng: number }
  parents: UserProfile[]
  currentUserId: string
  profileLoaded?: boolean
  gyms?: Gym[]
}

export default function MapView({ center, parents, currentUserId, gyms = [] }: MapViewProps) {
  const [selectedParent, setSelectedParent] = useState<UserProfile | null>(null)
  const [requestParent, setRequestParent] = useState<UserProfile | null>(null)
  const [requestSuccess, setRequestSuccess] = useState(false)
  const [selectedGym, setSelectedGym] = useState<Gym | null>(null)

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ''

  return (
    <div className="relative w-full h-full">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={center}
          defaultZoom={14}
          mapId="climbsquad-map"
          gestureHandling="greedy"
          disableDefaultUI={true}
          className="w-full h-full"
          styles={MAP_STYLE}
        >
          {/* Current user marker */}
          <AdvancedMarker position={center}>
            <div className="bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg border-2 border-white">
              You
            </div>
          </AdvancedMarker>

          {/* Gym markers */}
          {gyms.map((gym) => (
            <AdvancedMarker
              key={gym.id}
              position={{ lat: gym.lat, lng: gym.lng }}
              onClick={() => setSelectedGym(gym)}
            >
              <div className="bg-amber-500 text-white rounded-xl px-2.5 py-1.5 shadow-lg flex items-center gap-1.5 border-2 border-amber-300 cursor-pointer hover:scale-105 transition-transform">
                <span className="text-sm">🧗</span>
                <span className="text-xs font-bold">{gym.name.split(' ')[0]}</span>
              </div>
            </AdvancedMarker>
          ))}

          {/* Nearby climbers */}
          {parents.map((parent) => {
            const dotColor = LEVEL_DOT_COLORS[parent.climbingLevel] ?? 'bg-amber-400'
            return (
              <AdvancedMarker
                key={parent.uid}
                position={parent.location}
                onClick={() => setSelectedParent(parent)}
              >
                <div className="relative cursor-pointer hover:scale-110 transition-transform">
                  <div className="w-12 h-12 rounded-full border-[3px] border-amber-400 overflow-hidden shadow-lg bg-amber-100 flex items-center justify-center">
                    {parent.photoURL ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={parent.photoURL} alt={parent.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">🧗</span>
                    )}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 ${dotColor} rounded-full border-2 border-white`} />
                </div>
              </AdvancedMarker>
            )
          })}
        </Map>
      </APIProvider>

      {/* Gym popup card */}
      {selectedGym && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 bg-white rounded-2xl shadow-xl p-4 w-72">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="font-bold text-stone-800">{selectedGym.name}</h3>
              <p className="text-xs text-stone-500">{selectedGym.address}</p>
            </div>
            <button onClick={() => setSelectedGym(null)} className="text-stone-400 text-xl">×</button>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {selectedGym.disciplines.map((d) => (
              <span key={d} className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full capitalize">{d}</span>
            ))}
          </div>
          {selectedGym.website && (
            <a
              href={selectedGym.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-600 font-semibold hover:underline"
            >
              Visit website →
            </a>
          )}
        </div>
      )}

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

      {/* Session request modal */}
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
          Session request sent! 🧗
        </div>
      )}
    </div>
  )
}
