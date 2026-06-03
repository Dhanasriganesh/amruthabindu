import React, { useState } from 'react'
import { Tag, X, Check, Loader } from 'lucide-react'
import { useCoupon } from '../contexts/CouponContext'

function CouponInput({ cartTotal, userEmail = null }) {
  const { appliedCoupon, validating, error, applyCoupon, removeCoupon } = useCoupon()
  const [code, setCode] = useState('')

  const handleApply = async () => {
    if (!code.trim()) return
    
    const result = await applyCoupon(code.trim(), cartTotal, userEmail)
    if (result.success) {
      setCode('')
    }
  }

  const handleRemove = () => {
    removeCoupon()
    setCode('')
  }

  if (appliedCoupon) {
    return (
      <div className="border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Tag size={16} className="text-gray-600" />
          <span className="text-sm font-semibold text-gray-900">Coupon Code</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-600 rounded-full">
                <Check size={14} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  {appliedCoupon.code}
                </p>
                <p className="text-xs text-emerald-700">
                  You saved ₹{appliedCoupon.discountAmount.toFixed(2)}!
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="p-1.5 hover:bg-emerald-100 rounded-full transition-colors"
              title="Remove coupon"
            >
              <X size={16} className="text-emerald-700" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Tag size={16} className="text-gray-600" />
        <span className="text-sm font-semibold text-gray-900">Apply Coupon Code</span>
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === 'Enter' && handleApply()}
              placeholder="Enter code (e.g., WELCOME10)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm uppercase focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              disabled={validating}
            />
          </div>
          <button
            onClick={handleApply}
            disabled={validating || !code.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg text-sm transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            {validating ? (
              <>
                <Loader size={16} className="animate-spin" />
                <span className="hidden sm:inline">Applying...</span>
              </>
            ) : (
              'Apply'
            )}
          </button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 flex items-start gap-2">
            <X size={14} className="text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <span>💡</span>
          Enter your coupon code and click Apply to get instant discount
        </p>
      </div>
    </div>
  )
}

export default CouponInput

