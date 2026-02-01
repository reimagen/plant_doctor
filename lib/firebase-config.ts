import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app'
import { getFirestore, enableMultiTabIndexedDbPersistence, Firestore } from 'firebase/firestore'
import { getAuth, Auth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let _app: FirebaseApp | null = null
let _db: Firestore | null = null
let _auth: Auth | null = null
let _persistenceEnabled = false

function getFirebaseApp(): FirebaseApp {
  if (!_app) {
    _app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
  }
  return _app
}

export function getDb(): Firestore {
  if (!_db) {
    _db = getFirestore(getFirebaseApp())
    // Enable offline persistence once
    if (typeof window !== 'undefined' && !_persistenceEnabled) {
      _persistenceEnabled = true
      enableMultiTabIndexedDbPersistence(_db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('[Firebase] Persistence failed: multiple tabs open')
        } else if (err.code === 'unimplemented') {
          console.warn('[Firebase] Persistence not available in this browser')
        }
      })
    }
  }
  return _db
}

export function getFirebaseAuth(): Auth {
  if (!_auth) {
    _auth = getAuth(getFirebaseApp())
  }
  return _auth
}
