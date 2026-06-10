import { saveOrder, updateOrderByOrderId } from './firebase-db'
import { recordCouponUsage } from './coupon-service'
import { pushOrderToShiprocket, slimOrderForShiprocket } from './shiprocket-integration'

export function isSuccessfulOrder(order) {
  if (order.error_message || order.errorMessage) return false
  if (order.payment_method === 'cod' || order.paymentMethod === 'cod') return true
  const paymentId = order.payment_id || order.paymentId
  return Boolean(paymentId && String(paymentId).trim())
}

export function buildOrderData({
  orderId,
  paymentId = '',
  items,
  totals,
  deliveryInfo,
  shippingAddress,
  paymentMethod,
  userId,
  couponCode,
  errorMessage,
}) {
  return {
    orderId,
    paymentId,
    items,
    totals,
    deliveryInfo,
    shippingAddress,
    paymentMethod,
    userId,
    couponCode,
    errorMessage,
  }
}

export async function saveOrderWithCoupon(orderData, appliedCoupon, couponDiscount) {
  await saveOrder(orderData)

  if (appliedCoupon && couponDiscount > 0) {
    await recordCouponUsage(
      appliedCoupon.id,
      orderData.userId || null,
      orderData.shippingAddress?.email || null,
      orderData.orderId,
      couponDiscount
    )
  }
}

export function syncOrderToShiprocket(orderData, orderId = orderData.orderId) {
  if (orderData.errorMessage) return Promise.resolve({ success: false, skipped: true })

  return pushOrderToShiprocket(orderData)
    .then((result) => {
      if (result.success && result.shiprocketOrderId) {
        const updates = {
          shiprocket_order_id: result.shiprocketOrderId.toString(),
          fulfillment_status: 'AWAITING_PROCESSING',
        }
        if (result.shipmentId) {
          updates.shiprocket_shipment_id = result.shipmentId.toString()
        }
        updateOrderByOrderId(orderId, updates).then(({ error }) => {
          if (error) {
            console.error('Failed to update order with Shiprocket ID:', error)
          }
        })
        window.dispatchEvent(new Event('ordersUpdated'))
      }
      return result
    })
    .catch((error) => {
      console.warn('Shiprocket sync unavailable:', error.message)
      return { success: false, error: error.message }
    })
}

export function orderDocToShiprocketPayload(order) {
  return slimOrderForShiprocket(order)
}

export async function sendOrderConfirmationEmail({
  orderId,
  paymentId,
  shippingAddress,
  cartItems,
  getCartTotal,
  deliveryPrice,
  paymentMethod,
  invoiceHtml,
}) {
  if (!shippingAddress?.email) {
    console.warn('No customer email — skipping order confirmation email')
    return
  }

  const orderItems = cartItems.map((it) => ({
    title: `${it.name} (${it.size})`,
    quantity: it.quantity,
    price: it.price,
  }))

  const address = [
    `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim(),
    shippingAddress.address,
    `${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.pincode || ''}`.trim(),
    shippingAddress.country || 'India',
    `Phone: ${shippingAddress.phone || ''}`,
  ]
    .filter(Boolean)
    .join('\n')

  const paymentLabel =
    paymentMethod === 'cod' ? 'Cash on Delivery' : paymentMethod === 'payment_link' ? 'Razorpay' : 'Razorpay'

  const emailPayload = {
    orderId,
    paymentId: paymentId || null,
    customerName:
      `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || 'Customer',
    customerEmail: shippingAddress.email,
    customerPhone: shippingAddress.phone,
    orderItems,
    orderTotal: getCartTotal() + deliveryPrice,
    subtotal: getCartTotal(),
    delivery: deliveryPrice,
    paymentMethod: paymentLabel,
    customerAddress: address,
    invoiceHtml,
  }

  const response = await fetch('/api/send-order-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(emailPayload),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.warn('Order email send failed:', errorText)
    return
  }

  console.log('Order confirmation email sent')
}
