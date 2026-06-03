import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Truck, Clock, Shield, CheckCircle, ExternalLink, Share2, Copy } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'

function CheckoutDelivery() {
  const navigate = useNavigate()
  const { items: cartItems, getCartTotal, getCartSavings } = useCart()
  const [selectedDelivery, setSelectedDelivery] = useState('standard')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [shippingAddress, setShippingAddress] = useState(null)
  const [lastLink, setLastLink] = useState('')

  const PAYMENT_PAGE_URL = import.meta.env.VITE_RZP_PAYMENT_PAGE_URL || ''
  const CREATE_LINK_ENDPOINT = import.meta.env.VITE_CREATE_LINK_ENDPOINT || '/api/razorpay/create-link'

  useEffect(() => {
    try {
      const saved = localStorage.getItem('shippingAddress')
      if (saved) setShippingAddress(JSON.parse(saved))
    } catch {}
  }, [])

  const deliveryOptions = [
    {
      id: 'standard',
      name: 'Standard Delivery',
      description: '',
      price: 0,
      icon: <Truck className="w-6 h-6" />,
      popular: false
    }
  ]

  const handleContinue = () => {
    const deliveryData = {
      selectedDelivery,
      deliveryInstructions,
      deliveryPrice: deliveryOptions.find(opt => opt.id === selectedDelivery)?.price || 0
    }
    localStorage.setItem('deliveryInfo', JSON.stringify(deliveryData))
    // Navigate to checkout payment page for Razorpay integration
    navigate('/checkout/payment')
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F5DC] via-[#FAF8F3] to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
          <p className="text-gray-600 mb-8">Please add items to your cart before checkout.</p>
          <Link
            to="/shop"
            className="bg-green-800 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    )
  }

  const selectedDeliveryOption = deliveryOptions.find(opt => opt.id === selectedDelivery)
  const deliveryPrice = selectedDeliveryOption?.price || 0
  const finalTotal = getCartTotal() + deliveryPrice

  const buildPaymentLink = () => {
    if (!PAYMENT_PAGE_URL) return ''
    const params = new URLSearchParams()
    if (shippingAddress?.email) params.set('prefill[email]', shippingAddress.email)
    if (shippingAddress?.phone) params.set('prefill[contact]', shippingAddress.phone)
    if (shippingAddress?.firstName || shippingAddress?.lastName) params.set('prefill[name]', `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim())
    params.set('amount', String(Math.max(1, Math.round(finalTotal))))
    return PAYMENT_PAGE_URL.includes('?') ? `${PAYMENT_PAGE_URL}&${params.toString()}` : `${PAYMENT_PAGE_URL}?${params.toString()}`
  }

  const openLink = () => {
    if (PAYMENT_PAGE_URL) {
      const url = buildPaymentLink()
      if (!url) { alert('Payment Page URL not configured. Set VITE_RZP_PAYMENT_PAGE_URL'); return }
      window.open(url, '_blank')
      return
    }
    // Fallback: use API-generated payment link
    createPaymentLink()
  }

  const emailLink = () => {
    const url = lastLink || buildPaymentLink()
    if (!url) return
    const to = shippingAddress?.email || ''
    const subject = encodeURIComponent('Complete your payment - Amrutha Bindu')
    const body = encodeURIComponent(`Hello ${shippingAddress?.firstName || ''},\n\nPlease complete your payment for order total ₹${finalTotal}.\nPayment link: ${url}\n\nThank you!`)
    window.location.href = `mailto:${to}?subject=${subject}&body=${body}`
  }

  const whatsappLink = () => {
    const url = lastLink || buildPaymentLink()
    if (!url) return
    const phone = (shippingAddress?.phone || '').replace(/\D/g, '')
    const text = encodeURIComponent(`Payment link for Amrutha Bindu (₹${finalTotal}): ${url}`)
    const api = phone ? `https://api.whatsapp.com/send?phone=91${phone}&text=${text}` : `https://api.whatsapp.com/send?text=${text}`
    window.open(api, '_blank')
  }

  async function createPaymentLink(silent = false) {
    try {
      const r = await fetch(CREATE_LINK_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalTotal,
          name: `${shippingAddress?.firstName || ''} ${shippingAddress?.lastName || ''}`.trim(),
          email: shippingAddress?.email,
          phone: shippingAddress?.phone,
          description: 'Order Payment',
          referenceId: `ref_${Date.now()}`
        })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data?.error || 'Failed to create link')
      setLastLink(data.payment_link)
      if (!silent) {
        window.open(data.payment_link, '_blank')
      } else {
        alert('Payment link sent automatically via Razorpay email/SMS (if enabled).')
      }
    } catch (e) {
      alert(e?.message || 'Failed to create payment link')
    }
  }

  const copyLink = async () => {
    const url = lastLink || buildPaymentLink()
    if (!url) return
    try { await navigator.clipboard.writeText(url); alert('Payment link copied'); } catch { alert(url) }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5DC] via-[#FAF8F3] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Link
            to="/checkout/address"
            className="flex items-center text-gray-600 hover:text-green-800 transition-colors mr-4"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Address
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Options</h1>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <span className="ml-2 text-sm font-medium text-gray-600">Address</span>
            </div>
            <div className="w-16 h-1 bg-green-800"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-green-800">Delivery</span>
            </div>
            {/* Payment step removed (link flow) */}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Delivery Options */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Truck className="w-6 h-6 mr-2 text-green-800" />
                Choose Delivery Option
              </h2>

              <div className="space-y-4 mb-8">
                {deliveryOptions.map((option) => (
                  <div
                    key={option.id}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedDelivery === option.id
                        ? 'border-green-800 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedDelivery(option.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          selectedDelivery === option.id ? 'bg-green-800 text-white' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {option.icon}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900">{option.name}</h3>
                            {option.popular && (
                              <span className="bg-green-800 text-white text-xs px-2 py-1 rounded-full">
                                Popular
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600">{option.description}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {option.price === 0 ? 'FREE' : `₹${option.price}`}
                        </div>
                        {selectedDelivery === option.id && (
                          <CheckCircle className="w-5 h-5 text-green-800 ml-auto mt-1" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery Instructions */}
              <div className="mb-8">
                <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">
                  Delivery Instructions (Optional)
                </label>
                <textarea
                  id="instructions"
                  value={deliveryInstructions}
                  onChange={(e) => setDeliveryInstructions(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Any special instructions for delivery..."
                />
              </div>

              {/* Delivery Info */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Delivery Information</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• We deliver to all major cities across India</li>
                  <li>• Orders are processed within 24 hours</li>
                  <li>• You will receive SMS updates about your order</li>
                  <li>• Free returns within 30 days</li>
                </ul>
              </div>

              <div className="grid sm:grid-cols-2 gap-3 mt-6">
                <button
                  onClick={handleContinue}
                  className="w-full bg-green-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors"
                >
                  Continue to Payment
                </button>
               
              </div>

              {PAYMENT_PAGE_URL && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md sticky top-4">
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Order Summary</h2>
                
                {/* Cart Items */}
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
                        <p className="text-sm text-gray-600">{item.size}</p>
                        <p className="text-sm font-semibold text-green-800">
                          ₹{item.price} × {item.quantity}
                        </p>
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
                      {deliveryPrice === 0 ? (
                        <span className="text-green-600">FREE</span>
                      ) : (
                        `₹${deliveryPrice}`
                      )}
                    </span>
                  </div>
                  
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>₹{finalTotal}</span>
                    </div>
                  </div>
                </div>

                {/* Delivery Details */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Selected Delivery</h3>
                  <p className="text-sm text-gray-600">{selectedDeliveryOption?.name}</p>
                  <p className="text-sm text-gray-600">{selectedDeliveryOption?.description}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CheckoutDelivery
