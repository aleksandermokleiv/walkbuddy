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

type ClimbingLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

const CLIMBING_LEVELS: { value: ClimbingLevel; label: string; emoji: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', emoji: '🌱', desc: 'Just starting out' },
  { value: 'intermediate', label: 'Intermediate', emoji: '⚡', desc: '6a–6c / V3–V5' },
  { value: 'advanced', label: 'Advanced', emoji: '🔥', desc: '7a+ / V7+' },
  { value: 'expert', label: 'Expert', emoji: '💎', desc: 'Elite level' },
]

const DISCIPLINE_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'sport', label: 'Sport', emoji: '🏔️' },
  { value: 'bouldering', label: 'Bouldering', emoji: '🪨' },
  { value: 'trad', label: 'Trad', emoji: '🪛' },
  { value: 'top-rope', label: 'Top-rope', emoji: '🔗' },
  { value: 'multi-pitch', label: 'Multi-pitch', emoji: '⛰️' },
  { value: 'ice', label: 'Ice', emoji: '🧊' },
]

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
  const [climbingLevel, setClimbingLevel] = useState<ClimbingLevel>('beginner')
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [homeGym, setHomeGym] = useState('')
  const [bio, setBio] = useState('')
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
      setClimbingLevel(p.climbingLevel ?? 'beginner')
      setDisciplines(p.disciplines ?? [])
      setHomeGym(p.homeGym ?? '')
      setBio(p.bio ?? '')
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

  const toggleDiscipline = (value: string) => {
    setDisciplines((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    )
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
        climbingLevel,
        disciplines,
        homeGym,
        bio,
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
      <div className="flex items-center justify-center min-h-screen bg-stone-50">
        <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-50 pb-8">
      <div className="bg-white border-b border-stone-200 px-4 py-4 flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')} className="text-stone-500 hover:text-stone-700">
          ← Back
        </button>
        <h1 className="text-xl font-black tracking-tight text-stone-900">Edit Profile</h1>
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
              <span className="text-4xl">🧗</span>
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

        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-5 space-y-4">
          {/* Display name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Display Name</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-stone-800 text-sm transition-colors"
            />
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">@</span>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                onBlur={handleUsernameBlur}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-stone-800 text-sm transition-colors"
              />
            </div>
            {usernameStatus === 'checking' && (
              <p className="text-xs text-stone-400 mt-1">Checking...</p>
            )}
            {usernameStatus === 'taken' && (
              <p className="text-xs text-red-500 mt-1">Username taken</p>
            )}
            {usernameStatus === 'available' && (
              <p className="text-xs text-green-600 mt-1">✓ Available!</p>
            )}
          </div>

          {/* Climbing Level */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Climbing Level</label>
            <div className="grid grid-cols-2 gap-2">
              {CLIMBING_LEVELS.map((lvl) => (
                <button
                  key={lvl.value}
                  type="button"
                  onClick={() => setClimbingLevel(lvl.value)}
                  className={`flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left ${
                    climbingLevel === lvl.value
                      ? 'border-amber-400 bg-amber-50'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <span className="text-lg mb-0.5">{lvl.emoji}</span>
                  <span className={`text-sm font-bold ${climbingLevel === lvl.value ? 'text-amber-700' : 'text-stone-700'}`}>
                    {lvl.label}
                  </span>
                  <span className="text-xs text-stone-500 leading-tight">{lvl.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Disciplines */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-2">Disciplines</label>
            <div className="flex flex-wrap gap-2">
              {DISCIPLINE_OPTIONS.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDiscipline(d.value)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                    disciplines.includes(d.value)
                      ? 'border-amber-400 bg-amber-50 text-amber-700'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <span>{d.emoji}</span>
                  <span>{d.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Home gym */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">Home gym or local crag</label>
            <input
              type="text"
              value={homeGym}
              onChange={(e) => setHomeGym(e.target.value)}
              placeholder="e.g. Klatreverket Nydalen"
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-stone-800 text-sm transition-colors"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-stone-500 mb-1">
              Bio <span className="text-stone-400 normal-case font-normal">({bio.length}/150)</span>
            </label>
            <textarea
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= 150) setBio(e.target.value)
              }}
              rows={3}
              placeholder="Hey! I'm into sport climbing and bouldering, looking for partners to push grades together..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:bg-white text-stone-800 resize-none text-sm transition-colors"
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
            className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold py-3 rounded-xl transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || usernameStatus === 'taken'}
            className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all text-sm shadow-md"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
