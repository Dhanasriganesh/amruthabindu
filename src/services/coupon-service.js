import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
} from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'

function docWithId(snapshot) {
  return { id: snapshot.id, ...snapshot.data() }
}

export async function createCoupon(couponData) {
  try {
    if (!db || !isFirebaseConfigured()) throw new Error('Firebase not configured')

    const ref = await addDoc(collection(db, 'coupons'), {
      code: couponData.code.toUpperCase(),
      discount_type: couponData.discountType,
      discount_value: Number(couponData.discountValue),
      start_date: couponData.startDate,
      end_date: couponData.endDate,
      is_active: couponData.isActive ?? true,
      usage_type: couponData.usageType,
      max_uses: couponData.maxUses || null,
      current_uses: 0,
      min_order_amount: couponData.minOrderAmount || 0,
      created_at: new Date().toISOString(),
    })

    const snap = await getDoc(ref)
    return { data: docWithId(snap), error: null }
  } catch (error) {
    console.error('Error creating coupon:', error)
    return { data: null, error: error.message }
  }
}

export async function updateCoupon(couponId, updates) {
  try {
    if (!db || !isFirebaseConfigured()) throw new Error('Firebase not configured')

    const updateData = { ...updates, updated_at: new Date().toISOString() }
    if (updates.code) updateData.code = updates.code.toUpperCase()

    await updateDoc(doc(db, 'coupons', couponId), updateData)
    const snap = await getDoc(doc(db, 'coupons', couponId))
    return { data: docWithId(snap), error: null }
  } catch (error) {
    console.error('Error updating coupon:', error)
    return { data: null, error: error.message }
  }
}

export async function deleteCoupon(couponId) {
  try {
    if (!db || !isFirebaseConfigured()) throw new Error('Firebase not configured')

    await deleteDoc(doc(db, 'coupons', couponId))
    return { error: null }
  } catch (error) {
    console.error('Error deleting coupon:', error)
    return { error: error.message }
  }
}

export async function getAllCoupons() {
  try {
    if (!db || !isFirebaseConfigured()) return { data: [], error: null }

    const q = query(collection(db, 'coupons'), orderBy('created_at', 'desc'))
    const snap = await getDocs(q)
    return { data: snap.docs.map(docWithId), error: null }
  } catch (error) {
    console.error('Error fetching coupons:', error)
    return { data: [], error: error.message }
  }
}

export async function toggleCouponStatus(couponId, isActive) {
  try {
    if (!db || !isFirebaseConfigured()) throw new Error('Firebase not configured')

    await updateDoc(doc(db, 'coupons', couponId), {
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    const snap = await getDoc(doc(db, 'coupons', couponId))
    return { data: docWithId(snap), error: null }
  } catch (error) {
    console.error('Error toggling coupon status:', error)
    return { data: null, error: error.message }
  }
}

export async function validateCoupon(code, userId = null, userEmail = null, cartTotal = 0) {
  try {
    if (!db || !isFirebaseConfigured()) throw new Error('Firebase not configured')

    const q = query(collection(db, 'coupons'), where('code', '==', code.toUpperCase()))
    const snap = await getDocs(q)

    if (snap.empty) {
      return { valid: false, error: 'Invalid coupon code', coupon: null }
    }

    const coupon = docWithId(snap.docs[0])

    if (!coupon.is_active) {
      return { valid: false, error: 'This coupon is not active', coupon: null }
    }

    const now = new Date()
    if (now < new Date(coupon.start_date)) {
      return { valid: false, error: 'This coupon is not yet valid', coupon: null }
    }
    if (now > new Date(coupon.end_date)) {
      return { valid: false, error: 'This coupon has expired', coupon: null }
    }

    if (coupon.min_order_amount && cartTotal < coupon.min_order_amount) {
      return {
        valid: false,
        error: `Minimum order amount of ₹${coupon.min_order_amount} required`,
        coupon: null,
      }
    }

    if (coupon.max_uses && coupon.current_uses >= coupon.max_uses) {
      return { valid: false, error: 'This coupon has reached its usage limit', coupon: null }
    }

    if (coupon.usage_type === 'first_time_only') {
      const hasPreviousOrders = await checkUserHasPreviousOrders(userId, userEmail)
      if (hasPreviousOrders) {
        return { valid: false, error: 'This coupon is only for first-time customers', coupon: null }
      }
    }

    if (coupon.usage_type === 'one_time_per_user') {
      const hasUsedCoupon = await checkUserHasUsedCoupon(coupon.id, userId, userEmail)
      if (hasUsedCoupon) {
        return { valid: false, error: 'You have already used this coupon', coupon: null }
      }
    }

    return { valid: true, error: null, coupon }
  } catch (error) {
    console.error('Error validating coupon:', error)
    return { valid: false, error: error.message, coupon: null }
  }
}

async function checkUserHasPreviousOrders(userId, userEmail) {
  try {
    if (!db) return false

    if (userId) {
      const q = query(collection(db, 'orders'), where('user_id', '==', userId))
      const snap = await getDocs(q)
      return !snap.empty
    }

    if (userEmail) {
      const q = query(collection(db, 'orders'), where('guest_email', '==', userEmail))
      const snap = await getDocs(q)
      return !snap.empty
    }

    return false
  } catch (error) {
    console.error('Error checking previous orders:', error)
    return false
  }
}

async function checkUserHasUsedCoupon(couponId, userId, userEmail) {
  try {
    if (!db) return false

    let q
    if (userId) {
      q = query(
        collection(db, 'coupon_usage'),
        where('coupon_id', '==', couponId),
        where('user_id', '==', userId)
      )
    } else if (userEmail) {
      q = query(
        collection(db, 'coupon_usage'),
        where('coupon_id', '==', couponId),
        where('user_email', '==', userEmail)
      )
    } else {
      return false
    }

    const snap = await getDocs(q)
    return !snap.empty
  } catch (error) {
    console.error('Error checking coupon usage:', error)
    return false
  }
}

export async function recordCouponUsage(couponId, userId, userEmail, orderId, discountApplied) {
  try {
    if (!db || !isFirebaseConfigured()) return { error: 'Firebase not configured' }

    await addDoc(collection(db, 'coupon_usage'), {
      coupon_id: couponId,
      user_id: userId || null,
      user_email: userEmail || null,
      order_id: orderId,
      discount_applied: discountApplied,
      used_at: new Date().toISOString(),
    })

    const couponRef = doc(db, 'coupons', couponId)
    const couponSnap = await getDoc(couponRef)
    if (couponSnap.exists()) {
      const current = couponSnap.data().current_uses || 0
      await updateDoc(couponRef, { current_uses: current + 1 })
    }

    return { error: null }
  } catch (error) {
    console.error('Error recording coupon usage:', error)
    return { error: error.message }
  }
}

export async function getCouponUsageList(couponId) {
  try {
    if (!db || !isFirebaseConfigured()) return { data: [], error: null }

    const q = query(
      collection(db, 'coupon_usage'),
      where('coupon_id', '==', couponId),
      orderBy('used_at', 'desc')
    )
    const snap = await getDocs(q)
    return { data: snap.docs.map(docWithId), error: null }
  } catch (error) {
    console.error('Error fetching coupon usage:', error)
    return { data: [], error: error.message }
  }
}

export function calculateDiscount(coupon, cartTotal) {
  if (!coupon) return 0

  if (coupon.discount_type === 'percentage') {
    const discount = (cartTotal * coupon.discount_value) / 100
    return Math.min(discount, cartTotal)
  }
  return Math.min(coupon.discount_value, cartTotal)
}
