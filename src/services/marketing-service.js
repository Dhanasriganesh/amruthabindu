import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'

function emailDocId(email) {
  return email.toLowerCase().replace(/[^a-z0-9@._-]/g, '_')
}

function docWithId(snapshot) {
  return { id: snapshot.id, ...snapshot.data() }
}

export async function getEmailMarketingList() {
  if (!db || !isFirebaseConfigured()) return []

  const q = query(collection(db, 'email_marketing_list'), orderBy('created_at', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(docWithId)
}

export async function addToEmailMarketingList({ email, name, source }) {
  if (!db || !isFirebaseConfigured()) throw new Error('Firebase not configured')

  const normalizedEmail = email.toLowerCase()
  const id = emailDocId(normalizedEmail)
  const ref = doc(db, 'email_marketing_list', id)

  const existing = await getDoc(ref)
  if (existing.exists()) {
    const err = new Error('Email already in marketing list')
    err.code = 'duplicate'
    throw err
  }

  await setDoc(ref, {
    email: normalizedEmail,
    name: name || normalizedEmail.split('@')[0],
    source: source || 'Manual',
    created_at: new Date().toISOString(),
  })

  const snap = await getDoc(ref)
  return docWithId(snap)
}

export async function removeFromEmailMarketingList(id) {
  if (!db || !isFirebaseConfigured()) throw new Error('Firebase not configured')
  await deleteDoc(doc(db, 'email_marketing_list', id))
}

export async function isInEmailMarketingList(email) {
  if (!db || !isFirebaseConfigured()) return false
  const snap = await getDoc(doc(db, 'email_marketing_list', emailDocId(email)))
  return snap.exists()
}

export async function getContactMessages() {
  if (!db || !isFirebaseConfigured()) return []

  const q = query(collection(db, 'contact_messages'), orderBy('created_at', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(docWithId)
}
