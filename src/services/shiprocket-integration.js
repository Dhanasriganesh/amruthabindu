/**
 * Shiprocket Integration Service
 *
 * Pushes orders to Shiprocket for delivery fulfillment and tracking.
 * Gracefully skips when Shiprocket credentials are not configured.
 */

export async function pushOrderToShiprocket(orderData) {
  try {
    console.log('📦 Pushing order to Shiprocket via backend:', orderData.orderId)

    const response = await fetch('/api/push-order-to-shiprocket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    })

    const result = await response.json().catch(() => ({}))

    if (result.skipped) {
      console.info('ℹ️ Shiprocket not configured — delivery sync skipped. Order is saved locally.')
      return { success: false, skipped: true, message: result.message }
    }

    if (!response.ok) {
      console.warn('⚠️ Shiprocket sync failed:', result.error || response.status)
      return {
        success: false,
        error: result.error || `Backend API returned ${response.status}`,
      }
    }

    if (result.success) {
      console.log('✅ Order synced to Shiprocket successfully:', result)
      return result
    }

    console.warn('⚠️ Shiprocket sync did not complete:', result.error || result.message)
    return {
      success: false,
      error: result.error || result.message || 'Failed to sync order to Shiprocket',
    }
  } catch (error) {
    console.warn('⚠️ Shiprocket sync unavailable:', error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}
