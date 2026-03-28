'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { getUserProfile, updateUserProfile, getUserByUsername } from '@/lib/firestore'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { UserProfile } from '@/lib/types'
import Image from 'next/image'

export default function EditProfilePage() {
  return (
    <AuthGuard>
      <EditProfileContent />
    </AuthGuard>
  )
}

function EditProfileContent() {
  const { user } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'taken' | 'available' | 'unchanged'>('idle')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [babyName, setBabyName] = useState('')
  const [babyAgeMonths, setBabyAgeMonths] = useState(0)
  const [bio, setBio] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!user) return
    getUserProfile(user.uid).then((p) => {
      if (!p) return
      setProfile(p)
      setDisplayName(p.displayName)
      setUsername(p.username ?? '')
      setPhotoPreview(p.photoURL ?? '')
      setBabyName(p.babyName)
      setBabyAgeMonths(p.babyAgeMonths)
      setBio(p.bio ?? '')
      setNeighborhood(p.neighborhood ?? '')
    })
  }, [user])

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const validateUsername = (value: string) => /^[a-z0-9_]+$/.test(value)

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(value)
    setUsernameStatus(value === profile?.username ? 'unchanged' : 'idle')
  }

  const handleUsernameBlur = async () => {
    if (!username || username === profile?.username) {
      setUsernameStatus('unchanged')
      return
    }
    if (!validateUsername(username)) return
    setUsernameStatus('checking')
    const existing = await getUserByUsername(username)
    setUsernameStatus(existing ? 'taken' : 'available')
  }

  const handleSave = async () => {
    if (!user || !profile) return
    if (username !== profile.username) {
      if (!validateUsername(username)) {
        setError('Username can only contain lowercase letters, numbers, and underscores.')
        return
      }
      if (usernameStatus === 'taken') {
        setError('That username is already taken.')
        return
      }
      if (usernameStatus !== 'available' && usernameStatus !== 'unchanged') {
        // Re-check
        setUsernameStatus('checking')
        const existing = await getUserByUsername(username)
        if (existing) {
          setUsernameStatus('taken')
          setError('That username is already taken.')
          return
        }
        setUsernameStatus('available')
      }
    }

    setSaving(true)
    setError('')
    try {
      let photoURL = profile.photoURL ?? ''
      if (photoFile) {
        const storageRef = ref(storage, `avatars/${user.uid}`)
        await uploadBytes(storageRef, photoFile)
        photoURL = await getDownloadURL(storageRef)
      }
      await updateUserProfile(user.uid, {
        displayName,
        username,
        babyName,
        babyAgeMonths,
        bio,
        neighborhood,
        photoURL,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Could not save: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-amber-50">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-amber-50 pb-8">
      <div className="bg-white border-b border-amber-100 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="text-gray-500 hover:text-gray-700">
          ← Back
        </button>
        <h1 className="text-xl font-bold text-gray-800">Edit Profile</h1>
      </div>

      <div className="max-w-sm mx-auto px-4 py-6 space-y-5">
        {/* Photo */}
        <div className="flex flex-col items-center">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-amber-300 bg-amber-100 flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            {photoPreview ? (
              <Image src={photoPreview} alt="Profile photo" fill className="object-cover" />
            ) : (
              <span className="text-4xl">👶</span>
            )}
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-2 text-sm text-amber-600 font-medium hover:text-amber-700"
          >
            Change photo
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-5 space-y-4">
          {/* Display name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800 text-sm"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                onBlur={handleUsernameBlur}
                className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800 text-sm"
              />
            </div>
            {usernameStatus === 'checking' && (
              <p className="text-xs text-gray-400 mt-1">Checking...</p>
            )}
            {usernameStatus === 'taken' && (
              <p className="text-xs text-red-500 mt-1">Username taken</p>
            )}
            {usernameStatus === 'available' && (
              <p className="text-xs text-green-600 mt-1">✓ Available!</p>
            )}
          </div>

          {/* Baby name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Baby&apos;s Name</label>
            <input
              type="text"
              value={babyName}
              onChange={(e) => setBabyName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800 text-sm"
            />
          </div>

          {/* Baby age */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Baby&apos;s Age</label>
            <select
              value={babyAgeMonths}
              onChange={(e) => setBabyAgeMonths(Number(e.target.value))}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800 text-sm"
            >
              {Array.from({ length: 25 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 0 ? 'Newborn' : `${i} month${i !== 1 ? 's' : ''}`}
                </option>
              ))}
            </select>
          </div>

          {/* Neighborhood */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="e.g. Brooklyn Heights"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800 text-sm"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bio <span className="text-gray-400">({bio.length}/150)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= 150) setBio(e.target.value)
              }}
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800 resize-none text-sm"
            />
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-sm bg-red-50 rounded-xl p-3">{error}</p>
        )}
        {saved && (
          <p className="text-green-600 text-sm bg-green-50 rounded-xl p-3 text-center font-medium">
            ✓ Profile saved!
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || usernameStatus === 'taken'}
            className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
