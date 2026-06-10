import React, { useState, useEffect } from 'react'
import { Package, Search, Filter, Download, Eye, X, Calendar, DollarSign, User, MapPin, ShoppingBag, CheckCircle, XCircle, Clock, AlertCircle, Box, Truck } from 'lucide-react'
import { getAllOrders } from '../../services/firebase-db'
import { updateOrderStatus, checkTrackingStatus } from '../../services/order-tracking'
import { isSuccessfulOrder, orderDocToShiprocketPayload } from '../../services/order-completion'
import { pushOrderToShiprocket } from '../../services/shiprocket-integration'

function OrdersManager() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState(null)
  const [syncingTracking, setSyncingTracking] = useState(false)
  const [pushingToShiprocket, setPushingToShiprocket] = useState(null)

  useEffect(() => {
    fetchOrders()
    
    // Listen for order updates (when new order is created)
    const handleOrdersUpdate = () => {
      console.log('🔄 Refreshing orders list...')
      fetchOrders()
    }
    
    window.addEventListener('ordersUpdated', handleOrdersUpdate)
    
    // Refresh orders every 30 seconds to catch new orders
    const refreshInterval = setInterval(() => {
      fetchOrders()
    }, 30000)
    
    return () => {
      window.removeEventListener('ordersUpdated', handleOrdersUpdate)
      clearInterval(refreshInterval)
    }
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const data = await getAllOrders()
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPaymentStatusBadge = (order) => {
    if (order.error_message) {
      return {
        label: 'Failed',
        color: 'bg-red-100 text-red-800',
        icon: <XCircle size={14} />
      }
    }
    if (order.payment_method === 'cod') {
      return {
        label: 'COD',
        color: 'bg-blue-100 text-blue-800',
        icon: <CheckCircle size={14} />
      }
    }
    if (order.payment_id && order.payment_id.trim() !== '') {
      return {
        label: 'Paid',
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle size={14} />
      }
    }
    return {
      label: 'Pending',
      color: 'bg-yellow-100 text-yellow-800',
      icon: <Clock size={14} />
    }
  }

  const handlePushToShiprocket = async (order) => {
    if (!isSuccessfulOrder(order)) {
      alert('Only successful orders can be pushed to Shiprocket.')
      return
    }
    if (order.shiprocket_order_id) {
      alert('This order is already synced to Shiprocket.')
      return
    }

    try {
      setPushingToShiprocket(order.order_id)
      const payload = orderDocToShiprocketPayload(order)
      const result = await pushOrderToShiprocket(payload)

      if (result.skipped) {
        alert('Shiprocket is not configured. Add SHIPROCKET_API_EMAIL and SHIPROCKET_API_PASSWORD to .env and restart the server.')
        return
      }
      if (!result.success) {
        alert(`Failed to push to Shiprocket:\n${result.error || 'Unknown error'}`)
        return
      }

      const { updateOrderByOrderId } = await import('../../services/firebase-db')
      const updates = {
        shiprocket_order_id: result.shiprocketOrderId.toString(),
        fulfillment_status: 'AWAITING_PROCESSING',
      }
      if (result.shipmentId) {
        updates.shiprocket_shipment_id = result.shipmentId.toString()
      }
      await updateOrderByOrderId(order.order_id, updates)
      alert(`Order synced to Shiprocket!\nShiprocket Order ID: ${result.shiprocketOrderId}`)
      await fetchOrders()
    } catch (error) {
      console.error('Failed to push to Shiprocket:', error)
      alert(`Failed to push to Shiprocket: ${error.message}`)
    } finally {
      setPushingToShiprocket(null)
    }
  }

  const getFulfillmentStatusBadge = (order) => {
    const status = order.fulfillment_status || 'AWAITING_PROCESSING'
    
    const statusMap = {
      'AWAITING_PROCESSING': {
        label: 'Awaiting Processing',
        color: 'bg-gray-100 text-gray-800',
        icon: <Clock size={14} />
      },
      'PACKED': {
        label: 'Packed',
        color: 'bg-blue-100 text-blue-800',
        icon: <Box size={14} />
      },
      'SHIPPED': {
        label: 'Shipped',
        color: 'bg-purple-100 text-purple-800',
        icon: <Truck size={14} />
      },
      'OUT_FOR_DELIVERY': {
        label: 'Out for Delivery',
        color: 'bg-orange-100 text-orange-800',
        icon: <Truck size={14} />
      },
      'DELIVERED': {
        label: 'Delivered',
        color: 'bg-green-100 text-green-800',
        icon: <CheckCircle size={14} />
      },
      'CANCELLED': {
        label: 'Cancelled',
        color: 'bg-red-100 text-red-800',
        icon: <XCircle size={14} />
      }
    }
    
    return statusMap[status] || statusMap['AWAITING_PROCESSING']
  }


  const handleSyncTracking = async () => {
    try {
      setSyncingTracking(true)
      const result = await checkTrackingStatus()
      if (result.skipped) {
        alert('ℹ️ Shiprocket is not configured yet.\n\nTracking sync will work once you add SHIPROCKET_API_EMAIL and SHIPROCKET_API_PASSWORD to your .env file.')
        return
      }
      alert(`✅ Tracking sync complete\n\nChecked: ${result.checked} orders\nUpdated: ${result.updated}\nEmails sent: ${result.emailsSent}`)
      await fetchOrders()
    } catch (error) {
      console.error('❌ Failed to sync tracking:', error)
      alert(`❌ Failed to sync tracking: ${error.message}`)
    } finally {
      setSyncingTracking(false)
    }
  }

  const handleStatusUpdate = async (order, newStatus) => {
    // Don't update if status hasn't changed
    if (order.fulfillment_status === newStatus) {
      return
    }
    
    try {
      setUpdatingStatus(order.order_id)
      
      // For shipped status, ask for tracking number
      let trackingNumber = null
      if (newStatus === 'SHIPPED') {
        trackingNumber = prompt('Enter tracking number (optional):')
        if (trackingNumber === null) {
          setUpdatingStatus(null)
          return // User cancelled
        }
        trackingNumber = trackingNumber.trim() || null
      }
      
      console.log('🔄 Updating order status:', {
        orderId: order.order_id,
        shiprocketOrderId: order.shiprocket_order_id,
        newStatus,
        trackingNumber
      })
      
      await updateOrderStatus(
        order.order_id,
        newStatus,
        trackingNumber
      )
      
      // Success message
      const statusLabels = {
        'PACKED': 'Packed',
        'SHIPPED': 'Shipped',
        'OUT_FOR_DELIVERY': 'Out for Delivery',
        'DELIVERED': 'Delivered'
      }
      
      alert(`✅ Order status updated to "${statusLabels[newStatus] || newStatus}"\n\n✅ Updated in database\n✅ Email sent to customer: ${order.shipping_address?.email || 'N/A'}`)
      
      // Refresh orders list to show new status
      await fetchOrders()
    } catch (error) {
      console.error('❌ Failed to update status:', error)
      alert(`❌ Failed to update status: ${error.message}\n\nPlease check:\n1. Backend server is running\n2. Firebase Admin is configured`)
    } finally {
      setUpdatingStatus(null)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.shipping_address?.lastName?.toLowerCase().includes(searchQuery.toLowerCase())

    // Removed fulfillment status filter - only filter by search now
    return matchesSearch
  })

  const exportToCSV = () => {
    const headers = ['Order ID', 'Date', 'Customer', 'Email', 'Phone', 'Total', 'Status', 'Payment Method']
    const rows = filteredOrders.map(order => [
      order.order_id,
      new Date(order.created_at).toLocaleDateString(),
      `${order.shipping_address?.firstName || ''} ${order.shipping_address?.lastName || ''}`.trim(),
      order.shipping_address?.email || '',
      order.shipping_address?.phone || '',
      `₹${order.totals?.total || 0}`,
      getFulfillmentStatusBadge(order).label,
      order.payment_method || 'N/A'
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const OrderDetailsModal = ({ order, onClose }) => {
    if (!order) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900">Order Details</h3>
              <p className="text-sm text-gray-600 mt-1">Order ID: {order.order_id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Status & Date */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusBadge(order).color}`}>
                  {getPaymentStatusBadge(order).icon}
                  {getPaymentStatusBadge(order).label}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getFulfillmentStatusBadge(order).color}`}>
                  {getFulfillmentStatusBadge(order).icon}
                  {getFulfillmentStatusBadge(order).label}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar size={16} />
                <span className="text-sm">{new Date(order.created_at).toLocaleString()}</span>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <User size={18} />
                Customer Information
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    {order.shipping_address?.firstName || ''} {order.shipping_address?.lastName || ''}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{order.shipping_address?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{order.shipping_address?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">User ID</p>
                  <p className="font-medium text-gray-900">{order.user_id || 'Guest'}</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={18} />
                Shipping Address
              </h4>
              <p className="text-sm text-gray-900">
                {order.shipping_address?.address || 'N/A'}<br />
                {order.shipping_address?.city || ''}, {order.shipping_address?.state || ''} {order.shipping_address?.pincode || ''}<br />
                {order.shipping_address?.country || 'India'}
              </p>
            </div>

            {/* Order Items */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ShoppingBag size={18} />
                Order Items
              </h4>
              <div className="space-y-3">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">Size: {item.size} • Qty: {item.quantity}</p>
                        {item.sku && <p className="text-xs text-gray-500">SKU: {item.sku}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{item.price}</p>
                      <p className="text-sm text-gray-600">Total: ₹{item.price * item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment & Totals */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign size={18} />
                Payment Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">₹{order.totals?.subtotal || 0}</span>
                </div>
                {order.totals?.savings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Savings</span>
                    <span className="font-medium">-₹{order.totals.savings}</span>
                  </div>
                )}
                {order.totals?.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Coupon Discount ({order.coupon_code})</span>
                    <span className="font-medium">-₹{order.totals.couponDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery</span>
                  <span className="font-medium text-gray-900">
                    {order.totals?.delivery === 0 ? 'FREE' : `₹${order.totals?.delivery || 0}`}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-300">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="font-bold text-gray-900 text-lg">₹{order.totals?.total || 0}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-300 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method</span>
                  <span className="font-medium text-gray-900">{order.payment_method || 'N/A'}</span>
                </div>
                {order.payment_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID</span>
                    <span className="font-medium text-gray-900 font-mono text-xs">{order.payment_id}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Shiprocket / Tracking */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Truck size={18} />
                Shiprocket Delivery
              </h4>
              {order.shiprocket_order_id || order.tracking_number ? (
                <div className="text-sm space-y-2">
                  {order.shiprocket_order_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shiprocket Order ID</span>
                      <span className="font-medium text-gray-900 font-mono text-xs">{order.shiprocket_order_id}</span>
                    </div>
                  )}
                  {order.shiprocket_shipment_id && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipment ID</span>
                      <span className="font-medium text-gray-900 font-mono text-xs">{order.shiprocket_shipment_id}</span>
                    </div>
                  )}
                  {order.tracking_number && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">AWB / Tracking</span>
                      <a
                        href={`https://shiprocket.co/tracking/${encodeURIComponent(order.tracking_number)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-emerald-600 hover:text-emerald-700 text-xs"
                      >
                        {order.tracking_number}
                      </a>
                    </div>
                  )}
                </div>
              ) : isSuccessfulOrder(order) ? (
                <div className="space-y-3">
                  <p className="text-sm text-amber-700">Not synced to Shiprocket yet.</p>
                  <button
                    type="button"
                    onClick={() => handlePushToShiprocket(order)}
                    disabled={pushingToShiprocket === order.order_id}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {pushingToShiprocket === order.order_id ? 'Pushing…' : 'Push to Shiprocket'}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Available after successful payment.</p>
              )}
            </div>

            {/* Delivery Info */}
            {order.delivery_info && (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Delivery Information</h4>
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method</span>
                    <span className="font-medium text-gray-900">{order.delivery_info.deliveryMethod || 'Standard'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Estimated Days</span>
                    <span className="font-medium text-gray-900">{order.delivery_info.estimatedDays || 'N/A'}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Orders</p>
              <h3 className="text-2xl font-bold text-gray-900">{orders.length}</h3>
            </div>
            <Package className="text-blue-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Paid Orders</p>
              <h3 className="text-2xl font-bold text-green-600">
                {orders.filter(o => isSuccessfulOrder(o)).length}
              </h3>
            </div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">
                ₹{orders.filter(o => isSuccessfulOrder(o)).reduce((sum, o) => sum + (o.totals?.total || 0), 0)}
              </h3>
            </div>
            <DollarSign className="text-emerald-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Pending</p>
              <h3 className="text-2xl font-bold text-yellow-600">
                {orders.filter(o => !isSuccessfulOrder(o)).length}
              </h3>
            </div>
            <Clock className="text-yellow-600" size={24} />
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex-1 w-full md:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by order ID, customer name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={handleSyncTracking}
              disabled={syncingTracking}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Truck size={18} />
              {syncingTracking ? 'Syncing...' : 'Sync Tracking'}
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Download size={18} />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading orders...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <Package size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Total</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Payment</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-gray-900">{order.order_id}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {order.shipping_address?.firstName || ''} {order.shipping_address?.lastName || ''}
                        </p>
                        <p className="text-sm text-gray-600">{order.shipping_address?.email || 'N/A'}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {order.items?.length || 0} items
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">₹{order.totals?.total || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusBadge(order).color}`}>
                        {getPaymentStatusBadge(order).icon}
                        {getPaymentStatusBadge(order).label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowDetails(true)
                        }}
                        className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 transition-colors"
                      >
                        <Eye size={16} />
                        <span className="text-sm">View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => {
            setShowDetails(false)
            setSelectedOrder(null)
          }}
        />
      )}
    </div>
  )
}

export default OrdersManager

