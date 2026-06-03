import React from 'react'
import { Check, ShoppingCart, X } from 'lucide-react'
import { useCart } from '../contexts/CartContext'
import { useNavigate } from 'react-router-dom'

function CartNotification() {
  const { showCartNotification, setShowCartNotification, notificationItem } = useCart()
  const navigate = useNavigate()

  if (!showCartNotification || !notificationItem) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-white/20 backdrop-blur-md"
        onClick={() => setShowCartNotification(false)}
      />
      
      {/* Notification Card */}
      <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full mx-4 transform transition-all duration-300 ease-in-out border border-white/40">
        {/* Close Button */}
        <button
          onClick={() => setShowCartNotification(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="p-6">
          {/* Success Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-green-100/70 rounded-full flex items-center justify-center backdrop-blur">
              <Check className="w-8 h-8 text-green-600" />
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
            Added to Cart!
          </h3>

          {/* Product Info */}
          <div className="bg-white/70 backdrop-blur rounded-lg p-4 mb-4 border border-white/40">
            <div className="flex items-center space-x-3">
              {/* Product Image */}
              <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                {notificationItem.image ? (
                  <img
                    src={notificationItem.image}
                    alt={notificationItem.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="text-gray-400 text-xs text-center px-1">
                    <div className="font-medium truncate max-w-[44px]">{notificationItem.name}</div>
                  </div>
                )}
              </div>
              
              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-gray-900 truncate">
                  {notificationItem.name}
                </h4>
                <p className="text-sm text-gray-600">
                  {notificationItem.category} • {notificationItem.size}
                </p>
                <p className="text-sm font-semibold text-green-800">
                  ₹{notificationItem.price} × {notificationItem.quantity}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCartNotification(false)}
              className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => {
                setShowCartNotification(false)
                navigate('/cart')
              }}
              className="flex-1 bg-green-800 text-white py-2 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center"
            >
              <ShoppingCart size={16} className="mr-2" />
              View Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartNotification
