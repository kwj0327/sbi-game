import { initializeApp, type FirebaseApp } from 'firebase/app'
import { getAuth, type Auth } from 'firebase/auth'
import { getFirestore, type Firestore } from 'firebase/firestore'

/** GitHub Pages 등 env 미주입 빌드용 — 웹 API 키는 공개값이라 Rules로 보호 */
const FALLBACK_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyDiFDs-bLoSb7JtrOy8PokyG1MWUZZltC0',
  authDomain: 'sbi-game.firebaseapp.com',
  projectId: 'sbi-game',
  storageBucket: 'sbi-game.firebasestorage.app',
  messagingSenderId: '228799317909',
  appId: '1:228799317909:web:8c990631ec0e6efcafd89c',
} as const

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || FALLBACK_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || FALLBACK_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || FALLBACK_FIREBASE_CONFIG.projectId,
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || FALLBACK_FIREBASE_CONFIG.storageBucket,
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ||
    FALLBACK_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || FALLBACK_FIREBASE_CONFIG.appId,
}

function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId,
  )
}

let app: FirebaseApp | null = null
let auth: Auth | null = null
let db: Firestore | null = null

export function getFirebaseApp() {
  if (!hasFirebaseConfig()) return null
  if (!app) app = initializeApp(firebaseConfig)
  return app
}

export function getFirebaseAuth() {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) return null
  if (!auth) auth = getAuth(firebaseApp)
  return auth
}

export function getFirestoreDb() {
  const firebaseApp = getFirebaseApp()
  if (!firebaseApp) return null
  if (!db) db = getFirestore(firebaseApp)
  return db
}

export function isFirebaseConfigured() {
  return hasFirebaseConfig()
}
