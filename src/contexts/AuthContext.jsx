import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { auth, isFirebaseConfigured } from '../lib/firebase'

const AuthContext = createContext(null)

function normalizeUser(user) {
  if (!user) return null
  return {
    ...user,
    id: user.uid,
    user_metadata: {
      display_name: user.displayName || '',
      phone: '',
    },
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth || !isFirebaseConfigured()) {
      setLoading(false)
      return undefined
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(normalizeUser(user))
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const signup = async (email, password, displayName) => {
    if (!auth) throw new Error('Firebase auth is not configured')

    const { user } = await createUserWithEmailAndPassword(auth, email, password)

    if (displayName) {
      await updateProfile(user, { displayName })
    }

    const normalized = normalizeUser(user)

    try {
      const { linkGuestOrdersToUser } = await import('../services/firebase-db')
      await linkGuestOrdersToUser(normalized.id, email)
    } catch (err) {
      console.warn('Could not link guest orders:', err)
    }

    try {
      const apiUrl = import.meta.env.DEV
        ? '/api/send-lead-email'
        : 'http://localhost:3001/api/send-lead-email'

      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType: 'signup-welcome',
          leadData: {
            name: displayName || 'Customer',
            email,
          },
        }),
      }).catch((err) => console.error('❌ Could not send welcome email:', err))
    } catch (err) {
      console.error('❌ Welcome email error:', err)
    }

    setCurrentUser(normalized)
    return normalized
  }

  const login = async (email, password) => {
    if (!auth) throw new Error('Firebase auth is not configured')

    const { user } = await signInWithEmailAndPassword(auth, email, password)
    const normalized = normalizeUser(user)

    try {
      const { linkGuestOrdersToUser } = await import('../services/firebase-db')
      await linkGuestOrdersToUser(normalized.id, email)
    } catch (err) {
      console.warn('Could not link guest orders:', err)
    }

    setCurrentUser(normalized)
    return normalized
  }

  const logout = async () => {
    if (!auth) return
    await firebaseSignOut(auth)
  }

  const value = { currentUser, signup, login, logout }
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
