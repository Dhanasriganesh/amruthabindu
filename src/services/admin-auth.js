import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'

export function getEnvAdminEmails() {
  const raw = import.meta.env.VITE_ADMIN_EMAILS || ''
  return raw
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function emailDocId(email) {
  return email.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_')
}

/**
 * Ensures Firestore security rules recognize this admin (config allowlist + admins/{uid}).
 * Call after isAdminUser() succeeds so Analytics/orders/CMS writes are permitted.
 */
export async function ensureAdminFirestoreAccess(user) {
  if (!db || !isFirebaseConfigured() || !user?.email || !user?.uid) return

  const email = user.email.trim().toLowerCase()
  const envEmails = getEnvAdminEmails()

  try {
    const configRef = doc(db, 'config', 'adminAccess')
    const configSnap = await getDoc(configRef)

    if (!configSnap.exists() && envEmails.length > 0 && envEmails.includes(email)) {
      await setDoc(configRef, { adminEmails: envEmails })
      console.log('✅ Created config/adminAccess for Firestore admin rules')
    }

    const uidRef = doc(db, 'admins', user.uid)
    const uidSnap = await getDoc(uidRef)

    if (!uidSnap.exists()) {
      await setDoc(uidRef, { email, active: true }, { merge: true })
      console.log('✅ Created admins/' + user.uid + ' for Firestore admin rules')
    }
  } catch (error) {
    console.error('Failed to provision admin Firestore access:', error)
    throw error
  }
}

function isPermissionDenied(error) {
  return error?.code === 'permission-denied'
}

/**
 * Returns true if the Firebase user is allowed to access the admin panel.
 * Checks VITE_ADMIN_EMAILS first, then Firestore `admins/{uid}` and `config/adminAccess`.
 * Only reads paths allowed by firestore.rules for the signed-in user (avoids permission errors).
 */
export async function isAdminUser(user) {
  if (!user?.email) return false

  const email = user.email.trim().toLowerCase()

  const envAdmins = getEnvAdminEmails()
  if (envAdmins.length > 0 && envAdmins.includes(email)) {
    return true
  }

  if (!db || !isFirebaseConfigured() || !user.uid) {
    return false
  }

  try {
    const byUid = await getDoc(doc(db, 'admins', user.uid))
    if (byUid.exists() && byUid.data()?.active !== false) {
      return true
    }

    const configSnap = await getDoc(doc(db, 'config', 'adminAccess'))
    const allowlist = configSnap.data()?.adminEmails
    if (Array.isArray(allowlist)) {
      const normalized = allowlist.map((e) => String(e).trim().toLowerCase())
      if (normalized.includes(email)) {
        return true
      }
    }
  } catch (error) {
    if (!isPermissionDenied(error)) {
      console.error('Error checking admin access:', error)
    }
  }

  return false
}
