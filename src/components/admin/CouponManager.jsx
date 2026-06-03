import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Users, Power, Calendar, Percent, Tag, X } from 'lucide-react'
import {
  getAllCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  toggleCouponStatus,
  getCouponUsageList
} from '../../services/coupon-service'

function CouponManager() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [showUsageModal, setShowUsageModal] = useState(null)
  const [usageList, setUsageList] = useState([])

  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    startDate: '',
    endDate: '',
    isActive: true,
    usageType: 'one_time_per_user',
    maxUses: '',
    minOrderAmount: ''
  })

  useEffect(() => {
    loadCoupons()
  }, [])

  const loadCoupons = async () => {
    setLoading(true)
    const { data } = await getAllCoupons()
    setCoupons(data)
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const couponData = {
      code: formData.code,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      startDate: formData.startDate,
      endDate: formData.endDate,
      isActive: formData.isActive,
      usageType: formData.usageType,
      maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : 0
    }

    if (editingCoupon) {
      const { error } = await updateCoupon(editingCoupon.id, couponData)
      if (!error) {
        alert('Coupon updated successfully!')
        resetForm()
        await loadCoupons() // Await to ensure refresh
      } else {
        alert('Error updating coupon: ' + error)
      }
    } else {
      const { data, error } = await createCoupon(couponData)
      if (!error && data) {
        alert('Coupon created successfully!')
        resetForm()
        await loadCoupons() // Await to ensure refresh
      } else {
        alert('Error creating coupon: ' + (error || 'Unknown error'))
      }
    }
  }

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value.toString(),
      startDate: coupon.start_date.split('T')[0],
      endDate: coupon.end_date.split('T')[0],
      isActive: coupon.is_active,
      usageType: coupon.usage_type,
      maxUses: coupon.max_uses?.toString() || '',
      minOrderAmount: coupon.min_order_amount?.toString() || ''
    })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return
    
    const { error } = await deleteCoupon(id)
    if (!error) {
      // Immediately remove from local state for instant UI update
      setCoupons(prevCoupons => prevCoupons.filter(c => c.id !== id))
      alert('Coupon deleted successfully!')
    } else {
      alert('Error deleting coupon: ' + error)
    }
  }

  const handleToggleStatus = async (id, currentStatus) => {
    const { error } = await toggleCouponStatus(id, !currentStatus)
    if (!error) {
      // Immediately update local state for instant UI feedback
      setCoupons(prevCoupons => 
        prevCoupons.map(c => 
          c.id === id ? { ...c, is_active: !currentStatus } : c
        )
      )
    } else {
      alert('Error toggling status: ' + error)
    }
  }

  const viewUsage = async (coupon) => {
    setShowUsageModal(coupon)
    const { data } = await getCouponUsageList(coupon.id)
    setUsageList(data)
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      startDate: '',
      endDate: '',
      isActive: true,
      usageType: 'one_time_per_user',
      maxUses: '',
      minOrderAmount: ''
    })
    setEditingCoupon(null)
    setShowForm(false)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Coupon Management</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'New Coupon'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Coupon Code *</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="FIRST100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Discount Type *</label>
              <select
                value={formData.discountType}
                onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Discount Value * ({formData.discountType === 'percentage' ? '%' : '₹'})
              </label>
              <input
                type="number"
                value={formData.discountValue}
                onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder={formData.discountType === 'percentage' ? '10' : '100'}
                min="0"
                step="0.01"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Usage Type *</label>
              <select
                value={formData.usageType}
                onChange={(e) => setFormData({ ...formData, usageType: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              >
                <option value="first_time_only">First Time Users Only</option>
                <option value="one_time_per_user">One Time Per User</option>
                <option value="unlimited">Unlimited Uses Per User</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Max Uses (Optional)</label>
              <input
                type="number"
                value={formData.maxUses}
                onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Min Order Amount (₹)</label>
              <input
                type="number"
                value={formData.minOrderAmount}
                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 text-emerald-600"
              />
              <label className="text-sm font-medium">Active</label>
            </div>

            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium"
              >
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 border border-gray-300 hover:bg-gray-50 py-2 rounded-lg font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading coupons...</div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No coupons created yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Code</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Discount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Valid Until</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Uses</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {coupons.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Tag size={16} className="text-emerald-600" />
                        <span className="font-mono font-semibold text-sm">{coupon.code}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {coupon.discount_type === 'percentage' 
                        ? `${coupon.discount_value}%` 
                        : `₹${coupon.discount_value}`}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {coupon.usage_type === 'first_time_only' ? 'First Time' : 
                       coupon.usage_type === 'one_time_per_user' ? 'Once Per User' : 'Unlimited'}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(coupon.end_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => viewUsage(coupon)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
                      >
                        <Users size={14} />
                        {coupon.current_uses}/{coupon.max_uses || '∞'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleToggleStatus(coupon.id, coupon.is_active)}
                        className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${
                          coupon.is_active 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Power size={12} />
                        {coupon.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(coupon.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Usage Modal */}
      {showUsageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Usage History: {showUsageModal.code}
              </h3>
              <button
                onClick={() => setShowUsageModal(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh]">
              {usageList.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No usage yet</p>
              ) : (
                <div className="space-y-3">
                  {usageList.map((usage) => (
                    <div key={usage.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-sm">
                            {usage.user_email || 'Guest User'}
                          </p>
                          <p className="text-xs text-gray-600">
                            Order: {usage.order_id?.slice(0, 8)}...
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-emerald-600">
                            -₹{usage.discount_applied}
                          </p>
                          <p className="text-xs text-gray-600">
                            {new Date(usage.used_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CouponManager

