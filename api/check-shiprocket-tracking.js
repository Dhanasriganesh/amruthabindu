import {
  isShiprocketConfigured,
  shiprocketFetch,
  mapShiprocketStatusToOurStatus,
  extractTrackingStatus,
} from '../lib/server/shiprocket.js'
import { sendStatusEmail } from '../lib/server/order-status-email.js'

/**
 * Check order tracking status from Shiprocket and automatically send emails
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!isShiprocketConfigured()) {
      console.log('ℹ️ SERVER: Shiprocket not configured — skipping tracking sync')
      return res.status(200).json({
        success: true,
        skipped: true,
        updated: 0,
        emailsSent: 0,
        checked: 0,
        message: 'Shiprocket not configured — tracking sync skipped',
      })
    }

    console.log('🔄 SERVER: Checking order tracking status from Shiprocket...')

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

    const ordersSnap = await db.collection('orders').get()
    const orders = ordersSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((o) => o.tracking_number && o.fulfillment_status !== 'DELIVERED')

    console.log(`📦 SERVER: Checking ${orders.length} orders for Shiprocket tracking updates`)

    let updated = 0
    let emailsSent = 0

    for (const order of orders) {
      try {
        const awb = order.tracking_number
        const response = await shiprocketFetch(`/courier/track/awb/${encodeURIComponent(awb)}`)

        if (!response.ok) {
          console.error(`❌ SERVER: Failed to fetch tracking for AWB ${awb}:`, response.status)
          continue
        }

        const trackData = await response.json()
        const { status: rawStatus, awb: awbFromResponse } = extractTrackingStatus(trackData)
        const newStatus = mapShiprocketStatusToOurStatus(rawStatus)
        const currentStatus = order.fulfillment_status || 'AWAITING_PROCESSING'

        if (!newStatus || newStatus === currentStatus) {
          continue
        }

        console.log(`🔄 SERVER: Order ${order.order_id} status changed: ${currentStatus} → ${newStatus}`)

        const existing = await findOrderByOrderId(db, order.order_id)
        if (!existing) continue

        const updatePayload = { fulfillment_status: newStatus }
        if (awbFromResponse && awbFromResponse !== order.tracking_number) {
          updatePayload.tracking_number = awbFromResponse
        }

        await db.collection('orders').doc(existing.id).update(updatePayload)
        updated++

        if (order.shipping_address?.email) {
          try {
            await sendStatusEmail(
              order,
              newStatus,
              awbFromResponse || order.tracking_number
            )
            emailsSent++
            console.log(`✅ SERVER: Email sent to ${order.shipping_address.email} for status: ${newStatus}`)
          } catch (emailError) {
            console.error(`❌ SERVER: Failed to send email for order ${order.order_id}:`, emailError.message)
          }
        }
      } catch (orderError) {
        console.error(`❌ SERVER: Error checking order ${order.order_id}:`, orderError.message)
      }
    }

    console.log(`✅ SERVER: Tracking check complete - ${updated} orders updated, ${emailsSent} emails sent`)

    return res.status(200).json({
      success: true,
      updated,
      emailsSent,
      checked: orders.length,
      message: `Checked ${orders.length} orders. ${updated} status updates, ${emailsSent} emails sent.`,
    })
  } catch (error) {
    console.error('❌ SERVER: Failed to check tracking:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check tracking status',
    })
  }
}
