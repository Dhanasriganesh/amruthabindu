import {
  isShiprocketConfigured,
  shiprocketFetch,
  transformToShiprocketFormat,
} from './lib/shiprocket.js'

/**
 * Backend API endpoint to push orders to Shiprocket for delivery fulfillment
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!isShiprocketConfigured()) {
      console.log('ℹ️ SERVER: Shiprocket not configured — skipping delivery sync (order still saved)')
      return res.status(200).json({
        success: false,
        skipped: true,
        message: 'Shiprocket not configured — order saved locally only',
      })
    }

    const orderData = req.body
    if (!orderData?.orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId is required',
      })
    }

    // Only push paid orders to Shiprocket
    if (orderData.errorMessage) {
      return res.status(200).json({
        success: false,
        error: 'Failed payments are not pushed to Shiprocket',
      })
    }

    console.log('📦 SERVER: Pushing order to Shiprocket:', orderData.orderId)

    const shiprocketOrder = transformToShiprocketFormat(orderData)
    console.log('📋 SERVER: Shiprocket order payload prepared for:', shiprocketOrder.order_id)

    const response = await shiprocketFetch('/orders/create/adhoc', {
      method: 'POST',
      body: JSON.stringify(shiprocketOrder),
    })

    const responseText = await response.text()
    let result
    try {
      result = JSON.parse(responseText)
    } catch {
      result = { message: responseText }
    }

    if (!response.ok) {
      console.error('❌ SERVER: Shiprocket API error:', result)
      return res.status(response.status).json({
        success: false,
        error: result?.message || result?.error || `Shiprocket API returned ${response.status}`,
        details: result,
      })
    }

    const shiprocketOrderId = result.order_id?.toString() || result.data?.order_id?.toString()
    const shipmentId = result.shipment_id?.toString() || result.data?.shipment_id?.toString()

    console.log('✅ SERVER: Order synced to Shiprocket successfully:', shiprocketOrderId)

    return res.status(200).json({
      success: true,
      shiprocketOrderId,
      shipmentId,
      message: 'Order created in Shiprocket',
    })
  } catch (error) {
    console.error('❌ SERVER: Failed to push order to Shiprocket:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to push order to Shiprocket',
    })
  }
}
