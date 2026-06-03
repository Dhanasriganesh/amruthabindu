import React, { useState, useEffect } from 'react'
import { AlertCircle, Search, Calendar, User, Mail, Phone, ShoppingCart, XCircle, DollarSign, Eye, X } from 'lucide-react'
import { getAllOrders } from '../../services/firebase-db'

function FailedPaymentsManager() {
  const [failedPayments, setFailedPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    fetchFailedPayments()
  }, [])

  const fetchFailedPayments = async () => {
    try {
      setLoading(true)
      // Get all orders without payment_id (failed/incomplete)
      // Note: payment_id can be null OR empty string
      const allOrders = await getAllOrders()

      const data = allOrders?.filter(order => 
        !order.payment_id || order.payment_id.trim() === ''
      ) || []

      setFailedPayments(data)
    } catch (error) {
      console.error('Error fetching failed payments:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = failedPayments.filter(payment => {
    const searchLower = searchQuery.toLowerCase()
    return (
      payment.order_id?.toLowerCase().includes(searchLower) ||
      payment.shipping_address?.email?.toLowerCase().includes(searchLower) ||
      payment.shipping_address?.firstName?.toLowerCase().includes(searchLower) ||
      payment.shipping_address?.lastName?.toLowerCase().includes(searchLower) ||
      payment.shipping_address?.phone?.includes(searchQuery)
    )
  })

  const PaymentDetailsModal = ({ payment, onClose }) => {
    if (!payment) return null

    const customerName = `${payment.shipping_address?.firstName || ''} ${payment.shipping_address?.lastName || ''}`.trim() || 'Unknown'

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="text-red-600" size={24} />
                Failed Payment Details
              </h3>
              <p className="text-sm text-gray-600 mt-1">Attempted Order ID: {payment.order_id}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Alert Box */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <h4 className="font-semibold text-red-900">Payment Not Completed</h4>
                <p className="text-sm text-red-700 mt-1">
                  This customer attempted to place an order but the payment was not completed or failed.
                </p>
              </div>
            </div>

            {/* Date & Time */}
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar size={16} />
              <span className="text-sm">
                Attempted: {new Date(payment.created_at).toLocaleString()}
              </span>
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
                  <p className="font-medium text-gray-900">{customerName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Email</p>
                  <p className="font-medium text-gray-900">{payment.shipping_address?.email || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">{payment.shipping_address?.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Type</p>
                  <p className="font-medium text-gray-900">{payment.user_id ? 'Registered User' : 'Guest'}</p>
                </div>
              </div>
            </div>

            {/* Cart Items */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <ShoppingCart size={18} />
                Attempted Purchase ({payment.items?.length || 0} items)
              </h4>
              <div className="space-y-2">
                {payment.items?.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded">
                    <div className="flex items-center gap-3">
                      {item.image && (
                        <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded" />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">Size: {item.size} • Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">₹{item.price * item.quantity}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart Value */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <DollarSign size={18} />
                Lost Revenue
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cart Total</span>
                  <span className="font-semibold text-gray-900">₹{payment.totals?.subtotal || 0}</span>
                </div>
                {payment.totals?.delivery > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">+ Delivery</span>
                    <span className="font-semibold text-gray-900">₹{payment.totals.delivery}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-yellow-300">
                  <span className="font-bold text-gray-900">Total Attempted</span>
                  <span className="font-bold text-red-600 text-lg">₹{payment.totals?.total || 0}</span>
                </div>
              </div>
            </div>

            {/* Action Suggestions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Recommended Actions</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Follow up with customer via email or phone</li>
                <li>• Offer assistance with payment process</li>
                <li>• Send a discount coupon to encourage completion</li>
                <li>• Check if technical issues prevented payment</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const totalLostRevenue = failedPayments.reduce((sum, payment) => sum + (payment.totals?.total || 0), 0)

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Failed Attempts</p>
              <h3 className="text-2xl font-bold text-red-600">{failedPayments.length}</h3>
            </div>
            <XCircle className="text-red-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Lost Revenue</p>
              <h3 className="text-2xl font-bold text-orange-600">₹{totalLostRevenue}</h3>
            </div>
            <DollarSign className="text-orange-600" size={24} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-600 mb-1">Today</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {failedPayments.filter(p => {
                  const today = new Date().toDateString()
                  return new Date(p.created_at).toDateString() === today
                }).length}
              </h3>
            </div>
            <Calendar className="text-blue-600" size={24} />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by customer name, email, phone, or order ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Failed Payments List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">Loading failed payments...</div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            <XCircle size={48} className="mx-auto mb-4 text-gray-400" />
            <p>No failed payment attempts found</p>
            <p className="text-sm mt-2">This is good news! All payments are going through successfully.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Cart Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-red-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(payment.created_at).toLocaleDateString()}<br />
                      <span className="text-xs text-gray-500">
                        {new Date(payment.created_at).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">
                        {payment.shipping_address?.firstName || ''} {payment.shipping_address?.lastName || ''}
                      </p>
                      <span className="text-xs text-gray-500">
                        {payment.user_id ? 'Registered' : 'Guest'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <Mail size={14} />
                        <span className="text-xs">{payment.shipping_address?.email || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                        <Phone size={14} />
                        <span className="text-xs">{payment.shipping_address?.phone || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {payment.items?.length || 0} items
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-red-600">₹{payment.totals?.total || 0}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment)
                          setShowDetails(true)
                        }}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 transition-colors"
                      >
                        <Eye size={16} />
                        <span className="text-sm">Details</span>
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
      {showDetails && selectedPayment && (
        <PaymentDetailsModal
          payment={selectedPayment}
          onClose={() => {
            setShowDetails(false)
            setSelectedPayment(null)
          }}
        />
      )}
    </div>
  )
}

export default FailedPaymentsManager

