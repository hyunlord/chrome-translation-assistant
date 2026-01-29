// Firebase Authentication
import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'
import { getAuthInstance } from './config'

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<User> {
  const auth = getAuthInstance()
  const provider = new GoogleAuthProvider()

  try {
    const result = await signInWithPopup(auth, provider)
    return result.user
  } catch (error) {
    console.error('Google sign-in error:', error)
    throw error
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  const auth = getAuthInstance()
  await firebaseSignOut(auth)
}

/**
 * Get current user
 */
export function getCurrentUser(): User | null {
  const auth = getAuthInstance()
  return auth.currentUser
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  const auth = getAuthInstance()
  return onAuthStateChanged(auth, callback)
}

/**
 * Check if user is signed in
 */
export function isSignedIn(): boolean {
  return getCurrentUser() !== null
}
