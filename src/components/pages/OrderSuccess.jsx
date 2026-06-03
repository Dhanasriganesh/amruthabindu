import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CheckCircle, Mail, Clock } from 'lucide-react'

function OrderSuccess() {
  const location = useLocation()
  const { paymentId, orderId, items } = location.state || {}

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Order Placed Successfully!
          </h1>
          
          <p className="text-lg text-gray-600 mb-6">
            Thank you for your order. We've received your payment and will start processing your order shortly.
          </p>

          {/* Delivery Information Highlight Box */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-6 mb-8 shadow-md">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <Mail className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 text-left">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2 text-lg">
                  <Clock size={20} className="text-blue-600" />
                  Delivery Information
                </h3>
                <p className="text-base text-gray-700 leading-relaxed">
                  <span className="font-bold text-blue-700 text-lg">Estimated delivery time</span> and tracking details will be sent to your registered <span className="font-semibold text-blue-600">email address</span> shortly.
                </p>
                <div className="mt-3 bg-white/60 rounded-lg px-4 py-2 text-sm text-gray-600 border border-blue-100">
                  📧 Check your inbox for delivery updates
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Details</h2>
            {paymentId && (
              <div className="text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment ID:</span>
                  <span className="font-medium">{paymentId}</span>
                </div>
                {orderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">{orderId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{new Date().toLocaleDateString()}</span>
                </div>
              </div>
            )}

            {/* Items List */}
            {Array.isArray(items) && items.length > 0 && (
              <div className="mt-6 space-y-3">
                {items.map((it, idx) => (
                  <div key={idx} className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                      {it.image ? (
                        <img src={it.image} alt={it.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="text-gray-400 text-[10px] leading-tight text-center px-1 flex items-center justify-center h-full">
                          <div className="font-medium truncate max-w-[48px]">{it.name}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">{it.name}</div>
                      <div className="text-sm text-gray-600">{it.size}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-green-800">₹{it.price} × {it.quantity}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/shop"
              className="bg-green-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Continue Shopping
            </Link>
            <Link
              to="/home"
              className="border border-green-800 text-green-800 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderSuccess
