/**
 * Ecwid Integration Service
 * 
 * This service pushes orders from your custom frontend to Ecwid's backend
 * so you can track and manage orders through Ecwid's admin panel.
 */

/**
 * Push order to Ecwid via backend API
 * This keeps the secret token secure on the server side
 * 
 * @param {Object} orderData - The order data from your checkout
 * @returns {Promise<Object>} Ecwid order response
 */
export async function pushOrderToEcwid(orderData) {
  try {
    console.log('📦 Pushing order to Ecwid via backend:', orderData.orderId)

    // Call backend API endpoint which handles Ecwid API authentication
    const response = await fetch('/api/push-order-to-ecwid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    })

    console.log('📡 Backend API response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Backend API error:', errorData)
      throw new Error(errorData.error || `Backend API returned ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Order synced to Ecwid successfully:', result)
      return result
    } else {
      throw new Error(result.error || 'Failed to sync order to Ecwid')
    }

  } catch (error) {
    console.error('❌ Failed to push order to Ecwid:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Record failed payment attempt in Ecwid
 * Creates a "Failed" or "Incomplete" order so you can track failed payments
 * 
 * @param {Object} failedOrderData - The failed order data
 * @returns {Promise<Object>} Ecwid response
 */
export async function recordFailedPaymentInEcwid(failedOrderData) {
  try {
    console.log('⚠️ Recording failed payment in Ecwid via backend:', failedOrderData.orderId)

    // Call backend API endpoint (same as successful orders, but with errorMessage)
    const response = await fetch('/api/push-order-to-ecwid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(failedOrderData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('❌ Backend API error (failed payment):', errorData)
      throw new Error(errorData.error || `Backend API returned ${response.status}`)
    }

    const result = await response.json()
    
    if (result.success) {
      console.log('✅ Failed payment recorded in Ecwid:', result)
      return result
    } else {
      throw new Error(result.error || 'Failed to record failed payment in Ecwid')
    }

  } catch (error) {
    console.error('❌ Failed to record failed payment in Ecwid:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Note: Order transformation and Ecwid API calls are now handled by the backend API
// See /api/push-order-to-ecwid.js for the implementation

