import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CreditCard, Shield } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useCoupon } from '../../contexts/CouponContext'
import { useAuth } from '../../contexts/AuthContext'
import { saveOrder } from '../../services/db'
import {
  buildOrderData,
  saveOrderWithCoupon,
  sendOrderConfirmationEmail,
} from '../../services/order-completion'
import { fetchShippingRate, saveDeliveryInfo, formatDeliveryPrice, computeOrderTotal, formatRupee } from '../../services/shipping-rate'
import { SUPPORT_EMAIL } from '../../config/brand'

function CheckoutPayment() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { items: cartItems, getCartTotal, getCartSavings, clearCart } = useCart()
  const { appliedCoupon, getDiscountAmount } = useCoupon()
  const [isProcessing, setIsProcessing] = useState(false)
  const [deliveryInfo, setDeliveryInfo] = useState(null)
  const [shippingAddress, setShippingAddress] = useState(null)
  const [updatingDeliveryRate, setUpdatingDeliveryRate] = useState(false)

  const RZP_KEY_ID =
    import.meta.env.VITE_RAZORPAY_KEY_ID || import.meta.env.VITE_RZP_KEY_ID || ''
  const PAYMENT_PAGE_URL = import.meta.env.VITE_RZP_PAYMENT_PAGE_URL || ''

  useEffect(() => {
    const savedDeliveryInfo = localStorage.getItem('deliveryInfo')
    if (savedDeliveryInfo) setDeliveryInfo(JSON.parse(savedDeliveryInfo))
    const savedAddress = localStorage.getItem('shippingAddress')
    if (savedAddress) setShippingAddress(JSON.parse(savedAddress))
  }, [])

  useEffect(() => {
    if (!shippingAddress?.pincode || cartItems.length === 0) return

    let cancelled = false
    async function refreshPrepaidDeliveryRate() {
      setUpdatingDeliveryRate(true)
      try {
        const result = await fetchShippingRate({
          deliveryPincode: shippingAddress.pincode,
          cartItems,
          orderValue: getCartTotal(),
          cod: false,
        })

        if (cancelled || !result.success) return

        const updated = saveDeliveryInfo(
          {
            selectedDelivery: deliveryInfo?.selectedDelivery || 'standard',
            deliveryInstructions: deliveryInfo?.deliveryInstructions || '',
          },
          { ...result, cod: false }
        )
        setDeliveryInfo(updated)
      } catch (error) {
        console.warn('Could not refresh delivery rate:', error.message)
      } finally {
        if (!cancelled) setUpdatingDeliveryRate(false)
      }
    }

    refreshPrepaidDeliveryRate()
    return () => {
      cancelled = true
    }
  }, [shippingAddress?.pincode, cartItems, getCartTotal])

  const amountPaise = () => {
    const couponDiscount = getDiscountAmount(getCartTotal())
    const { total } = computeOrderTotal({
      subtotal: getCartTotal(),
      couponDiscount,
      deliveryPrice: deliveryInfo?.deliveryPrice || 0,
    })
    return Math.round(Math.max(total, 0) * 100)
  }

  const getFinalTotal = () => {
    const couponDiscount = getDiscountAmount(getCartTotal())
    return computeOrderTotal({
      subtotal: getCartTotal(),
      couponDiscount,
      deliveryPrice: deliveryInfo?.deliveryPrice || 0,
    }).total
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  const buildInvoiceHtml = (orderId, paymentId) => {
    const rows = cartItems.map(it => `<tr><td>${it.name} (${it.size})${it.sku ? `<br/><small>SKU: ${it.sku}</small>` : ''}</td><td>${it.quantity}</td><td>₹${it.price}</td><td>₹${it.price * it.quantity}</td></tr>`).join('')
    const deliv = deliveryInfo?.deliveryPrice || 0
    const { cgst, sgst, total } = computeOrderTotal({
      subtotal: getCartTotal(),
      deliveryPrice: deliv,
    })
    const subtotal = getCartTotal()
    const savings = getCartSavings()
    
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 0.3in; size: A4; }
        body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.3; margin: 0; padding: 0; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #8B7355; padding-bottom: 10px; }
        .logo { width: 60px; height: 60px; }
        .company-info { text-align: right; }
        .company-name { font-size: 16px; font-weight: bold; color: #8B7355; margin: 0; }
        .company-tagline { font-size: 8px; color: #666; margin: 0; }
        .invoice-title { font-size: 20px; font-weight: bold; color: #8B7355; text-align: center; margin: 15px 0; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
        .detail-section h3 { font-size: 12px; color: #8B7355; margin: 0 0 8px 0; border-bottom: 1px solid #8B7355; padding-bottom: 3px; }
        .detail-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 9px; }
        .detail-label { font-weight: bold; }
        .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 9px; }
        .items-table th { background: #8B7355; color: white; padding: 8px; text-align: left; font-weight: bold; }
        .items-table td { padding: 6px; border: 1px solid #ddd; }
        .items-table tr:nth-child(even) { background: #f9f9f9; }
        .totals { margin-top: 15px; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 10px; }
        .total-row.final { border-top: 2px solid #8B7355; padding-top: 8px; font-weight: bold; font-size: 12px; color: #8B7355; }
        .footer { margin-top: 20px; text-align: center; font-size: 8px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="Logo" class="logo">
        <div class="company-info">
            <h1 class="company-name">AMRUTHA BINDU</h1>
            <p class="company-tagline">100% HAND-MADE • Traditional Self-Care Products</p>
        </div>
    </div>
    
    <div class="invoice-title">INVOICE</div>
    
    <div class="details-grid">
        <div class="detail-section">
            <h3>Invoice Details</h3>
            <div class="detail-row"><span class="detail-label">Invoice No:</span><span>${orderId}</span></div>
            <div class="detail-row"><span class="detail-label">Payment ID:</span><span>${paymentId || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">Date:</span><span>${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
            <div class="detail-row"><span class="detail-label">Payment Method:</span><span>Razorpay</span></div>
        </div>
        
        <div class="detail-section">
            <h3>Customer Details</h3>
            <div class="detail-row"><span class="detail-label">Name:</span><span>${shippingAddress ? `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() : 'Customer'}</span></div>
            <div class="detail-row"><span class="detail-label">Email:</span><span>${shippingAddress?.email || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">Phone:</span><span>${shippingAddress?.phone || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">Address:</span><span>${shippingAddress ? `${shippingAddress.address || ''}, ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.pincode || ''}`.trim() : 'N/A'}</span></div>
        </div>
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${rows}
        </tbody>
    </table>
    
    <div class="totals">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${subtotal}</span>
        </div>
        <div class="total-row">
            <span>Savings:</span>
            <span>-₹${savings}</span>
        </div>
        <div class="total-row">
            <span>Delivery Charges:</span>
            <span>₹${deliv}</span>
        </div>
        <div class="total-row">
            <span>CGST (9% on delivery):</span>
            <span>₹${cgst.toFixed(2)}</span>
        </div>
        <div class="total-row">
            <span>SGST (9% on delivery):</span>
            <span>₹${sgst.toFixed(2)}</span>
        </div>
        <div class="total-row final">
            <span>Grand Total:</span>
            <span>₹${total % 1 === 0 ? total : total.toFixed(2)}</span>
        </div>
    </div>
    
    <div class="footer">
        <p>Thank you for choosing Amrutha Bindu!</p>
        <p>For any queries, contact us at: ${SUPPORT_EMAIL}</p>
    </div>
</body>
</html>`
  }

  const generateInvoiceDownload = (orderId, paymentId) => {
    const html = buildInvoiceHtml(orderId, paymentId)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Invoice_${orderId}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    return html
  }

  const handlePayment = async () => {
    const amt = amountPaise()
    if (!deliveryInfo) {
      alert('Please complete your shipping address first')
      navigate('/checkout/address')
      return
    }
    if (!amt || amt < 100) {
      alert('Order amount must be at least ₹1.00')
      return
    }

    if (!RZP_KEY_ID) {
      alert('Razorpay is not configured. Set VITE_RAZORPAY_KEY_ID in your environment.')
      return
    }

    setIsProcessing(true)

    try {
      const ok = await loadRazorpayScript()
      if (!ok) throw new Error('Razorpay SDK failed to load')

      const orderRes = await fetch('/api/razorpay/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amt, receipt: `order_${Date.now()}` }),
      })

      if (!orderRes.ok) {
        const err = await orderRes.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create payment order. Is the backend server running on port 3001?')
      }

      const orderData = await orderRes.json()
      const razorpayOrderId = orderData.order_id || orderData.orderId

      const options = {
        key: RZP_KEY_ID,
        amount: amt,
        currency: 'INR',
        order_id: razorpayOrderId,
        name: 'Amrutha Bindu',
        description: 'Order Payment',
        prefill: shippingAddress ? {
          name: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || undefined,
          email: shippingAddress.email || undefined,
          contact: shippingAddress.phone || undefined,
        } : undefined,
        notes: shippingAddress ? { address: shippingAddress.address } : undefined,
        retry: { enabled: true, max_count: 1 },
        theme: { color: '#15803d' },
        modal: { 
          ondismiss: function() { 
            console.log('⚠️ User closed Razorpay modal without completing payment')
            handlePaymentFailed({}, 'Payment cancelled - modal closed')
            setIsProcessing(false)
          } 
        },
        handler: function (response) {
          handlePaymentSuccess(response)
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (resp) {
        console.error('Razorpay payment.failed:', resp?.error)
        const desc = resp?.error?.description || ''
        const reason = resp?.error?.reason || ''
        const errorMsg = desc || reason || 'Payment failed. Please try again.'

        if (desc.toLowerCase().includes('international cards are not supported')) {
          alert(
            'Card rejected by Razorpay (flagged as international).\n\n' +
            'Try these test options:\n' +
            '1. Netbanking — pick any bank, then click Success on the test page (easiest)\n' +
            '2. Mastercard domestic: 5267 3181 8797 5449, CVV 123, any future expiry\n' +
            '3. Visa domestic: 4111 1111 1111 1111 (no spaces), CVV 123\n\n' +
            'Or in Razorpay Dashboard → Account & Settings → International Payments → enable temporarily for testing.'
          )
        } else {
          alert(errorMsg)
        }
        
        // Send failed payment emails
        handlePaymentFailed(resp, errorMsg)
        setIsProcessing(false)
      })
      
      rzp.on('payment.cancelled', function (resp) {
        console.log('Payment cancelled by user')
        // Send cancelled payment emails
        handlePaymentFailed(resp, 'Payment cancelled by user')
        setIsProcessing(false)
      })
      rzp.open()
    } catch (e) {
      const errorMsg = e?.message || 'Payment failed. Please try again.'
      alert(errorMsg)
      
      // Send failed payment emails for general errors
      handlePaymentFailed({}, errorMsg)
      setIsProcessing(false)
    }
  }

  const openPaymentPage = () => {
    const amt = amountPaise()
    if (!amt || amt < 100) {
      alert('Order amount must be at least ₹1.00')
      return
    }
    if (!PAYMENT_PAGE_URL) {
      alert('Payment Page URL not configured. Set VITE_RZP_PAYMENT_PAGE_URL')
      return
    }
    const params = new URLSearchParams()
    if (shippingAddress?.email) params.set('prefill[email]', shippingAddress.email)
    if (shippingAddress?.phone) params.set('prefill[contact]', shippingAddress.phone)
    if (shippingAddress?.firstName || shippingAddress?.lastName) params.set('prefill[name]', `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim())
    params.set('amount', String(Math.max(1, Math.round(amt / 100))))
    const url = PAYMENT_PAGE_URL.includes('?') ? `${PAYMENT_PAGE_URL}&${params.toString()}` : `${PAYMENT_PAGE_URL}?${params.toString()}`
    window.open(url, '_blank')
  }

  const handlePaymentFailed = async (response, errorMsg) => {
    console.log('⚠️ PAYMENT FAILED/CANCELLED:', errorMsg)
    
    const deliv = deliveryInfo?.deliveryPrice || 0
    const orderId = response?.razorpay_order_id || `failed_order_${Date.now()}`
    const couponDiscount = getDiscountAmount(getCartTotal())
    const { cgst, sgst, deliveryGstTotal, total } = computeOrderTotal({
      subtotal: getCartTotal(),
      couponDiscount,
      deliveryPrice: deliv,
    })
    
    console.log('📋 Preparing failed order data...')
    console.log('Shipping Address:', shippingAddress)
    console.log('Cart Items:', cartItems)
    
    // Prepare failed order data for database tracking
    const failedOrderData = {
      orderId,
      paymentId: response?.razorpay_payment_id || null,
      items: cartItems,
      totals: {
        subtotal: getCartTotal(),
        savings: getCartSavings(),
        couponDiscount: couponDiscount,
        delivery: deliv,
        deliveryCgst: cgst,
        deliverySgst: sgst,
        deliveryGstTotal,
        total,
      },
      deliveryInfo: deliveryInfo || null,
      shippingAddress: shippingAddress || null,
      paymentMethod: 'razorpay',
      userId: currentUser?.id || null,
      couponCode: appliedCoupon?.code || null,
      errorMessage: errorMsg
    }
    
    console.log('💾 Saving failed payment to database...')
    
    // Save failed order to Supabase (for Leads tracking)
    try {
      const savedOrder = await saveOrder(failedOrderData)
      console.log('✅ Failed payment saved to database for leads tracking!', savedOrder)
      console.log('📍 Go to Admin → Leads to see this!')
    } catch (error) {
      console.error('❌ Failed to save failed payment to database:', error)
      console.error('Error details:', error.message)
    }

    try {
      console.log('📧 CLIENT: Starting failed payment email process...')
      
      // Check if customer email is available
      if (!shippingAddress?.email) {
        console.warn('⚠️ CLIENT: No customer email found, skipping failed payment email notification')
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
        paymentId: response?.razorpay_payment_id || null,
        customerName: `${shippingAddress?.firstName || ''} ${shippingAddress?.lastName || ''}`.trim() || 'Customer',
        customerEmail: shippingAddress?.email,
        customerPhone: shippingAddress?.phone,
        orderItems,
        orderTotal: total,
        subtotal: getCartTotal(),
        delivery: deliv,
        deliveryCgst: cgst,
        deliverySgst: sgst,
        paymentMethod: 'Razorpay',
        customerAddress: address,
        paymentStatus: 'FAILED',
        errorMessage: errorMsg,
      }
      
      console.log('📧 CLIENT: Failed payment email payload:', {
        orderId: emailPayload.orderId,
        customerEmail: emailPayload.customerEmail,
        orderTotal: emailPayload.orderTotal,
        paymentStatus: emailPayload.paymentStatus
      })

      console.log('📧 CLIENT: Fetching /api/send-failed-payment-email...')
      const r = await fetch('/api/send-failed-payment-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailPayload)
      })
      
      console.log('📧 CLIENT: Failed payment email response status:', r.status)
      
      if (!r.ok) {
        const errorText = await r.text()
        console.warn('❌ CLIENT: Failed payment email send failed:', errorText)
      } else {
        const result = await r.json()
        console.log('✅ CLIENT: Failed payment email sent successfully!', result)
      }
    } catch (emailError) {
      console.error('❌ CLIENT: Failed to send failed payment email:', emailError)
      console.error('❌ CLIENT: Error details:', emailError.message)
    }
  }

  const finalizeSuccessfulOrder = async ({
    orderId,
    paymentId,
    method,
    paymentMethodLabel,
    successMessage,
  }) => {
    const deliv = deliveryInfo?.deliveryPrice || 0
    const couponDiscount = getDiscountAmount(getCartTotal())
    const { cgst, sgst, deliveryGstTotal, total } = computeOrderTotal({
      subtotal: getCartTotal(),
      couponDiscount,
      deliveryPrice: deliv,
    })

    const orderData = buildOrderData({
      orderId,
      paymentId,
      items: cartItems,
      totals: {
        subtotal: getCartTotal(),
        savings: getCartSavings(),
        couponDiscount,
        delivery: deliv,
        deliveryCgst: cgst,
        deliverySgst: sgst,
        deliveryGstTotal,
        total,
      },
      deliveryInfo: deliveryInfo || null,
      shippingAddress: shippingAddress || null,
      paymentMethod: method,
      userId: currentUser?.id || null,
      couponCode: appliedCoupon?.code || null,
    })

    try {
      const saveResult = await saveOrderWithCoupon(orderData, appliedCoupon, couponDiscount)
      if (saveResult?.success === false && !saveResult?.skipped && saveResult?.error) {
        console.warn('⚠️ Order saved but Nimbuspost sync failed:', saveResult.error)
      }
    } catch (error) {
      console.error('Failed to save order to Firebase:', error)
      alert(
        `Your payment was received but we could not save the order.\n\n${error.message}\n\nOrder reference: ${orderId}\n\nPlease contact support with this reference.`
      )
      return
    }

    const invoiceHtml = generateInvoiceDownload(orderId, paymentId)

    try {
      await sendOrderConfirmationEmail({
        orderId,
        paymentId,
        shippingAddress,
        cartItems,
        getCartTotal,
        deliveryPrice: deliv,
        deliveryCgst: cgst,
        deliverySgst: sgst,
        orderTotal: total,
        paymentMethod: method,
        invoiceHtml,
      })
    } catch (emailError) {
      console.error('Failed to send order email:', emailError)
    }

    clearCart()
    localStorage.removeItem('shippingAddress')
    localStorage.removeItem('deliveryInfo')
    alert(successMessage)
    const itemsForSuccess = cartItems.map((it) => ({
      name: it.name,
      size: it.size,
      price: it.price,
      quantity: it.quantity,
      image: it.image || null,
    }))
    navigate('/order-success', {
      state: { paymentId, orderId, items: itemsForSuccess, paymentMethod: paymentMethodLabel },
    })
  }

  const handlePaymentSuccess = async (response) => {
    setIsProcessing(true)
    try {
      const verifyRes = await fetch('/api/razorpay/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      })

      if (!verifyRes.ok) {
        const err = await verifyRes.json().catch(() => ({}))
        throw new Error(err.error || 'Payment verification failed. Your payment was not confirmed.')
      }

      const orderId = response.razorpay_order_id || `order_${Date.now()}`
      await finalizeSuccessfulOrder({
        orderId,
        paymentId: response.razorpay_payment_id,
        method: 'razorpay',
        paymentMethodLabel: 'Razorpay',
        successMessage: 'Payment successful! Invoice downloaded.',
      })
    } catch (error) {
      console.error('Payment verification failed:', error)
      alert(error?.message || 'Payment verification failed. Please contact support if you were charged.')
      handlePaymentFailed(response, error?.message || 'Payment verification failed')
    } finally {
      setIsProcessing(false)
    }
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F5DC] via-[#FAF8F3] to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Please add items to your cart before checkout.</p>
          <Link to="/shop" className="bg-green-800 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">Continue Shopping</Link>
        </div>
      </div>
    )
  }

  const delivPrice = deliveryInfo?.deliveryPrice || 0
  const { cgst, sgst, total: finalTotal } = computeOrderTotal({
    subtotal: getCartTotal(),
    deliveryPrice: delivPrice,
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5DC] via-[#FAF8F3] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center mb-8">
          <Link to="/checkout/address" className="flex items-center text-gray-600 hover:text-green-800 transition-colors mr-4">
            <ArrowLeft size={20} className="mr-2" />
            Back to Address
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Payment</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Pay Online</h2>
              <p className="text-gray-600 mb-6">UPI, cards, and netbanking via Razorpay</p>

              <div className="bg-green-50 p-4 rounded-lg mb-6">
                <div className="flex items-start space-x-3">
                  <Shield className="w-6 h-6 text-green-800 mt-1" />
                  <div>
                    <h3 className="font-semibold text-green-900 mb-2">Secure Payment</h3>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• Encrypted payment via Razorpay</li>
                      <li>• We never store your payment details</li>
                      {RZP_KEY_ID.startsWith('rzp_test_') && (
                        <li>• Test mode: use <strong>Netbanking</strong> (pick any bank → Success) if cards fail</li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>

              <button onClick={handlePayment} disabled={isProcessing} className="w-full bg-green-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
                <CreditCard className="w-5 h-5 mr-2" />
                {isProcessing ? 'Processing…' : 'Pay Now'}
              </button>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md sticky top-4">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={`${item.id}-${item.size}`} className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-gray-400 text-[10px] leading-tight text-center px-1">
                            <div className="font-medium truncate max-w-[48px]">{item.name}</div>
                        </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">{item.name}</h4>
                        <p className="text-sm text-gray-600">{item.size}{item.sku ? ` · SKU: ${item.sku}` : ''}</p>
                        <p className="text-sm font-semibold text-green-800">₹{item.price} × {item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">₹{getCartTotal()}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>You Save:</span>
                    <span className="font-medium">₹{getCartSavings()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery:</span>
                    <span className="font-medium">
                      {updatingDeliveryRate ? (
                        <span className="text-gray-500">Updating…</span>
                      ) : delivPrice === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        formatDeliveryPrice(delivPrice)
                      )}
                    </span>
                  </div>
                  {delivPrice > 0 && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-600">CGST (9%):</span>
                        <span className="font-medium">{formatRupee(cgst)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">SGST (9%):</span>
                        <span className="font-medium">{formatRupee(sgst)}</span>
                      </div>
                    </>
                  )}
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{formatRupee(finalTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPayment
