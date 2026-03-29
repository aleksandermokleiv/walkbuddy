'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { updateUserProfile, getUserByUsername } from '@/lib/firestore'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import Image from 'next/image'

type ClimbingLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert'

const CLIMBING_LEVELS: { value: ClimbingLevel; label: string; emoji: string; desc: string }[] = [
  { value: 'beginner', label: 'Beginner', emoji: '🌱', desc: 'Just starting out, learning the basics' },
  { value: 'intermediate', label: 'Intermediate', emoji: '⚡', desc: 'Comfortable on 6a–6c / V3–V5' },
  { value: 'advanced', label: 'Advanced', emoji: '🔥', desc: 'Pushing 7a+ / V7+' },
  { value: 'expert', label: 'Expert', emoji: '💎', desc: 'Elite level climber' },
]

const DISCIPLINE_OPTIONS: { value: string; label: string; emoji: string }[] = [
  { value: 'sport', label: 'Sport', emoji: '🏔️' },
  { value: 'bouldering', label: 'Bouldering', emoji: '🪨' },
  { value: 'trad', label: 'Trad', emoji: '🪛' },
  { value: 'top-rope', label: 'Top-rope', emoji: '🔗' },
  { value: 'multi-pitch', label: 'Multi-pitch', emoji: '⛰️' },
  { value: 'ice', label: 'Ice', emoji: '🧊' },
]

