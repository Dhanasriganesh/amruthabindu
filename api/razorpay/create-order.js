import dotenv from 'dotenv'

dotenv.config()

/**
 * Create a Razorpay order server-side (recommended for card/UPI payments)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { amount, currency = 'INR', receipt } = req.body || {}

    if (!amount || amount < 100) {
      return res.status(400).json({ error: 'amount (in paise, min 100) is required' })
    }

    const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RZP_KEY_ID
    const keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.VITE_RZP_SECRET_KEY

    if (!keyId || !keySecret) {
      return res.status(500).json({ error: 'Razorpay credentials not configured on server' })
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString('base64')

    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(Number(amount)),
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        payment_capture: 1,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('❌ Razorpay order creation failed:', data)
      const status =
        response.status === 401 ? 401 : response.status >= 500 ? 500 : response.status
      return res.status(status).json({
        error: data?.error?.description || 'Failed to create Razorpay order',
      })
    }

    return res.status(200).json({
      success: true,
      order_id: data.id,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
    })
  } catch (error) {
    console.error('❌ Razorpay create-order error:', error)
    return res.status(500).json({ error: error.message || 'Internal error' })
  }
}
