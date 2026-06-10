/**
 * Shiprocket Integration Service
 *
 * Pushes orders to Shiprocket for delivery fulfillment and tracking.
 * Gracefully skips when Shiprocket credentials are not configured.
 */

/** Strip cart fields (e.g. base64 images) that Shiprocket does not need. */
export function slimOrderForShiprocket(orderData) {
  const shipping = orderData.shippingAddress || orderData.shipping_address || {}

  return {
    orderId: orderData.orderId || orderData.order_id,
    items: (orderData.items || []).map((item) => ({
      id: item.id,
      name: item.name,
      size: item.size,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
    })),
    totals: orderData.totals || {},
    shippingAddress: {
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      email: shipping.email,
      phone: shipping.phone,
      address: shipping.address,
      city: shipping.city,
      state: shipping.state,
      pincode: shipping.pincode,
      country: shipping.country,
    },
    paymentMethod: orderData.paymentMethod || orderData.payment_method,
    couponCode: orderData.couponCode || orderData.coupon_code || null,
    errorMessage: orderData.errorMessage || orderData.error_message || null,
  }
}

export async function pushOrderToShiprocket(orderData) {
  try {
    const payload = slimOrderForShiprocket(orderData)
    console.log('📦 Pushing order to Shiprocket via backend:', payload.orderId)

    const response = await fetch('/api/push-order-to-shiprocket', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
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
