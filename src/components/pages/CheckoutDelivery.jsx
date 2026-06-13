import React, { useEffect, useState, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Truck, CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { fetchShippingRate, formatDeliveryPrice, saveDeliveryInfo } from '../../services/shipping-rate'

function CheckoutDelivery() {
  const navigate = useNavigate()
  const { items: cartItems, getCartTotal, getCartSavings } = useCart()
  const [deliveryInstructions, setDeliveryInstructions] = useState('')
  const [shippingAddress, setShippingAddress] = useState(null)
  const [deliveryQuote, setDeliveryQuote] = useState(null)
  const [loadingRate, setLoadingRate] = useState(false)
  const [rateError, setRateError] = useState(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('shippingAddress')
      if (saved) setShippingAddress(JSON.parse(saved))
    } catch {}
  }, [])

  const loadShippingRate = useCallback(async () => {
    if (!shippingAddress?.pincode || cartItems.length === 0) return

    setLoadingRate(true)
    setRateError(null)

    try {
      const result = await fetchShippingRate({
        deliveryPincode: shippingAddress.pincode,
        cartItems,
        orderValue: getCartTotal(),
        cod: false,
      })

      if (result.success) {
        setDeliveryQuote(result)
      } else {
        setRateError(result.error || 'Could not calculate delivery charge')
        setDeliveryQuote({ deliveryPrice: 0, success: true })
      }
    } catch (error) {
      setRateError(error.message || 'Could not calculate delivery charge')
      setDeliveryQuote({ deliveryPrice: 0, success: true })
    } finally {
      setLoadingRate(false)
    }
  }, [shippingAddress?.pincode, cartItems, getCartTotal])

  useEffect(() => {
    loadShippingRate()
  }, [loadShippingRate])

  const deliveryPrice = deliveryQuote?.deliveryPrice ?? 0
  const finalTotal = getCartTotal() + deliveryPrice

  const deliveryDescription = loadingRate
    ? 'Calculating delivery charge for your pincode…'
    : rateError
      ? rateError
      : deliveryQuote?.freeShipping
        ? 'Free delivery on your order'
        : deliveryQuote?.estimatedDelivery
          ? `Estimated delivery: ${deliveryQuote.estimatedDelivery}`
          : deliveryQuote?.courierName
            ? `Via ${deliveryQuote.courierName}`
            : 'Standard delivery to your address'

  const handleContinue = () => {
    if (loadingRate) return

    saveDeliveryInfo(
      { selectedDelivery: 'standard', deliveryInstructions },
      { ...deliveryQuote, cod: false }
    )
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

  if (!shippingAddress?.pincode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F5F5DC] via-[#FAF8F3] to-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Address required</h1>
          <p className="text-gray-600 mb-8">Please enter your delivery address to calculate shipping.</p>
          <Link
            to="/checkout/address"
            className="bg-green-800 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to Address
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5DC] via-[#FAF8F3] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center text-sm font-semibold">1</div>
              <span className="ml-2 text-sm font-medium text-gray-600">Address</span>
            </div>
            <div className="w-16 h-1 bg-green-800" />
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-800 text-white rounded-full flex items-center justify-center text-sm font-semibold">2</div>
              <span className="ml-2 text-sm font-medium text-green-800">Delivery</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                <Truck className="w-6 h-6 mr-2 text-green-800" />
                Delivery to {shippingAddress.pincode}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {shippingAddress.city}, {shippingAddress.state}
              </p>

              <div className="space-y-4 mb-8">
                <div className="border-2 border-green-800 bg-green-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 rounded-lg bg-green-800 text-white">
                        <Truck className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Standard Delivery</h3>
                        <p className="text-sm text-gray-600 mt-1">{deliveryDescription}</p>
                        {deliveryQuote?.weightKg && !loadingRate && (
                          <p className="text-xs text-gray-500 mt-1">Package weight: ~{deliveryQuote.weightKg} kg</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {loadingRate ? (
                        <Loader2 className="w-6 h-6 animate-spin text-green-800 ml-auto" />
                      ) : (
                        <>
                          <div className="text-lg font-bold text-gray-900">
                            {formatDeliveryPrice(deliveryPrice)}
                          </div>
                          <CheckCircle className="w-5 h-5 text-green-800 ml-auto mt-1" />
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {rateError && (
                  <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p>{rateError}</p>
                      <button
                        type="button"
                        onClick={loadShippingRate}
                        className="underline font-medium mt-1"
                      >
                        Retry
                      </button>
                    </div>
                  </div>
                )}
              </div>

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

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Delivery Information</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Delivery charge uses Shiprocket&apos;s recommended courier for your pincode</li>
                  <li>• Orders are processed within 24 hours</li>
                  <li>• You will receive SMS updates about your order</li>
                  <li>• COD orders show an updated delivery fee on the payment step</li>
                </ul>
              </div>

              <button
                onClick={handleContinue}
                disabled={loadingRate}
                className="w-full mt-6 bg-green-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loadingRate ? 'Calculating delivery…' : 'Continue to Payment'}
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
                      {loadingRate ? (
                        <span className="text-gray-500">Calculating…</span>
                      ) : (
                        formatDeliveryPrice(deliveryPrice)
                      )}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total:</span>
                      <span>{loadingRate ? '…' : `₹${finalTotal}`}</span>
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

export default CheckoutDelivery
