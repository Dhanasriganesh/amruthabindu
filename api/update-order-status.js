import { sendStatusEmail } from '../lib/server/order-status-email.js'

/**
 * Update order fulfillment status in Firestore and notify customer
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { orderId, status, trackingNumber } = req.body

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        error: 'orderId and status are required',
      })
    }

    const validStatuses = ['PACKED', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'AWAITING_PROCESSING']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status: ${status}. Valid statuses: ${validStatuses.join(', ')}`,
      })
    }

    console.log('🔄 SERVER: Updating order status...')
    console.log('   Order ID:', orderId)
    console.log('   New Status:', status)
    console.log('   Tracking:', trackingNumber || 'N/A')

    const { getFirestoreDb, findOrderByOrderId } = await import('../lib/server/firestore-server.js')
    let db
    try {
      db = getFirestoreDb()
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Firebase Admin not configured',
      })
    }

    const updateData = { fulfillment_status: status }
    if (trackingNumber) {
      updateData.tracking_number = trackingNumber
    }

    const existing = await findOrderByOrderId(db, orderId)
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      })
    }

    await db.collection('orders').doc(existing.id).update(updateData)
    console.log('✅ SERVER: Order status updated in Firestore')

    const order = { ...existing, ...updateData }

    if (order.shipping_address?.email) {
      sendStatusEmail(order, status, trackingNumber).catch((err) => {
        console.error('❌ SERVER: Failed to send status email:', err.message)
      })
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      orderId,
      status,
    })
  } catch (error) {
    console.error('❌ SERVER: Failed to update order status:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update order status',
    })
  }
}
