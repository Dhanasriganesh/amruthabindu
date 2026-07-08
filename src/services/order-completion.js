import { saveOrder, updateOrderByOrderId } from './firebase-db'
import { recordCouponUsage } from './coupon-service'
import { pushOrderToNimbuspost, slimOrderForNimbuspost } from './nimbuspost-integration'

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

  if (isSuccessfulOrder(orderData)) {
    const syncResult = await syncOrderToNimbuspost(orderData, orderData.orderId)
    if (syncResult.success) {
      console.log('✅ Order auto-synced to Nimbuspost:', orderData.orderId)
    } else if (!syncResult.skipped) {
      console.warn('⚠️ Nimbuspost auto-sync failed:', orderData.orderId, syncResult.error || syncResult.message)
    }
    return syncResult
  }

  return { success: false, skipped: true }
}

export async function syncOrderToNimbuspost(orderData, orderId = orderData.orderId) {
  if (orderData.errorMessage) return { success: false, skipped: true }

  try {
    const result = await pushOrderToNimbuspost(orderData, { mode: 'create' })

    if (result.success && result.nimbuspostOrderId) {
      const updates = {
        nimbuspost_order_id: result.nimbuspostOrderId.toString(),
        nimbuspost_sync_status: result.booked ? 'booked' : 'synced',
        nimbuspost_sync_error: null,
        fulfillment_status: result.booked ? 'SHIPPED' : 'AWAITING_PROCESSING',
      }
      if (result.shipmentId) {
        updates.nimbuspost_shipment_id = result.shipmentId.toString()
      }
      if (result.booked && result.awbNumber) {
        updates.tracking_number = result.awbNumber.toString()
      }
      const { error } = await updateOrderByOrderId(orderId, updates)
      if (error) {
        console.error('Failed to update order with Nimbuspost ID:', error)
      }
      window.dispatchEvent(new Event('ordersUpdated'))
    } else if (!result.skipped && result.error) {
      await updateOrderByOrderId(orderId, {
        nimbuspost_sync_status: 'failed',
        nimbuspost_sync_error: result.error,
      }).catch(() => {})
    }

    return result
  } catch (error) {
    console.warn('Nimbuspost sync unavailable:', error.message)
    return { success: false, error: error.message }
  }
}

export function orderDocToNimbuspostPayload(order) {
  return slimOrderForNimbuspost(order)
}

export async function sendOrderConfirmationEmail({
  orderId,
  paymentId,
  shippingAddress,
  cartItems,
  getCartTotal,
  deliveryPrice,
  deliveryCgst = 0,
  deliverySgst = 0,
  orderTotal,
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
    orderTotal: orderTotal ?? getCartTotal() + deliveryPrice,
    subtotal: getCartTotal(),
    delivery: deliveryPrice,
    deliveryCgst,
    deliverySgst,
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
