import fetch from 'node-fetch'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

let appInitialized = false
function ensureAdmin() {
  if (!appInitialized) {
    initializeApp()
    appInitialized = true
  }
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

    const { amount, name, email, phone, description, referenceId } = req.body || {}
    if (!amount || !email) return res.status(400).json({ error: 'amount and email required' })

    const keyId = process.env.RAZORPAY_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET
    const appUrl = process.env.APP_URL || 'http://localhost:5175'
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Razorpay credentials missing' })

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')
    const payload = {
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      description: description || 'Order Payment',
      customer: { name, email, contact: phone },
      notify: { sms: !!phone, email: !!email },
      reminder_enable: true,
      notes: { referenceId: referenceId || '' },
      callback_url: `${appUrl}/payment/callback`,
      callback_method: 'get'
    }

    const r = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await r.json()
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.description || 'Failed to create link' })

    ensureAdmin()
    const db = getFirestore()
    await db.collection('orders').doc(String(data.id)).set({
      orderId: data.id,
      paymentLinkId: data.id,
      paymentLinkShortUrl: data.short_url,
      razorpayOrderId: data.order_id,
      totals: { total: Number(amount) },
      customer: { name, email, phone },
      status: 'Pending',
      createdAt: new Date()
    }, { merge: true })

    return res.status(200).json({
      success: true,
      payment_link: data.short_url,
      payment_link_id: data.id,
      order_id: data.id,
      razorpay_order_id: data.order_id
    })
  } catch (e) {
    return res.status(500).json({ error: e?.message || 'Internal error' })
  }
}


