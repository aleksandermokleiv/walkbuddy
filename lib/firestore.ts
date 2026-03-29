import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  orderBy,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import { UserProfile, Match, Message, Friendship, Group } from './types'

export const createUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  await setDoc(doc(db, 'users', uid), {
    ...data,
    createdAt: serverTimestamp(),
  })
}

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? (snap.data() as UserProfile) : null
}

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  await setDoc(doc(db, 'users', uid), data, { merge: true })
}

export const getAvailableParents = async (): Promise<UserProfile[]> => {
  const q = query(collection(db, 'users'), where('isAvailableNow', '==', true))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as UserProfile)
}

export const updateUserGymCheckIn = async (uid: string, gymId: string | null): Promise<void> => {
  await setDoc(doc(db, 'users', uid), { currentGymId: gymId }, { merge: true })
}

export const getUserByUsername = async (username: string): Promise<UserProfile | null> => {
  const q = query(collection(db, 'users'), where('username', '==', username))
  const snap = await getDocs(q)
  if (snap.empty) return null
  return snap.docs[0].data() as UserProfile
}

export const createMatch = async (matchData: Omit<Match, 'matchId' | 'createdAt'>) => {
  const ref = await addDoc(collection(db, 'matches'), {
    ...matchData,
    createdAt: serverTimestamp(),
  })
  await updateDoc(ref, { matchId: ref.id })
  return ref.id
}

export const getMatchesForUser = async (userId: string): Promise<Match[]> => {
  const q = query(collection(db, 'matches'), where('participants', 'array-contains', userId))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Match)
}

export const updateMatchStatus = async (matchId: string, status: Match['status']) => {
  await updateDoc(doc(db, 'matches', matchId), { status })
}

export const sendMessage = async (matchId: string, senderId: string, text: string) => {
  await addDoc(collection(db, 'messages', matchId, 'messages'), {
    senderId,
    text,
    createdAt: serverTimestamp(),
  })
}

export const subscribeToMessages = (
  matchId: string,
  callback: (messages: Message[]) => void
) => {
  const q = query(
    collection(db, 'messages', matchId, 'messages'),
    orderBy('createdAt', 'asc')
  )
  return onSnapshot(q, (snap) => {
    const msgs = snap.docs.map((d) => ({ messageId: d.id, ...d.data() } as Message))
    callback(msgs)
  })
}

export const subscribeToMatches = (userId: string, callback: (matches: Match[]) => void) => {
  const q = query(collection(db, 'matches'), where('participants', 'array-contains', userId))
  return onSnapshot(q, (snap) => {
    const matches = snap.docs.map((d) => d.data() as Match)
    callback(matches)
  })
}

// ---- Friendships ----

export const sendFriendRequest = async (fromUid: string, toUid: string): Promise<void> => {
  const ref = await addDoc(collection(db, 'friendships'), {
    participants: [fromUid, toUid],
    status: 'pending',
    initiatedBy: fromUid,
    createdAt: serverTimestamp(),
  })
  await updateDoc(ref, { friendshipId: ref.id })
}

export const acceptFriendRequest = async (friendshipId: string): Promise<void> => {
  await updateDoc(doc(db, 'friendships', friendshipId), { status: 'accepted' })
}

export const declineFriendRequest = async (friendshipId: string): Promise<void> => {
  await deleteDoc(doc(db, 'friendships', friendshipId))
}

export const getFriendships = async (uid: string): Promise<Friendship[]> => {
  const q = query(collection(db, 'friendships'), where('participants', 'array-contains', uid))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Friendship)
}

export const subscribeToFriendships = (
  uid: string,
  callback: (friendships: Friendship[]) => void
): Unsubscribe => {
  const q = query(collection(db, 'friendships'), where('participants', 'array-contains', uid))
  return onSnapshot(q, (snap) => {
    const friendships = snap.docs.map((d) => d.data() as Friendship)
    callback(friendships)
  })
}

// ---- Groups ----

export const createGroup = async (
  name: string,
  createdBy: string,
  members: string[]
): Promise<string> => {
  const ref = await addDoc(collection(db, 'groups'), {
    name,
    createdBy,
    members,
    createdAt: serverTimestamp(),
  })
  await updateDoc(ref, { groupId: ref.id })
  return ref.id
}

export const getGroupsForUser = async (uid: string): Promise<Group[]> => {
  const q = query(collection(db, 'groups'), where('members', 'array-contains', uid))
  const snap = await getDocs(q)
  return snap.docs.map((d) => d.data() as Group)
}

export const subscribeToGroups = (
  uid: string,
  callback: (groups: Group[]) => void
): Unsubscribe => {
  const q = query(collection(db, 'groups'), where('members', 'array-contains', uid))
  return onSnapshot(q, (snap) => {
    const groups = snap.docs.map((d) => d.data() as Group)
    callback(groups)
  })
}

export const addMemberToGroup = async (groupId: string, uid: string): Promise<void> => {
  const ref = doc(db, 'groups', groupId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const data = snap.data() as Group
  if (!data.members.includes(uid)) {
    await updateDoc(ref, { members: [...data.members, uid] })
  }
}
