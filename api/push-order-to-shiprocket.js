import {
  isShiprocketConfigured,
  shiprocketFetch,
  transformToShiprocketFormat,
  resolvePickupLocation,
} from '../../lib/server/shiprocket.js'

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

    const pickupLocation = await resolvePickupLocation()
    const shiprocketOrder = transformToShiprocketFormat(orderData, pickupLocation)
    console.log('📋 SERVER: Shiprocket order payload prepared for:', shiprocketOrder.order_id, 'pickup:', pickupLocation)

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
      const pickupMissing =
        result?.message?.toLowerCase().includes('billing/shipping address') ||
        result?.message?.toLowerCase().includes('pickup')
      return res.status(response.status).json({
        success: false,
        error: pickupMissing
          ? 'Shiprocket pickup address not configured. Add a pickup address in Shiprocket → Settings → Pickup Address, then set SHIPROCKET_PICKUP_LOCATION in .env to match the nickname.'
          : result?.message || result?.error || `Shiprocket API returned ${response.status}`,
        details: result,
      })
    }

    const shiprocketOrderId = result.order_id?.toString() || result.data?.order_id?.toString()
    const shipmentId = result.shipment_id?.toString() || result.data?.shipment_id?.toString()

    if (!shiprocketOrderId) {
      console.error('❌ SERVER: Shiprocket did not create order:', result)
      const wrongPickup = result?.message?.toLowerCase().includes('pickup location')
      return res.status(400).json({
        success: false,
        error: wrongPickup
          ? `Wrong pickup location. Set SHIPROCKET_PICKUP_LOCATION=Shop in .env (your Shiprocket nickname is "Shop").`
          : result?.message || 'Shiprocket did not create the order',
        details: result,
      })
    }

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
