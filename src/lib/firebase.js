import { initializeApp } from 'firebase/app'
import { getAnalytics, isSupported as analyticsSupported } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

export const isFirebaseConfigured = () => {
  return Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  )
}

let app = null
let auth = null
let db = null
let storage = null
let analytics = null

if (isFirebaseConfigured()) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  db = getFirestore(app)
  storage = getStorage(app)
  try {
    if (typeof window !== 'undefined') {
      analyticsSupported().then((ok) => {
        if (ok) analytics = getAnalytics(app)
      })
    }
  } catch (_) {
    // ignore analytics errors
  }
  console.log('✅ Firebase configured successfully')
} else {
  console.warn('⚠️ Firebase not configured! Add VITE_FIREBASE_* variables to .env')
}

export { app, auth, db, storage, analytics }

export const STORAGE_FOLDERS = {
  PRODUCTS: import.meta.env.VITE_FIREBASE_FOLDER_PRODUCTS || 'products',
  HOME: import.meta.env.VITE_FIREBASE_FOLDER_HOME || 'home',
  HEADER: import.meta.env.VITE_FIREBASE_FOLDER_HEADER || 'header',
}
