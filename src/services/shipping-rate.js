/**
 * Fetch live delivery charge from Shiprocket for checkout.
 */
export async function fetchShippingRate({
  deliveryPincode,
  cartItems = [],
  orderValue = 0,
  cod = false,
}) {
  const response = await fetch('/api/get-shipping-rate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deliveryPincode,
      cartItems: cartItems.map((item) => ({
        size: item.size,
        weight: item.weight,
        quantity: item.quantity,
      })),
      orderValue,
      cod,
    }),
  })

  const result = await response.json().catch(() => ({}))

  if (response.status === 404) {
    return {
      success: false,
      error:
        'Shipping API not found. Stop all dev servers, then run "npm run dev" (not only vite) so the API on port 3001 starts.',
    }
  }

  if (result.skipped) {
    return { success: true, deliveryPrice: 0, skipped: true }
  }

  if (!response.ok || !result.success) {
    return {
      success: false,
      error: result.error || `Could not calculate shipping (${response.status})`,
    }
  }

  return result
}

export function formatDeliveryPrice(price) {
  if (!price || price <= 0) return 'FREE'
  return `₹${price}`
}

export function saveDeliveryInfo(base = {}, quote = {}) {
  const deliveryData = {
    selectedDelivery: base.selectedDelivery || 'standard',
    deliveryInstructions: base.deliveryInstructions || '',
    deliveryPrice: quote.deliveryPrice ?? 0,
    courierName: quote.courierName || null,
    estimatedDelivery: quote.estimatedDelivery || null,
    weightKg: quote.weightKg || null,
    shippingSource: quote.skipped ? 'default' : 'shiprocket',
    cod: Boolean(quote.cod),
  }
  localStorage.setItem('deliveryInfo', JSON.stringify(deliveryData))
  return deliveryData
}