export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState(1)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle')
  const [climbingLevel, setClimbingLevel] = useState<ClimbingLevel>('beginner')
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [homeGym, setHomeGym] = useState('')
  const [bio, setBio] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (user) {
      if (user.displayName) setDisplayName(user.displayName)
      if (user.photoURL) setPhotoPreview(user.photoURL)
    }
  }, [user])

  if (loading) return null

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const url = URL.createObjectURL(file)
    setPhotoPreview(url)
  }

  const validateUsername = (value: string) => {
    return /^[a-z0-9_]+$/.test(value)
  }

  const checkUsername = async (value: string) => {
    if (!value || !validateUsername(value)) return
    setUsernameStatus('checking')
    const existing = await getUserByUsername(value)
    setUsernameStatus(existing ? 'taken' : 'available')
  }

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')
    setUsername(value)
    setUsernameStatus('idle')
  }

  const handleUsernameBlur = () => {
    if (username.length >= 3) checkUsername(username)
  }

  const toggleDiscipline = (value: string) => {
    setDisciplines((prev) =>
      prev.includes(value) ? prev.filter((d) => d !== value) : [...prev, value]
    )
  }

  const handleStep1Next = async () => {
    if (!username || disciplines.length === 0) {
      setError('Please pick a username and at least one discipline.')
      return
    }
    if (!validateUsername(username)) {
      setError('Username can only contain lowercase letters, numbers, and underscores.')
      return
    }
    if (usernameStatus !== 'available') {
      setUsernameStatus('checking')
      const existing = await getUserByUsername(username)
      if (existing) {
        setUsernameStatus('taken')
        return
      }
      setUsernameStatus('available')
    }
    setError('')
    setStep(2)
  }

  const requestLocation = () => {
    setLocationLoading(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocationLoading(false)
      },
      () => {
        setError('Could not get location. You can update it later in settings.')
        setLocation({ lat: 59.9139, lng: 10.7522 })
        setLocationLoading(false)
      }
    )
  }

  const handleFinish = async () => {
    if (!user) return
    setSaving(true)
    setError('')
    try {
      let photoURL = user.photoURL ?? ''
      if (photoFile) {
        const storageRef = ref(storage, `avatars/${user.uid}`)
        await uploadBytes(storageRef, photoFile)
        photoURL = await getDownloadURL(storageRef)
      }
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Timed out — is Firestore Database enabled in your Firebase Console?')), 10000)
      )
      await Promise.race([
        updateUserProfile(user.uid, {
          displayName: displayName || user.displayName || '',
          username,
          climbingLevel,
          disciplines,
          homeGym,
          bio,
          photoURL,
          location: location ?? { lat: 59.9139, lng: 10.7522 },
        }),
        timeout,
      ])
      router.push('/dashboard')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Could not save profile: ${msg}`)
    } finally {
      setSaving(false)
    }
  }

  const hasGooglePhoto = !!(user?.photoURL) && !photoFile

  return (
    <main className="min-h-screen bg-gradient-to-b from-stone-900 via-stone-800 to-amber-900 px-6 py-8">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🧗</div>
          <h1 className="text-2xl font-black tracking-tight text-white">Set up your profile</h1>
          <p className="text-stone-400 text-sm mt-1">Step {step} of 3</p>
          <div className="flex gap-2 mt-3 justify-center">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-12 rounded-full transition-colors ${
                  s <= step ? 'bg-amber-400' : 'bg-stone-600'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-stone-800/80 backdrop-blur border border-stone-700 rounded-3xl p-6">
          {step === 1 && (
            <div className="space-y-5">
              <h2 className="text-lg font-bold text-white">Your climbing profile</h2>

              {/* Display name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Your Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Alex"
                  className="w-full bg-stone-700/50 border border-stone-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-white placeholder-stone-500 transition-colors"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-medium">@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    onBlur={handleUsernameBlur}
                    placeholder="alexclimbs"
                    className="w-full bg-stone-700/50 border border-stone-600 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-white placeholder-stone-500 transition-colors"
                  />
                </div>
                {usernameStatus === 'checking' && (
                  <p className="text-xs text-stone-400 mt-1">Checking...</p>
                )}
                {usernameStatus === 'taken' && (
                  <p className="text-xs text-red-400 mt-1">Username taken</p>
                )}
                {usernameStatus === 'available' && (
                  <p className="text-xs text-green-400 mt-1">✓ Available!</p>
                )}
                <p className="text-xs text-stone-500 mt-1">Lowercase letters, numbers, underscores only</p>
              </div>

              {/* Climbing Level */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Climbing Level</label>
                <div className="grid grid-cols-2 gap-2">
                  {CLIMBING_LEVELS.map((lvl) => (
                    <button
                      key={lvl.value}
                      type="button"
                      onClick={() => setClimbingLevel(lvl.value)}
                      className={`flex flex-col items-start p-3 rounded-xl border-2 transition-all text-left ${
                        climbingLevel === lvl.value
                          ? 'border-amber-400 bg-amber-500/20'
                          : 'border-stone-600 bg-stone-700/50 hover:border-stone-500'
                      }`}
                    >
                      <span className="text-xl mb-1">{lvl.emoji}</span>
                      <span className={`text-sm font-bold ${climbingLevel === lvl.value ? 'text-amber-300' : 'text-white'}`}>
                        {lvl.label}
                      </span>
                      <span className="text-xs text-stone-400 leading-tight mt-0.5">{lvl.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Disciplines */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-2">Disciplines</label>
                <div className="flex flex-wrap gap-2">
                  {DISCIPLINE_OPTIONS.map((d) => (
                    <button
                      key={d.value}
                      type="button"
                      onClick={() => toggleDiscipline(d.value)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border-2 text-sm font-semibold transition-all ${
                        disciplines.includes(d.value)
                          ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                          : 'border-stone-600 bg-stone-700/50 text-stone-300 hover:border-stone-500'
                      }`}
                    >
                      <span>{d.emoji}</span>
                      <span>{d.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-red-400 text-sm bg-red-900/50 rounded-lg p-2">{error}</p>
              )}

              <button
                onClick={handleStep1Next}
                disabled={!username || disciplines.length === 0 || usernameStatus === 'checking' || usernameStatus === 'taken'}
                className="w-full bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all"
              >
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">About you</h2>
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-stone-600 rounded-2xl p-6 hover:bg-stone-700/50 transition-colors"
                >
                  {photoPreview ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden">
                      <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-stone-700 flex items-center justify-center text-3xl">
                      📷
                    </div>
                  )}
                  <span className="text-sm text-amber-400 font-medium">
                    {hasGooglePhoto
                      ? 'Your Google photo is being used — tap to change'
                      : photoPreview
                      ? 'Change photo'
                      : 'Add profile photo'}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">Your home gym or local crag</label>
                <input
                  type="text"
                  value={homeGym}
                  onChange={(e) => setHomeGym(e.target.value)}
                  placeholder="e.g. Klatreverket Nydalen"
                  className="w-full bg-stone-700/50 border border-stone-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-white placeholder-stone-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-stone-400 mb-1">
                  Short Bio <span className="text-stone-500 normal-case font-normal">({bio.length}/150)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 150) setBio(e.target.value)
                  }}
                  placeholder="Hey! I'm into sport climbing and bouldering, looking for partners to push grades together..."
                  rows={3}
                  className="w-full bg-stone-700/50 border border-stone-600 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-white placeholder-stone-500 resize-none transition-colors"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 font-semibold py-3 rounded-xl transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-bold py-3 rounded-2xl transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-white">Enable location</h2>
              <p className="text-sm text-stone-400">
                Climb Squad uses your location to show you nearby climbers. Your exact location is never shared publicly.
              </p>
              {location ? (
                <div className="flex items-center gap-2 bg-green-900/50 text-green-400 rounded-xl p-3">
                  <span>✓</span>
                  <span className="text-sm font-medium">Location enabled!</span>
                </div>
              ) : (
                <button
                  onClick={requestLocation}
                  disabled={locationLoading}
                  className="w-full flex items-center justify-center gap-2 border-2 border-amber-500/50 rounded-xl py-3 text-amber-400 font-semibold hover:bg-amber-500/10 transition-colors"
                >
                  {locationLoading ? '...' : '📍 Share My Location'}
                </button>
              )}
              {error && (
                <p className="text-orange-400 text-sm bg-orange-900/50 rounded-lg p-2">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-stone-700 hover:bg-stone-600 text-stone-200 font-semibold py-3 rounded-xl transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 active:scale-95 disabled:opacity-50 text-white font-bold py-3 rounded-2xl transition-all"
                >
                  {saving ? 'Saving...' : 'Finish 🎉'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
