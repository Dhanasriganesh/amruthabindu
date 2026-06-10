import { getShippingQuote, isShiprocketConfigured } from './lib/shiprocket.js'

/**
 * Calculate delivery charge for checkout using Shiprocket courier serviceability.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!isShiprocketConfigured()) {
      return res.status(200).json({
        success: false,
        skipped: true,
        deliveryPrice: 0,
        message: 'Shiprocket not configured — delivery shown as free',
      })
    }

    const {
      deliveryPincode,
      cartItems = [],
      orderValue = 0,
      cod = false,
      weightKg,
    } = req.body || {}

    const quote = await getShippingQuote({
      deliveryPincode,
      items: cartItems,
      orderValue: Number(orderValue) || 0,
      cod: Boolean(cod),
      weightKg,
    })

    if (!quote.success) {
      return res.status(quote.skipped ? 200 : 400).json(quote)
    }

    return res.status(200).json(quote)
  } catch (error) {
    console.error('❌ SERVER: Failed to get shipping rate:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to calculate shipping rate',
    })
  }
}
