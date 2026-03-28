import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  User,
} from 'firebase/auth'
import { auth } from './firebase'

export const signUp = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password)

export const signIn = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password)

export const signInWithGoogle = () =>
  signInWithPopup(auth, new GoogleAuthProvider())

export const signOut = () => firebaseSignOut(auth)

export const onAuthChange = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback)
