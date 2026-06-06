import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, MapPin, ShoppingBag, User, Truck, ExternalLink } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { getOrdersByUserId, getGuestOrdersByEmail } from '../../services/firebase-db'

function Orders() {
  const { currentUser } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadOrders()
  }, [currentUser])

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      if (currentUser) {
        // Load orders for authenticated user
        const data = await getOrdersByUserId(currentUser.id)
        setOrders(data || [])
      } else {
        // Load guest orders from localStorage (by email)
        const guestEmail = JSON.parse(localStorage.getItem('profile') || '{}').email
        if (guestEmail) {
          const data = await getGuestOrdersByEmail(guestEmail)
          setOrders(data || [])
        } else {
          setOrders([])
        }
      }
    } catch (err) {
      console.error('Error loading orders:', err)
      setError('Failed to load orders. Please try again.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const formatPrice = (price) => {
    return `₹${Number(price).toFixed(2)}`
  }

  const getFulfillmentLabel = (status) => {
    const labels = {
      AWAITING_PROCESSING: 'Processing',
      PACKED: 'Packed',
      SHIPPED: 'Shipped',
      OUT_FOR_DELIVERY: 'Out for Delivery',
      DELIVERED: 'Delivered',
      CANCELLED: 'Cancelled',
    }
    return labels[status] || 'Processing'
  }

  const getFulfillmentColor = (status) => {
    const colors = {
      AWAITING_PROCESSING: 'bg-gray-100 text-gray-700',
      PACKED: 'bg-blue-100 text-blue-700',
      SHIPPED: 'bg-purple-100 text-purple-700',
      OUT_FOR_DELIVERY: 'bg-orange-100 text-orange-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    }
    return colors[status] || colors.AWAITING_PROCESSING
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600 mx-auto"></div>
            <p className="mt-3 text-sm text-gray-600">Loading orders...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!currentUser && !JSON.parse(localStorage.getItem('profile') || '{}').email) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Login to View Orders</h2>
            <p className="text-sm text-gray-600 mb-4">
              Sign in to see your order history
            </p>
            <div className="flex gap-2 justify-center">
              <Link 
                to="/login" 
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link 
                to="/signup" 
                className="border border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-sm font-medium py-2 px-4 rounded-lg transition-colors"
              >
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
            <p className="text-sm text-gray-600 mt-1">
              {orders.length > 0 
                ? `${orders.length} order${orders.length !== 1 ? 's' : ''}`
                : 'No orders yet'
              }
            </p>
          </div>
          {orders.length > 0 && (
            <Link 
              to="/shop" 
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              Shop More
            </Link>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-sm text-gray-600 mb-4">
              Start shopping to see your orders here
            </p>
            <Link 
              to="/shop" 
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const items = order.items || []
              const totals = order.totals || {}
              const shippingAddress = order.shipping_address || {}
              
              return (
                <div 
                  key={order.id} 
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden"
                >
                  {/* Order Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500">Order ID</p>
                          <p className="font-mono font-semibold text-gray-900">
                            #{order.order_id?.slice(-8) || 'N/A'}
                          </p>
                        </div>
                        <div className="hidden sm:block">
                          <p className="text-xs text-gray-500">Date</p>
                          <p className="font-medium text-gray-900">
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Total</p>
                          <p className="font-bold text-emerald-600 text-lg">
                            {formatPrice(totals.total || 0)}
                          </p>
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${getFulfillmentColor(order.fulfillment_status || 'AWAITING_PROCESSING')}`}>
                          {getFulfillmentLabel(order.fulfillment_status || 'AWAITING_PROCESSING')}
                        </span>
                        <span className="text-xs font-medium px-2 py-1 rounded bg-green-100 text-green-700">
                          {order.payment_method === 'cod' ? 'COD' : 'Paid'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="p-4">
                    <div className="space-y-3">
                      {items.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="flex items-center gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                        >
                          <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                            {item.image ? (
                              <img 
                                src={item.image} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs text-gray-500">
                              {item.size} • Qty: {item.quantity}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-gray-900">
                              {formatPrice(item.price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Tracking */}
                    {(order.tracking_number || order.shiprocket_order_id) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-start gap-2">
                          <Truck size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-gray-900 mb-1">Delivery Tracking</p>
                            {order.tracking_number ? (
                              <a
                                href={`https://shiprocket.co/tracking/${encodeURIComponent(order.tracking_number)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-700"
                              >
                                AWB: {order.tracking_number}
                                <ExternalLink size={12} />
                              </a>
                            ) : (
                              <p className="text-xs text-gray-600">
                                Shipment created — tracking number will appear once dispatched
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Shipping Address */}
                    {shippingAddress && (shippingAddress.address || shippingAddress.city) && (
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex items-start gap-2">
                          <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-medium text-gray-900 mb-1">
                              {shippingAddress.firstName} {shippingAddress.lastName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {shippingAddress.address}
                              {shippingAddress.city && `, ${shippingAddress.city}`}
                              {shippingAddress.pincode && ` - ${shippingAddress.pincode}`}
                            </p>
                            {shippingAddress.phone && (
                              <p className="text-xs text-gray-600 mt-1">
                                {shippingAddress.phone}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders

