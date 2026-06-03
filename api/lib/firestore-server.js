import admin from 'firebase-admin'

let firestoreDb = null

export function getFirestoreDb() {
  if (firestoreDb) return firestoreDb

  if (!admin.apps.length) {
    const projectId =
      process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id || projectId,
      })
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      })
    } else {
      throw new Error(
        'Firebase Admin not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY'
      )
    }
  }

  firestoreDb = admin.firestore()
  return firestoreDb
}

export async function findOrderByOrderId(db, orderId) {
  const snap = await db
    .collection('orders')
    .where('order_id', '==', String(orderId))
    .limit(1)
    .get()

  if (snap.empty) return null
  const doc = snap.docs[0]
  return { id: doc.id, ...doc.data() }
}

export async function upsertOrderByOrderId(db, orderData) {
  const existing = await findOrderByOrderId(db, orderData.order_id)

  if (existing) {
    const { order_id, created_at, ...updates } = orderData
    await db.collection('orders').doc(existing.id).update(updates)
    return { action: 'updated', id: existing.id }
  }

  const ref = await db.collection('orders').add(orderData)
  return { action: 'created', id: ref.id }
}
