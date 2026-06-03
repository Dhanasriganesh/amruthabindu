/**
 * Ecwid Order Tracking Service
 * Functions to sync and update order statuses with Ecwid
 */

/**
 * Sync orders from Ecwid to Supabase
 */
export async function syncOrdersFromEcwid() {
  try {
    console.log('🔄 Syncing orders from Ecwid...')
    
    const response = await fetch('/api/sync-ecwid-orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ Non-JSON response:', text.substring(0, 200))
      throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Make sure backend server is running.`)
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to sync orders: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Orders synced from Ecwid:', result)
    
    return result
  } catch (error) {
    console.error('❌ Failed to sync orders from Ecwid:', error)
    throw error
  }
}

/**
 * Check tracking status from Ecwid and automatically send emails
 * This fetches latest status from Ecwid (including Indian Post tracking) and sends emails
 */
export async function checkTrackingStatus() {
  try {
    console.log('🔄 Checking tracking status from Ecwid...')
    
    const response = await fetch('/api/check-ecwid-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    })

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ Non-JSON response:', text.substring(0, 200))
      throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Make sure backend server is running.`)
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to check tracking: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Tracking check complete:', result)
    
    return result
  } catch (error) {
    console.error('❌ Failed to check tracking:', error)
    throw error
  }
}

/**
 * Update order status in Ecwid and Supabase
 * Also sends email to customer automatically
 */
export async function updateOrderStatus(orderId, ecwidOrderId, status, trackingNumber = null) {
  try {
    console.log('🔄 Updating order status:', { orderId, status, trackingNumber })
    
    const response = await fetch('/api/update-ecwid-order-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        ecwidOrderId,
        status,
        trackingNumber
      })
    })

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('❌ Non-JSON response:', text.substring(0, 200))
      throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Make sure backend server is running.`)
    }

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || `Failed to update status: ${response.status}`)
    }

    const result = await response.json()
    console.log('✅ Order status updated:', result)
    
    return result
  } catch (error) {
    console.error('❌ Failed to update order status:', error)
    throw error
  }
}

