import {
  isNimbuspostConfigured,
  createNimbuspostOrder,
  bookNimbuspostShipment,
} from '../lib/server/nimbuspost.js'

async function updateOrderNimbuspostFields(orderId, updates) {
  try {
    const { getFirestoreDb, findOrderByOrderId } = await import('../lib/server/firestore-server.js')
    const db = getFirestoreDb()
    const existing = await findOrderByOrderId(db, orderId)
    if (existing) {
      await db.collection('orders').doc(existing.id).update(updates)
      console.log('✅ SERVER: Order updated in Firestore with Nimbuspost IDs')
    }
  } catch (firestoreErr) {
    console.warn('ℹ️ SERVER: Could not update Firestore with Nimbuspost IDs:', firestoreErr.message)
  }
}

/**
 * Push orders to Nimbuspost.
 * - mode "create" (default): sync to Nimbuspost Orders without booking AWB
 * - mode "ship": book shipment with selected courier (requires courierId)
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!isNimbuspostConfigured()) {
      console.log('ℹ️ SERVER: Nimbuspost not configured — skipping delivery sync (order still saved)')
      return res.status(200).json({
        success: false,
        skipped: true,
        message: 'Nimbuspost not configured — order saved locally only',
      })
    }

    const orderData = req.body
    if (!orderData?.orderId) {
      return res.status(400).json({
        success: false,
        error: 'orderId is required',
      })
    }

    if (orderData.errorMessage) {
      return res.status(200).json({
        success: false,
        error: 'Failed payments are not pushed to Nimbuspost',
      })
    }

    const mode = String(orderData.mode || 'create').toLowerCase()
    console.log(`📦 SERVER: Nimbuspost ${mode} for order:`, orderData.orderId)

    let result
    if (mode === 'ship') {
      const courierId = orderData.courierId || orderData.courier_id
      if (!courierId) {
        return res.status(400).json({
          success: false,
          error: 'courierId is required to ship. Select a courier partner first.',
        })
      }
      result = await bookNimbuspostShipment(orderData, courierId)
    } else {
      result = await createNimbuspostOrder(orderData)
    }

    if (!result.success) {
      console.error('❌ SERVER: Nimbuspost sync failed:', result.error)
      await updateOrderNimbuspostFields(orderData.orderId, {
        nimbuspost_sync_error: result.error || 'Nimbuspost sync failed',
        nimbuspost_sync_status: 'failed',
      })
      return res.status(400).json({
        success: false,
        error: result.error || 'Failed to sync order to Nimbuspost',
        details: result.details,
      })
    }

    const updates = {
      nimbuspost_order_id: (result.nimbuspostOrderId || result.shipmentId).toString(),
      nimbuspost_sync_status: result.booked ? 'booked' : 'synced',
      nimbuspost_sync_error: null,
      fulfillment_status: result.booked ? 'SHIPPED' : 'AWAITING_PROCESSING',
    }

    if (result.shipmentId) {
      updates.nimbuspost_shipment_id = result.shipmentId.toString()
    }

    if (result.booked && result.awbNumber) {
      updates.tracking_number = result.awbNumber.toString()
      if (result.courierName) {
        updates.nimbuspost_courier_name = result.courierName
      }
    }

    await updateOrderNimbuspostFields(orderData.orderId, updates)

    console.log('✅ SERVER: Nimbuspost sync successful:', result.nimbuspostOrderId || result.shipmentId)

    return res.status(200).json({
      success: true,
      nimbuspostOrderId: result.nimbuspostOrderId || result.shipmentId,
      shipmentId: result.shipmentId,
      awbNumber: result.booked ? result.awbNumber : null,
      booked: Boolean(result.booked),
      message: result.message,
    })
  } catch (error) {
    console.error('❌ SERVER: Failed to push order to Nimbuspost:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to push order to Nimbuspost',
    })
  }
}
