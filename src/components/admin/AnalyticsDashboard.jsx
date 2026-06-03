import React, { useState, useEffect } from 'react'
import { TrendingUp, Users, DollarSign, Package, XCircle, Calendar, BarChart } from 'lucide-react'
import { getAllOrders } from '../../services/firebase-db'
import { useAdmin } from '../../contexts/AdminContext'

function AnalyticsDashboard() {
  const { adminUser } = useAdmin()
  const [stats, setStats] = useState({
    totalOrders: 0,
    successfulOrders: 0,
    failedPayments: 0,
    totalRevenue: 0,
    uniqueCustomers: 0,
    topProducts: [],
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [dateRange, setDateRange] = useState('all') // all, today, week, month

  useEffect(() => {
    if (adminUser) {
      fetchAnalytics()
    }
  }, [dateRange, adminUser])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      setFetchError('')

      let orders = await getAllOrders()

      if (dateRange !== 'all') {
        const now = new Date()
        let startDate = new Date()

        if (dateRange === 'today') {
          startDate.setHours(0, 0, 0, 0)
        } else if (dateRange === 'week') {
          startDate.setDate(now.getDate() - 7)
        } else if (dateRange === 'month') {
          startDate.setMonth(now.getMonth() - 1)
        }

        orders = orders.filter((o) => new Date(o.created_at) >= startDate)
      }

      // Calculate stats
      // Handle both null and empty string for payment_id
      const successfulOrders = orders.filter(o => o.payment_id && o.payment_id.trim() !== '')
      const failedPayments = orders.filter(o => !o.payment_id || o.payment_id.trim() === '')
      const totalRevenue = successfulOrders.reduce((sum, o) => sum + (o.totals?.total || 0), 0)

      // Get unique customers (by email)
      const customerEmails = new Set()
      orders.forEach(o => {
        if (o.shipping_address?.email) {
          customerEmails.add(o.shipping_address.email.toLowerCase())
        }
      })

      // Calculate top products from successful orders
      const productCounts = {}
      successfulOrders.forEach(order => {
        order.items?.forEach(item => {
          if (!productCounts[item.name]) {
            productCounts[item.name] = {
              name: item.name,
              quantity: 0,
              revenue: 0,
              orders: 0
            }
          }
          productCounts[item.name].quantity += item.quantity
          productCounts[item.name].revenue += item.price * item.quantity
          productCounts[item.name].orders += 1
        })
      })

      const topProducts = Object.values(productCounts)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)

      setStats({
        totalOrders: orders.length,
        successfulOrders: successfulOrders.length,
        failedPayments: failedPayments.length,
        totalRevenue,
        uniqueCustomers: customerEmails.size,
        topProducts,
        recentActivity: orders.slice(0, 10)
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
      const isPermission =
        error?.code === 'permission-denied' ||
        (error?.message && error.message.includes('insufficient permissions'))
      setFetchError(
        isPermission
          ? 'Firestore denied access to orders. Sign out, deploy the latest firestore.rules, sign in again (this creates config/adminAccess), or add your email in Firebase Console → config/adminAccess → adminEmails.'
          : error?.message || 'Failed to load analytics'
      )
    } finally {
      setLoading(false)
    }
  }

  const conversionRate = stats.totalOrders > 0 
    ? ((stats.successfulOrders / stats.totalOrders) * 100).toFixed(1)
    : 0

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-900">Analytics Overview</h3>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
          {fetchError}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-600">Loading analytics...</div>
      ) : (
        <>
          {/* Key Metrics - Premium Minimal Design */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Revenue */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <DollarSign size={20} className="text-gray-700" />
                </div>
              </div>
              <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Total Revenue</h4>
              <p className="text-2xl font-semibold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-2">From {stats.successfulOrders} orders</p>
            </div>

            {/* Total Orders */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package size={20} className="text-gray-700" />
                </div>
              </div>
              <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Total Orders</h4>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalOrders}</p>
              <p className="text-xs text-gray-500 mt-2">{stats.successfulOrders} successful</p>
            </div>

            {/* Customers */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Users size={20} className="text-gray-700" />
                </div>
              </div>
              <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Unique Customers</h4>
              <p className="text-2xl font-semibold text-gray-900">{stats.uniqueCustomers}</p>
              <p className="text-xs text-gray-500 mt-2">All time customers</p>
            </div>

            {/* Conversion Rate */}
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <BarChart size={20} className="text-gray-700" />
                </div>
              </div>
              <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Conversion Rate</h4>
              <p className="text-2xl font-semibold text-gray-900">{conversionRate}%</p>
              <p className="text-xs text-gray-500 mt-2">{stats.failedPayments} failed attempts</p>
            </div>
          </div>

          {/* Top Products */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
            <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
              <TrendingUp className="text-gray-700" size={18} />
              Top Selling Products
            </h4>
            {stats.topProducts.length === 0 ? (
              <p className="text-gray-500 text-center py-8 text-sm">No sales data yet</p>
            ) : (
              <div className="space-y-2">
                {stats.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-sm font-semibold text-gray-700">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.quantity} units • {product.orders} orders</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900 text-sm">₹{product.revenue.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              Recent Activity
            </h4>
            {stats.recentActivity.length === 0 ? (
              <p className="text-gray-600 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {stats.recentActivity.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      {order.payment_id ? (
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          <Package className="text-green-600" size={16} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                          <XCircle className="text-red-600" size={16} />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {order.shipping_address?.firstName || ''} {order.shipping_address?.lastName || ''}
                        </p>
                        <p className="text-xs text-gray-600">
                          {order.payment_id ? 'Placed order' : 'Payment failed'} • {order.items?.length || 0} items
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold text-sm ${order.payment_id ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{order.totals?.total || 0}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Average Order Value</p>
                  <h3 className="text-2xl font-bold text-gray-900">
                    ₹{stats.successfulOrders > 0 
                      ? Math.round(stats.totalRevenue / stats.successfulOrders) 
                      : 0}
                  </h3>
                </div>
                <DollarSign className="text-emerald-600" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Success Rate</p>
                  <h3 className="text-2xl font-bold text-green-600">{conversionRate}%</h3>
                </div>
                <TrendingUp className="text-green-600" size={32} />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Failed Payments</p>
                  <h3 className="text-2xl font-bold text-red-600">{stats.failedPayments}</h3>
                </div>
                <XCircle className="text-red-600" size={32} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default AnalyticsDashboard

