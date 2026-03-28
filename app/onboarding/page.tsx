'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { updateUserProfile, getUserByUsername } from '@/lib/firestore'
import { storage } from '@/lib/firebase'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import Image from 'next/image'

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
  const [babyName, setBabyName] = useState('')
  const [babyAgeMonths, setBabyAgeMonths] = useState(0)
  const [bio, setBio] = useState('')
  const [neighborhood, setNeighborhood] = useState('')
  const [locationLoading, setLocationLoading] = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Pre-fill from Google sign-in
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

  const handleStep1Next = async () => {
    if (!babyName || !username) return
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
        setLocation({ lat: 40.7128, lng: -74.006 })
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
          babyName,
          babyAgeMonths,
          bio,
          neighborhood,
          photoURL,
          location: location ?? { lat: 40.7128, lng: -74.006 },
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
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50 px-6 py-8">
      <div className="max-w-sm mx-auto">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">✨</div>
          <h1 className="text-2xl font-bold text-amber-700">Set up your profile</h1>
          <p className="text-gray-500 text-sm mt-1">Step {step} of 3</p>
          <div className="flex gap-2 mt-3 justify-center">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-1.5 w-12 rounded-full transition-colors ${
                  s <= step ? 'bg-amber-400' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-amber-100 p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">About your little one</h2>

              {/* Display name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Jane Smith"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800"
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
                    placeholder="janesmom"
                    className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800"
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
                <p className="text-xs text-gray-400 mt-1">Lowercase letters, numbers, underscores only</p>
              </div>

              {/* Baby name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Baby&apos;s Name</label>
                <input
                  type="text"
                  value={babyName}
                  onChange={(e) => setBabyName(e.target.value)}
                  placeholder="Emma"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800"
                />
              </div>

              {/* Baby age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Baby&apos;s Age</label>
                <select
                  value={babyAgeMonths}
                  onChange={(e) => setBabyAgeMonths(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800"
                >
                  {Array.from({ length: 25 }, (_, i) => (
                    <option key={i} value={i}>
                      {i === 0 ? 'Newborn' : `${i} month${i !== 1 ? 's' : ''}`}
                    </option>
                  ))}
                </select>
              </div>

              {error && (
                <p className="text-red-500 text-sm bg-red-50 rounded-lg p-2">{error}</p>
              )}

              <button
                onClick={handleStep1Next}
                disabled={!babyName || !username || usernameStatus === 'checking' || usernameStatus === 'taken'}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
              >
                Next →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">About you</h2>
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex flex-col items-center gap-2 border-2 border-dashed border-amber-200 rounded-2xl p-6 hover:bg-amber-50 transition-colors"
                >
                  {photoPreview ? (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden">
                      <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                    </div>
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center text-3xl">
                      📷
                    </div>
                  )}
                  <span className="text-sm text-amber-600 font-medium">
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Neighborhood</label>
                <input
                  type="text"
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="e.g. Brooklyn Heights"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Short Bio <span className="text-gray-400">({bio.length}/150)</span>
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => {
                    if (e.target.value.length <= 150) setBio(e.target.value)
                  }}
                  placeholder="Hi! First-time mom to Emma, love morning walks..."
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-gray-800 resize-none"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800">Enable location</h2>
              <p className="text-sm text-gray-500">
                WalkBuddy uses your location to show you nearby walking companions. Your exact location is never shared — only your neighborhood.
              </p>
              {location ? (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-xl p-3">
                  <span>✓</span>
                  <span className="text-sm font-medium">Location enabled!</span>
                </div>
              ) : (
                <button
                  onClick={requestLocation}
                  disabled={locationLoading}
                  className="w-full flex items-center justify-center gap-2 border-2 border-amber-200 rounded-xl py-3 text-amber-600 font-semibold hover:bg-amber-50 transition-colors"
                >
                  {locationLoading ? '...' : '📍 Share My Location'}
                </button>
              )}
              {error && (
                <p className="text-orange-600 text-sm bg-orange-50 rounded-lg p-2">{error}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl transition-colors"
                >
                  ← Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
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
