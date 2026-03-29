'use client'

import { useState, useEffect } from 'react'
import AuthGuard from '@/components/AuthGuard'
import Navbar from '@/components/Navbar'
import WalkRequestModal from '@/components/WalkRequestModal'
import { useAuth } from '@/hooks/useAuth'
import { useMatches } from '@/hooks/useMatches'
import { useFriends } from '@/hooks/useFriends'
import { useGroups } from '@/hooks/useGroups'
import {
  getUserByUsername,
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  createGroup,
  getUserProfile,
} from '@/lib/firestore'
import { UserProfile, Friendship, Group } from '@/lib/types'
import Image from 'next/image'

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'bg-green-100 text-green-700',
  intermediate: 'bg-amber-100 text-amber-700',
  advanced: 'bg-orange-100 text-orange-700',
  expert: 'bg-red-100 text-red-700',
}

export default function FriendsPage() {
  return (
    <AuthGuard>
      <FriendsContent />
    </AuthGuard>
  )
}

function FriendsContent() {
  const { user } = useAuth()
  const { matches } = useMatches(user?.uid ?? null)
  const { friendships, loading: friendsLoading } = useFriends(user?.uid ?? null)
  const { groups } = useGroups(user?.uid ?? null)

  const pendingCount = matches.filter(
    (m) => m.status === 'pending' && m.initiatedBy !== user?.uid
  ).length
  const pendingFriendRequests = friendships.filter(
    (f) => f.status === 'pending' && f.initiatedBy !== user?.uid
  ).length

  const [tab, setTab] = useState<'friends' | 'requests' | 'groups'>('friends')
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  const handleInvite = () => {
    if (!user) return
    const link = `https://climbsquad.app/join?ref=${user.uid}`
    navigator.clipboard.writeText(link).then(() => {
      showToast('Link copied! Share with climbers 🎉')
    })
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-32">
      <div className="bg-white border-b border-stone-200 px-4 py-4">
        <h1 className="text-3xl font-black tracking-tight text-stone-900">Friends</h1>
      </div>

      <div className="flex bg-white border-b border-stone-200">
        {(['friends', 'requests', 'groups'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium capitalize transition-colors relative ${
              tab === t ? 'text-amber-600 border-b-2 border-amber-500' : 'text-stone-500'
            }`}
          >
            {t}
            {t === 'requests' && pendingFriendRequests > 0 && (
              <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                {pendingFriendRequests}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="max-w-sm mx-auto px-4 py-4">
        {tab === 'friends' && (
          <FriendsTab
            friends={friendships}
            loading={friendsLoading}
            currentUserId={user?.uid ?? ''}
            showToast={showToast}
          />
        )}
        {tab === 'requests' && (
          <RequestsTab
            friends={friendships}
            currentUserId={user?.uid ?? ''}
            showToast={showToast}
          />
        )}
        {tab === 'groups' && (
          <GroupsTab
            groups={groups}
            friends={friendships}
            currentUserId={user?.uid ?? ''}
            showToast={showToast}
          />
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 flex justify-center px-4 z-40">
        <button
          onClick={handleInvite}
          className="bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold px-8 py-3 rounded-full shadow-lg transition-all text-sm"
        >
          Invite Climbers 🔗
        </button>
      </div>

      {toastMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-stone-800 text-white px-4 py-2 rounded-full shadow-lg text-sm z-50">
          {toastMsg}
        </div>
      )}

      <Navbar pendingCount={pendingCount} pendingFriendRequests={pendingFriendRequests} />
    </div>
  )
}

function FriendsTab({
  friends,
  loading,
  currentUserId,
  showToast,
}: {
  friends: Friendship[]
  loading: boolean
  currentUserId: string
  showToast: (msg: string) => void
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResult, setSearchResult] = useState<UserProfile | null | 'not-found'>()
  const [searching, setSearching] = useState(false)
  const [actionDone, setActionDone] = useState<Record<string, boolean>>({})
  const [friendProfiles, setFriendProfiles] = useState<Record<string, UserProfile>>({})
  const [sessionTarget, setSessionTarget] = useState<UserProfile | null>(null)

  const acceptedFriends = friends.filter((f) => f.status === 'accepted')

  useEffect(() => {
    const otherIds = acceptedFriends.map((f) =>
      f.participants.find((p) => p !== currentUserId) ?? ''
    ).filter(Boolean)

    otherIds.forEach((uid) => {
      if (!friendProfiles[uid]) {
        getUserProfile(uid).then((p) => {
          if (p) setFriendProfiles((prev) => ({ ...prev, [uid]: p }))
        })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends, currentUserId])

  const handleSearch = async () => {
    if (!searchQuery.trim()) return
    const q = searchQuery.replace('@', '').trim().toLowerCase()
    setSearching(true)
    setSearchResult(undefined)
    const result = await getUserByUsername(q)
    setSearchResult(result ?? 'not-found')
    setSearching(false)
  }

  const getFriendshipStatus = (uid: string) => {
    const f = friends.find((fr) => fr.participants.includes(uid))
    if (!f) return 'none'
    if (f.status === 'accepted') return 'friends'
    if (f.initiatedBy === currentUserId) return 'sent'
    return 'incoming'
  }

  const handleAddFriend = async (uid: string) => {
    await sendFriendRequest(currentUserId, uid)
    setActionDone((prev) => ({ ...prev, [uid]: true }))
    showToast('Friend request sent!')
  }

  const now = new Date()

  const isAvailableAndNotExpired = (p: UserProfile) => {
    if (!p.isAvailableNow) return false
    if (p.availabilityExpiresAt) {
      return p.availabilityExpiresAt.toDate() > now
    }
    return true
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">@</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by username"
            className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-4 py-2.5 text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-colors"
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={searching}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-colors"
        >
          {searching ? '...' : 'Search'}
        </button>
      </div>

      {searchResult && searchResult !== 'not-found' && (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-100 flex-shrink-0 flex items-center justify-center">
            {searchResult.photoURL ? (
              <Image src={searchResult.photoURL} alt={searchResult.displayName} width={48} height={48} className="object-cover rounded-full" />
            ) : (
              <span className="text-xl">🧗</span>
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold text-stone-800 text-sm">{searchResult.displayName}</p>
            <p className="text-xs text-amber-500">@{searchResult.username}</p>
            {searchResult.climbingLevel && (
              <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full capitalize mt-0.5 ${LEVEL_COLORS[searchResult.climbingLevel]}`}>
                {searchResult.climbingLevel}
              </span>
            )}
          </div>
          {searchResult.uid === currentUserId ? (
            <span className="text-xs text-stone-400">That&apos;s you!</span>
          ) : getFriendshipStatus(searchResult.uid) === 'friends' || actionDone[searchResult.uid] ? (
            <span className="text-xs text-green-600 font-medium">
              {actionDone[searchResult.uid] ? 'Request sent' : 'Already friends'}
            </span>
          ) : getFriendshipStatus(searchResult.uid) === 'sent' ? (
            <span className="text-xs text-stone-500">Request sent</span>
          ) : (
            <button
              onClick={() => handleAddFriend(searchResult.uid)}
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
            >
              Add Friend
            </button>
          )}
        </div>
      )}
      {searchResult === 'not-found' && (
        <p className="text-sm text-stone-500 text-center">No user found with that username.</p>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-stone-100" />
          ))}
        </div>
      ) : acceptedFriends.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-stone-500 text-sm">Search for friends by @username above</p>
        </div>
      ) : (
        <div className="space-y-3">
          {acceptedFriends.map((f) => {
            const otherId = f.participants.find((p) => p !== currentUserId) ?? ''
            const fp = friendProfiles[otherId]
            if (!fp) return null
            const available = isAvailableAndNotExpired(fp)
            return (
              <div
                key={f.friendshipId}
                className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-amber-100 flex-shrink-0 flex items-center justify-center">
                    {fp.photoURL ? (
                      <Image src={fp.photoURL} alt={fp.displayName} width={48} height={48} className="object-cover rounded-full" />
                    ) : (
                      <span className="text-xl">🧗</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-stone-800 text-sm">{fp.displayName}</p>
                    <p className="text-xs text-amber-500">@{fp.username}</p>
                    {fp.climbingLevel && (
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full capitalize ${LEVEL_COLORS[fp.climbingLevel]}`}>
                          {fp.climbingLevel}
                        </span>
                        {fp.disciplines?.slice(0, 2).map((d) => (
                          <span key={d} className="text-xs bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded-full capitalize">
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {available && (
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-green-600 font-semibold">At the wall 🧗</span>
                      <button
                        onClick={() => setSessionTarget(fp)}
                        className="text-xs bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg transition-colors font-bold"
                      >
                        Session?
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {sessionTarget && (
        <WalkRequestModal
          fromUserId={currentUserId}
          toParent={sessionTarget}
          onClose={() => setSessionTarget(null)}
          onSuccess={() => {
            setSessionTarget(null)
            showToast('Session request sent! 🎉')
          }}
        />
      )}
    </div>
  )
}

function RequestsTab({
  friends,
  currentUserId,
  showToast,
}: {
  friends: Friendship[]
  currentUserId: string
  showToast: (msg: string) => void
}) {
  const incoming = friends.filter(
    (f) => f.status === 'pending' && f.initiatedBy !== currentUserId
  )
  const outgoing = friends.filter(
    (f) => f.status === 'pending' && f.initiatedBy === currentUserId
  )
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({})

  useEffect(() => {
    const allIds = [...incoming, ...outgoing].map((f) =>
      f.participants.find((p) => p !== currentUserId) ?? ''
    ).filter(Boolean)
    allIds.forEach((uid) => {
      if (!profiles[uid]) {
        getUserProfile(uid).then((p) => {
          if (p) setProfiles((prev) => ({ ...prev, [uid]: p }))
        })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends, currentUserId])

  const handleAccept = async (friendshipId: string) => {
    await acceptFriendRequest(friendshipId)
    showToast('Friend request accepted!')
  }

  const handleDecline = async (friendshipId: string) => {
    await declineFriendRequest(friendshipId)
  }

  if (incoming.length === 0 && outgoing.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-stone-500 text-sm">No pending requests</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {incoming.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Incoming</p>
          <div className="space-y-3">
            {incoming.map((f) => {
              const otherId = f.participants.find((p) => p !== currentUserId) ?? ''
              const fp = profiles[otherId]
              return (
                <div key={f.friendshipId} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-100 flex-shrink-0 flex items-center justify-center">
                      {fp?.photoURL ? (
                        <Image src={fp.photoURL} alt={fp.displayName} width={40} height={40} className="object-cover rounded-full" />
                      ) : (
                        <span className="text-lg">🧗</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-stone-800 text-sm">{fp?.displayName ?? 'Loading...'}</p>
                      {fp?.username && <p className="text-xs text-amber-500">@{fp.username}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDecline(f.friendshipId)}
                      className="flex-1 border border-stone-200 text-stone-600 py-2 rounded-xl text-sm font-medium hover:bg-stone-50 transition-colors"
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleAccept(f.friendshipId)}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-xl text-sm font-bold transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {outgoing.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Sent</p>
          <div className="space-y-3">
            {outgoing.map((f) => {
              const otherId = f.participants.find((p) => p !== currentUserId) ?? ''
              const fp = profiles[otherId]
              return (
                <div key={f.friendshipId} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4 opacity-70">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-amber-100 flex-shrink-0 flex items-center justify-center">
                      {fp?.photoURL ? (
                        <Image src={fp.photoURL} alt={fp.displayName} width={40} height={40} className="object-cover rounded-full" />
                      ) : (
                        <span className="text-lg">🧗</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-stone-800 text-sm">{fp?.displayName ?? 'Loading...'}</p>
                      {fp?.username && <p className="text-xs text-amber-500">@{fp.username}</p>}
                    </div>
                    <button
                      onClick={() => handleDecline(f.friendshipId)}
                      className="text-xs text-red-400 hover:text-red-600 font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function GroupsTab({
  groups,
  friends,
  currentUserId,
  showToast,
}: {
  groups: Group[]
  friends: Friendship[]
  currentUserId: string
  showToast: (msg: string) => void
}) {
  const [showModal, setShowModal] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [friendProfiles, setFriendProfiles] = useState<Record<string, UserProfile>>({})
  const [groupMemberProfiles, setGroupMemberProfiles] = useState<Record<string, UserProfile>>({})

  const acceptedFriendIds = friends
    .filter((f) => f.status === 'accepted')
    .map((f) => f.participants.find((p) => p !== currentUserId) ?? '')
    .filter(Boolean)

  useEffect(() => {
    acceptedFriendIds.forEach((uid) => {
      if (!friendProfiles[uid]) {
        getUserProfile(uid).then((p) => {
          if (p) setFriendProfiles((prev) => ({ ...prev, [uid]: p }))
        })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends, currentUserId])

  useEffect(() => {
    const allMemberIds = groups.flatMap((g) => g.members).filter((uid) => uid !== currentUserId)
    allMemberIds.forEach((uid) => {
      if (!groupMemberProfiles[uid]) {
        getUserProfile(uid).then((p) => {
          if (p) setGroupMemberProfiles((prev) => ({ ...prev, [uid]: p }))
        })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, currentUserId])

  const toggleMember = (uid: string) => {
    setSelectedMembers((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    )
  }

  const handleCreate = async () => {
    if (!groupName.trim()) return
    setCreating(true)
    try {
      await createGroup(groupName.trim(), currentUserId, [currentUserId, ...selectedMembers])
      setShowModal(false)
      setGroupName('')
      setSelectedMembers([])
      showToast('Climbing crew created!')
    } finally {
      setCreating(false)
    }
  }

  const now = new Date()
  const isAvailable = (p: UserProfile) => {
    if (!p.isAvailableNow) return false
    if (p.availabilityExpiresAt) return p.availabilityExpiresAt.toDate() > now
    return true
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold py-3 rounded-2xl transition-all text-sm shadow-md"
      >
        New Climbing Crew +
      </button>

      {groups.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-stone-500 text-sm">No crews yet. Create one above!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((g) => {
            const memberProfiles = g.members
              .filter((uid) => uid !== currentUserId)
              .map((uid) => groupMemberProfiles[uid])
              .filter(Boolean) as UserProfile[]
            const atWallCount = memberProfiles.filter(isAvailable).length
            const avatarProfiles = memberProfiles.slice(0, 3)

            return (
              <div key={g.groupId} className="bg-white rounded-2xl border border-stone-100 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {avatarProfiles.map((p) => (
                      <div
                        key={p.uid}
                        className="w-9 h-9 rounded-full overflow-hidden border-2 border-white bg-amber-100 flex items-center justify-center"
                      >
                        {p.photoURL ? (
                          <Image src={p.photoURL} alt={p.displayName} width={36} height={36} className="object-cover rounded-full" />
                        ) : (
                          <span className="text-sm">🧗</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-stone-800 text-sm">{g.name}</p>
                    <p className="text-xs text-stone-500">{g.members.length} members</p>
                  </div>
                  {atWallCount > 0 && (
                    <span className="text-xs text-green-600 font-semibold">{atWallCount} at the wall 🧗</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tight text-stone-800">New Climbing Crew</h2>
                <button onClick={() => setShowModal(false)} className="text-stone-400 hover:text-stone-600 text-2xl">×</button>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Crew Name</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Thursday Crushers"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white transition-colors text-sm"
                />
              </div>
              {acceptedFriendIds.length > 0 && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Add Friends</label>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {acceptedFriendIds.map((uid) => {
                      const fp = friendProfiles[uid]
                      return (
                        <label key={uid} className="flex items-center gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedMembers.includes(uid)}
                            onChange={() => toggleMember(uid)}
                            className="w-4 h-4 accent-amber-500"
                          />
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-amber-100 flex items-center justify-center">
                            {fp?.photoURL ? (
                              <Image src={fp.photoURL} alt={fp.displayName} width={32} height={32} className="object-cover rounded-full" />
                            ) : (
                              <span className="text-sm">🧗</span>
                            )}
                          </div>
                          <span className="text-sm text-stone-800">{fp?.displayName ?? uid}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )}
              <button
                onClick={handleCreate}
                disabled={!groupName.trim() || creating}
                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all"
              >
                {creating ? 'Creating...' : 'Create Crew'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
