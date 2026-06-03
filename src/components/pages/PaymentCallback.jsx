import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { saveOrder } from '../../services/db'
import { useCart } from '../../contexts/CartContext'
import { useCoupon } from '../../contexts/CouponContext'
import { useAuth } from '../../contexts/AuthContext'
import { recordCouponUsage } from '../../services/coupon-service'
import { pushOrderToEcwid } from '../../services/ecwid-integration'

function PaymentCallback() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { items: cartItems, getCartTotal, getCartSavings, clearCart } = useCart()
  const { appliedCoupon, getDiscountAmount } = useCoupon()
  const [status, setStatus] = useState('Processing payment...')

  useEffect(() => {
    async function finalize() {
      try {
        const params = new URLSearchParams(window.location.search)
        const paymentId = params.get('razorpay_payment_id') || params.get('payment_id') || null
        const orderId = params.get('razorpay_order_id') || params.get('order_id') || `order_${Date.now()}`
        const deliveryInfo = JSON.parse(localStorage.getItem('deliveryInfo') || 'null')
        const shippingAddress = JSON.parse(localStorage.getItem('shippingAddress') || 'null')
        const deliv = deliveryInfo?.deliveryPrice || 0
        const couponDiscount = getDiscountAmount(getCartTotal())

        // Prepare order data for both Supabase and Ecwid
        const orderData = {
          orderId,
          paymentId,
          items: cartItems,
          totals: {
            subtotal: getCartTotal(),
            savings: getCartSavings(),
            couponDiscount: couponDiscount,
            delivery: deliv,
            total: getCartTotal() - couponDiscount + deliv,
          },
          deliveryInfo: deliveryInfo || null,
          shippingAddress: shippingAddress || null,
          paymentMethod: 'payment_link',
          userId: currentUser?.id || null,
          couponCode: appliedCoupon?.code || null,
        }

        try {
          // Save to Supabase
          await saveOrder(orderData)

          // Record coupon usage if coupon was applied
          if (appliedCoupon && couponDiscount > 0) {
            await recordCouponUsage(
              appliedCoupon.id,
              currentUser?.id || null,
              shippingAddress?.email || null,
              orderId,
              couponDiscount
            )
          }
        } catch (error) {
          console.error('Failed to save order to Supabase:', error)
          // Continue with email and invoice even if Supabase fails
        }

        // Push order to Ecwid (fire-and-forget)
        pushOrderToEcwid(orderData)
          .then(result => {
            if (result.success) {
              console.log('✅ CALLBACK: Order synced to Ecwid:', result)
            } else {
              console.warn('⚠️ CALLBACK: Failed to sync to Ecwid:', result.error)
            }
          })
          .catch(error => {
            console.error('❌ CALLBACK: Error syncing to Ecwid:', error)
          })
        // Build invoice HTML and trigger download
        try {
          const rows = cartItems.map(it => `<tr><td>${it.name} (${it.size})</td><td>${it.quantity}</td><td>₹${it.price}</td><td>₹${it.price * it.quantity}</td></tr>`).join('')
          const invoiceHtml = `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${orderId}</title>
            <style>body{font-family:Arial,sans-serif;padding:24px;color:#111}h1{font-size:20px;margin:0 0 8px}
            table{width:100%;border-collapse:collapse;margin-top:12px}th,td{border:1px solid #ddd;padding:8px;font-size:12px;text-align:left}
            .totals{margin-top:12px;font-size:14px}</style></head><body>
            <h1>Amrutha Bindu - Invoice</h1>
            <div>Order ID: <strong>${orderId}</strong></div>
            <div>Payment ID: <strong>${paymentId || '-'}</strong></div>
            <table><thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${rows}</tbody></table>
            <div class="totals"> 
              <div>Subtotal: ₹${getCartTotal()}</div>
              <div>Savings: ₹${getCartSavings()}</div>
              <div>Delivery: ₹${deliv}</div>
              <div><strong>Grand Total: ₹${getCartTotal() + deliv}</strong></div>
            </div>
          </body></html>`
          const blob = new Blob([invoiceHtml], { type: 'text/html' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `invoice_${orderId}.html`
          document.body.appendChild(a)
          a.click()
          a.remove()
          URL.revokeObjectURL(url)

          // Email customer and admin with attachment
          try {
            console.log('📧 CALLBACK: Starting email send process...')
            
            // Check if customer email is available
            if (!shippingAddress?.email) {
              console.warn('⚠️ CALLBACK: No customer email found, skipping email notification')
              console.warn('⚠️ CALLBACK: Shipping address:', shippingAddress)
              return
            }
            
            const orderItems = cartItems.map(it => ({ title: `${it.name} (${it.size})`, quantity: it.quantity, price: it.price }))
            const address = shippingAddress ? [
              `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim(),
              shippingAddress.address,
              `${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.pincode || ''}`.trim(),
              shippingAddress.country || 'India',
              `Phone: ${shippingAddress.phone || ''}`
            ].filter(Boolean).join('\n') : ''
            
            const emailPayload = {
              orderId,
              paymentId,
              customerName: `${shippingAddress?.firstName || ''} ${shippingAddress?.lastName || ''}`.trim() || 'Customer',
              customerEmail: shippingAddress?.email,
              customerPhone: shippingAddress?.phone,
              orderItems,
              orderTotal: getCartTotal() + deliv,
              subtotal: getCartTotal(),
              delivery: deliv,
              paymentMethod: 'Razorpay',
              customerAddress: address,
              invoiceHtml,
            }
            
            console.log('📧 CALLBACK: Email payload:', {
              orderId: emailPayload.orderId,
              customerEmail: emailPayload.customerEmail,
              orderTotal: emailPayload.orderTotal,
              itemCount: emailPayload.orderItems.length
            })
            
            console.log('📧 CALLBACK: Fetching /api/send-order-email...')
            const r = await fetch('/api/send-order-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(emailPayload)
            })
            
            console.log('📧 CALLBACK: Response status:', r.status)
            
            if (!r.ok) {
              const errorText = await r.text()
              console.warn('❌ CALLBACK: Email send failed:', errorText)
            } else {
              const result = await r.json()
              console.log('✅ CALLBACK: Email sent successfully!', result)
            }
          } catch (emailError) {
            console.error('❌ CALLBACK: Failed to send email:', emailError)
            console.error('❌ CALLBACK: Error details:', emailError.message)
          }

          clearCart()
          localStorage.removeItem('shippingAddress')
          localStorage.removeItem('deliveryInfo')
          setStatus('Payment confirmed. Redirecting...')
          const itemsForSuccess = cartItems.map(it => ({ name: it.name, size: it.size, price: it.price, quantity: it.quantity, image: it.image || null }))
          setTimeout(() => navigate('/order-success', { state: { paymentId, orderId, items: itemsForSuccess } }), 800)
        } catch (invoiceError) {
          console.error('❌ CALLBACK: Failed to generate invoice:', invoiceError)
          // Continue with cleanup even if invoice fails
          clearCart()
          localStorage.removeItem('shippingAddress')
          localStorage.removeItem('deliveryInfo')
          setStatus('Payment confirmed. Redirecting...')
          const itemsForSuccess = cartItems.map(it => ({ name: it.name, size: it.size, price: it.price, quantity: it.quantity, image: it.image || null }))
          setTimeout(() => navigate('/order-success', { state: { paymentId, orderId, items: itemsForSuccess } }), 800)
        }
      } catch (error) {
        console.error('Payment processing failed:', error)
        setStatus('Failed to record payment. You can contact support if funds were captured.')
      }
    }
    finalize()
  }, [cartItems, clearCart, getCartSavings, getCartTotal, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{status}</h1>
        <p className="text-gray-600">Please wait...</p>
      </div>
    </div>
  )
}

export default PaymentCallback


