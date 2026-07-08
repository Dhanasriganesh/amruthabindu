import { isNimbuspostConfigured, listCouriersForOrder } from '../lib/server/nimbuspost.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!isNimbuspostConfigured()) {
      return res.status(200).json({
        success: false,
        skipped: true,
        message: 'Nimbuspost not configured',
      })
    }

    const orderData = req.body
    if (!orderData?.orderId && !orderData?.shippingAddress && !orderData?.shipping_address) {
      return res.status(400).json({
        success: false,
        error: 'Order data with shipping address is required',
      })
    }

    const result = await listCouriersForOrder(orderData)
    if (!result.success) {
      return res.status(400).json(result)
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('❌ SERVER: Failed to fetch couriers:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch courier options',
    })
  }
}
