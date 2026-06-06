/**
 * Order Tracking Service
 * Functions to update and sync order statuses with Shiprocket
 */

async function parseJsonResponse(response, action) {
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text()
    console.error('❌ Non-JSON response:', text.substring(0, 200))
    throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}. Make sure backend server is running.`)
  }

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || `Failed to ${action}: ${response.status}`)
  }

  return response.json()
}

export async function checkTrackingStatus() {
  try {
    console.log('🔄 Checking tracking status from Shiprocket...')

    const response = await fetch('/api/check-shiprocket-tracking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await parseJsonResponse(response, 'check tracking')

    if (result.skipped) {
      console.info('ℹ️ Shiprocket not configured — tracking sync skipped')
      return result
    }

    console.log('✅ Tracking check complete:', result)
    return result
  } catch (error) {
    console.error('❌ Failed to check tracking:', error)
    throw error
  }
}

export async function updateOrderStatus(orderId, status, trackingNumber = null) {
  try {
    console.log('🔄 Updating order status:', { orderId, status, trackingNumber })

    const response = await fetch('/api/update-order-status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        status,
        trackingNumber,
      }),
    })

    const result = await parseJsonResponse(response, 'update status')
    console.log('✅ Order status updated:', result)
    return result
  } catch (error) {
    console.error('❌ Failed to update order status:', error)
    throw error
  }
}
