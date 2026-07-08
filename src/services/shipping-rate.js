/**
 * Fetch live delivery charge from Nimbuspost for checkout.
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

const DELIVERY_CGST_RATE = 0.09
const DELIVERY_SGST_RATE = 0.09

function roundMoney(amount) {
  return Math.round((Number(amount) || 0) * 100) / 100
}

/** CGST/SGST at 9% each on delivery charge only (not on product subtotal). */
export function computeDeliveryGst(deliveryPrice = 0) {
  const base = Math.max(Number(deliveryPrice) || 0, 0)
  const cgst = roundMoney(base * DELIVERY_CGST_RATE)
  const sgst = roundMoney(base * DELIVERY_SGST_RATE)
  return { cgst, sgst, deliveryGstTotal: roundMoney(cgst + sgst) }
}

export function computeOrderTotal({ subtotal, couponDiscount = 0, deliveryPrice = 0 }) {
  const { cgst, sgst, deliveryGstTotal } = computeDeliveryGst(deliveryPrice)
  const total = roundMoney(subtotal - couponDiscount + deliveryPrice + deliveryGstTotal)
  return { cgst, sgst, deliveryGstTotal, total }
}

export function formatRupee(amount) {
  const value = roundMoney(amount)
  return value % 1 === 0 ? `₹${value}` : `₹${value.toFixed(2)}`
}

export function saveDeliveryInfo(base = {}, quote = {}) {
  const deliveryData = {
    selectedDelivery: base.selectedDelivery || 'standard',
    deliveryInstructions: base.deliveryInstructions || '',
    deliveryPrice: quote.deliveryPrice ?? 0,
    courierName: quote.courierName || null,
    courierId: quote.recommendedCourierId ?? null,
    estimatedDelivery: quote.estimatedDelivery || null,
    weightKg: quote.weightKg || null,
    shippingSource: quote.skipped ? 'default' : 'nimbuspost',
    cod: Boolean(quote.cod),
  }
  localStorage.setItem('deliveryInfo', JSON.stringify(deliveryData))
  return deliveryData
}
