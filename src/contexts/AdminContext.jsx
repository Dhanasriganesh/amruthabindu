import React, { createContext, useContext, useState, useEffect } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'
import { isAdminUser, ensureAdminFirestoreAccess } from '../services/admin-auth'

const AdminContext = createContext(null)

export function AdminProvider({ children }) {
  const [adminUser, setAdminUser] = useState(null)
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    localStorage.removeItem('adminSession')

    if (!auth || !isFirebaseConfigured()) {
      setIsLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setAdminUser(null)
        setIsAdminAuthenticated(false)
        setIsLoading(false)
        return
      }

      const allowed = await isAdminUser(user)
      if (allowed) {
        try {
          await ensureAdminFirestoreAccess(user)
        } catch (err) {
          console.error('Admin Firestore setup failed:', err)
        }
        setAdminUser(user)
        setIsAdminAuthenticated(true)
      } else {
        setAdminUser(null)
        setIsAdminAuthenticated(false)
      }
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const adminLogin = async (email, password) => {
    if (!auth || !isFirebaseConfigured()) {
      return { success: false, error: 'Firebase is not configured' }
    }

    try {
      const { user } = await signInWithEmailAndPassword(auth, email.trim(), password)
      const allowed = await isAdminUser(user)

      if (!allowed) {
        await signOut(auth)
        return {
          success: false,
          error:
            'This account is not authorized for admin access. Add your email to VITE_ADMIN_EMAILS or the Firestore admins collection.',
        }
      }

      try {
        await ensureAdminFirestoreAccess(user)
      } catch (err) {
        await signOut(auth)
        return {
          success: false,
          error:
            'Could not set up admin access in Firestore. Deploy the latest firestore.rules, then sign in again. ' +
            (err?.message || ''),
        }
      }

      setAdminUser(user)
      setIsAdminAuthenticated(true)
      return { success: true }
    } catch (error) {
      const message =
        error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password'
          ? 'Invalid email or password'
          : error.message || 'Login failed'
      return { success: false, error: message }
    }
  }

  const adminLogout = async () => {
    if (auth) {
      await signOut(auth)
    }
    setAdminUser(null)
    setIsAdminAuthenticated(false)
  }

  const value = {
    adminUser,
    isAdminAuthenticated,
    adminLogin,
    adminLogout,
    isLoading,
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider')
  }
  return context
}
