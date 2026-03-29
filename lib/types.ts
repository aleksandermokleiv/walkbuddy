import { Timestamp } from 'firebase/firestore'

export interface UserProfile {
  uid: string
  displayName: string
  email: string
  photoURL: string
  climbingLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  disciplines: string[]
  homeGym: string
  currentGymId?: string
  bio: string
  location: { lat: number; lng: number }
  isAvailableNow: boolean
  createdAt: Timestamp
  username: string
  availabilityExpiresAt?: Timestamp
}

export interface Match {
  matchId: string
  participants: [string, string]
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  proposedTime: Timestamp
  proposedLocation: { lat: number; lng: number; name: string }
  createdAt: Timestamp
  initiatedBy: string
  sessionType: 'gym' | 'outdoor' | 'bouldering' | 'multi-pitch'
}

export interface Message {
  messageId: string
  senderId: string
  text: string
  createdAt: Timestamp
}

export interface Friendship {
  friendshipId: string
  participants: [string, string]
  status: 'pending' | 'accepted'
  createdAt: Timestamp
  initiatedBy: string
}

export interface Group {
  groupId: string
  name: string
  members: string[]
  createdBy: string
  createdAt: Timestamp
}
