'use client'

import { useState, useEffect } from 'react'
import { UserProfile } from '@/lib/types'
import { getAvailableParents } from '@/lib/firestore'

function haversineDistance(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function useNearbyParents(
  userLocation: { lat: number; lng: number } | null,
  currentUserId: string | null,
  radiusKm = 5,
  minAgeMonths = 0,
  maxAgeMonths = 24
) {
  const [parents, setParents] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userLocation) return
    const now = new Date()
    getAvailableParents().then((all) => {
      const nearby = all.filter((p) => {
        if (p.uid === currentUserId) return false
        if (!p.location) return false
        // Filter out expired availability
        if (p.availabilityExpiresAt) {
          const expiresAt = p.availabilityExpiresAt.toDate()
          if (expiresAt < now) return false
        }
        // Age filter
        if (p.babyAgeMonths < minAgeMonths || p.babyAgeMonths > maxAgeMonths) return false
        const dist = haversineDistance(
          userLocation.lat, userLocation.lng,
          p.location.lat, p.location.lng
        )
        return dist <= radiusKm
      })
      setParents(nearby)
      setLoading(false)
    })
  }, [userLocation, currentUserId, radiusKm, minAgeMonths, maxAgeMonths])

  return { parents, loading }
}
