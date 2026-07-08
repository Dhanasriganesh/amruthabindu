/**
 * Nimbuspost Integration Service
 *
 * Pushes orders to Nimbuspost for delivery fulfillment and tracking.
 * Gracefully skips when Nimbuspost credentials are not configured.
 */

/** Strip cart fields (e.g. base64 images) that Nimbuspost does not need. */
export function slimOrderForNimbuspost(orderData) {
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
    deliveryInfo: orderData.deliveryInfo || orderData.delivery_info || null,
    errorMessage: orderData.errorMessage || orderData.error_message || null,
  }
}

export async function pushOrderToNimbuspost(orderData, { mode = 'create', courierId = null } = {}) {
  try {
    const payload = {
      ...slimOrderForNimbuspost(orderData),
      mode,
      ...(courierId ? { courierId: String(courierId) } : {}),
    }
    console.log(`📦 Pushing order to Nimbuspost (${mode}) via backend:`, payload.orderId)

    const response = await fetch('/api/push-order-to-nimbuspost', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const result = await response.json().catch(() => ({}))

    if (result.skipped) {
      console.info('ℹ️ Nimbuspost not configured — delivery sync skipped. Order is saved locally.')
      return { success: false, skipped: true, message: result.message }
    }

    if (!response.ok) {
      console.warn('⚠️ Nimbuspost sync failed:', result.error || response.status)
      return {
        success: false,
        error: result.error || `Backend API returned ${response.status}`,
      }
    }

    if (result.success) {
      console.log('✅ Order synced to Nimbuspost successfully:', result)
      return result
    }

    console.warn('⚠️ Nimbuspost sync did not complete:', result.error || result.message)
    return {
      success: false,
      error: result.error || result.message || 'Failed to sync order to Nimbuspost',
    }
  } catch (error) {
    console.warn('⚠️ Nimbuspost sync unavailable:', error.message)
    return {
      success: false,
      error: error.message,
    }
  }
}

export async function fetchCouriersForOrder(orderData) {
  const payload = slimOrderForNimbuspost(orderData)
  const response = await fetch('/api/get-order-couriers', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const result = await response.json().catch(() => ({}))
  if (!response.ok) {
    return { success: false, error: result.error || `Backend API returned ${response.status}` }
  }
  return result
}

export async function shipOrderWithNimbuspost(orderData, courierId) {
  return pushOrderToNimbuspost(orderData, { mode: 'ship', courierId })
}
