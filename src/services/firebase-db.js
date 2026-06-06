import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'

function docWithId(snapshot) {
  return { id: snapshot.id, ...snapshot.data() }
}

function guestEmailFromOrder(order) {
  return order?.shipping_address?.email || order?.guest_email || null
}

// ==================== CONTACTS ====================

export async function saveContactMessage(message) {
  if (!db) throw new Error('Firebase not configured')

  const ref = await addDoc(collection(db, 'contact_messages'), {
    name: message.name,
    email: message.email,
    phone: message.phone,
    subject: message.subject,
    message: message.message,
    created_at: new Date().toISOString(),
  })

  console.log('✅ Contact message saved to Firebase')
  const snap = await getDoc(ref)
  return docWithId(snap)
}

// ==================== ORDERS ====================

export async function saveOrder(order) {
  if (!db) throw new Error('Firebase not configured')

  const sanitizedOrder = {
    order_id: String(order.orderId || ''),
    payment_id: String(order.paymentId || ''),
    payment_method: String(order.paymentMethod || ''),
    items: order.items || [],
    totals: order.totals || {},
    delivery_info: order.deliveryInfo || null,
    shipping_address: order.shippingAddress || null,
    guest_email: order.shippingAddress?.email || null,
    user_id: order.userId || null,
    created_at: new Date().toISOString(),
  }

  if (order.shiprocketOrderId !== undefined) {
    sanitizedOrder.shiprocket_order_id = order.shiprocketOrderId
  }
  if (order.shiprocketShipmentId !== undefined) {
    sanitizedOrder.shiprocket_shipment_id = order.shiprocketShipmentId
  }
  if (order.fulfillmentStatus !== undefined) {
    sanitizedOrder.fulfillment_status = order.fulfillmentStatus || 'AWAITING_PROCESSING'
  }

  console.log('💾 Saving order to Firebase:', sanitizedOrder.order_id)
  const ref = await addDoc(collection(db, 'orders'), sanitizedOrder)
  const snap = await getDoc(ref)
  console.log('✅ Order saved to Firebase successfully')
  return docWithId(snap)
}

export async function updateOrderByOrderId(orderId, updates) {
  if (!db) return { error: 'Firebase not configured' }

  const q = query(
    collection(db, 'orders'),
    where('order_id', '==', String(orderId)),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) {
    return { error: 'Order not found' }
  }

  const docRef = snap.docs[0].ref
  await updateDoc(docRef, updates)
  return { error: null }
}

export async function getAllOrders() {
  if (!db) return []

  const q = query(collection(db, 'orders'), orderBy('created_at', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map(docWithId)
}

export async function getOrdersByUserId(userId) {
  if (!db || !userId) return []

  const q = query(
    collection(db, 'orders'),
    where('user_id', '==', userId),
    orderBy('created_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(docWithId)
}

export async function getGuestOrdersByEmail(email) {
  if (!db || !email) return []

  const q = query(
    collection(db, 'orders'),
    where('guest_email', '==', email),
    orderBy('created_at', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs
    .map(docWithId)
    .filter((o) => !o.user_id)
}

// ==================== USER CART ====================

export async function saveCartSnapshot(userId, items) {
  if (!userId || !db || !isFirebaseConfigured()) return null

  try {
    await setDoc(
      doc(db, 'user_carts', userId),
      { user_id: userId, items, updated_at: new Date().toISOString() },
      { merge: true }
    )
    return { user_id: userId, items }
  } catch (error) {
    console.error('❌ Error saving cart:', error)
    return null
  }
}

export async function loadCartSnapshot(userId) {
  if (!userId || !db || !isFirebaseConfigured()) return []

  try {
    const snap = await getDoc(doc(db, 'user_carts', userId))
    return snap.exists() ? snap.data().items || [] : []
  } catch (error) {
    console.error('❌ Error loading cart:', error)
    return []
  }
}

// ==================== FAVORITES ====================

export async function saveFavorite(userId, productId) {
  if (!userId || !db || !isFirebaseConfigured()) return null

  try {
    const id = `${userId}_${productId}`
    await setDoc(doc(db, 'user_favorites', id), {
      user_id: userId,
      product_id: productId,
      created_at: new Date().toISOString(),
    })
    return { user_id: userId, product_id: productId }
  } catch (error) {
    console.error('❌ Error saving favorite:', error)
    return null
  }
}

export async function removeFavorite(userId, productId) {
  if (!userId || !db || !isFirebaseConfigured()) return true

  try {
    await deleteDoc(doc(db, 'user_favorites', `${userId}_${productId}`))
    return true
  } catch (error) {
    console.error('❌ Error removing favorite:', error)
    return false
  }
}

export async function loadFavorites(userId) {
  if (!userId || !db || !isFirebaseConfigured()) return []

  try {
    const q = query(collection(db, 'user_favorites'), where('user_id', '==', userId))
    const snap = await getDocs(q)
    return snap.docs.map((d) => d.data().product_id)
  } catch (error) {
    console.error('❌ Error loading favorites:', error)
    return []
  }
}

// ==================== GUEST ORDER LINKING ====================

export async function linkGuestOrdersToUser(userId, guestEmail) {
  if (!userId || !guestEmail || !db || !isFirebaseConfigured()) {
    return { linked: 0, error: 'Firebase not configured' }
  }

  try {
    const guestOrders = await getGuestOrdersByEmail(guestEmail)
    if (guestOrders.length === 0) {
      return { linked: 0, error: null }
    }

    const batch = writeBatch(db)
    guestOrders.forEach((order) => {
      batch.update(doc(db, 'orders', order.id), { user_id: userId, guest_email: null })
    })
    await batch.commit()

    console.log(`✅ Linked ${guestOrders.length} guest orders to user ${userId}`)
    return { linked: guestOrders.length, error: null }
  } catch (error) {
    console.error('❌ Error linking guest orders:', error)
    return { linked: 0, error: error.message }
  }
}

export async function getUserOrders(userId) {
  return getOrdersByUserId(userId)
}
