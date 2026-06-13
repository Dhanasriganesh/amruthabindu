import dotenv from 'dotenv'
import crypto from 'crypto'

dotenv.config()

/**
 * Verify Razorpay payment signature (HMAC-SHA256)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {}

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        error: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required',
      })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RZP_SECRET_KEY

    if (!keySecret) {
      return res.status(500).json({ error: 'Razorpay credentials not configured on server' })
    }

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: 'Payment signature verification failed' })
    }

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('❌ Razorpay verify-payment error:', error)
    return res.status(500).json({ error: error.message || 'Internal error' })
  }
}
