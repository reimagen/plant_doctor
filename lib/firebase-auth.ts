import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth'
import { getFirebaseAuth } from './firebase-config'

let currentUser: User | null = null
let userReadyPromise: Promise<User> | null = null

function initAuth(): Promise<User> {
  if (userReadyPromise) return userReadyPromise

  userReadyPromise = new Promise<User>((resolve) => {
    const auth = getFirebaseAuth()
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        currentUser = user
        resolve(user)
        unsubscribe()
      }
    })

    // Trigger anonymous sign-in
    signInAnonymously(auth).catch((err) => {
      console.error('[Auth] Anonymous sign-in failed:', err)
    })
  })

  return userReadyPromise
}

export async function ensureUser(): Promise<User> {
  if (currentUser) return currentUser
  if (typeof window === 'undefined') {
    throw new Error('Firebase Auth is not available during SSR')
  }
  return initAuth()
}

export function getCurrentUser(): User | null {
  return currentUser
}
