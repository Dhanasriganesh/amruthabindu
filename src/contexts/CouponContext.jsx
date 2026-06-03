import React, { createContext, useContext, useState } from 'react'
import { validateCoupon, calculateDiscount } from '../services/coupon-service'
import { useAuth } from './AuthContext'

const CouponContext = createContext()

export const CouponProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState(null)

  const applyCoupon = async (code, cartTotal, userEmail = null) => {
    setValidating(true)
    setError(null)

    try {
      const userId = currentUser?.id || null
      const email = userEmail || currentUser?.email || null

      const { valid, error: validationError, coupon } = await validateCoupon(
        code,
        userId,
        email,
        cartTotal
      )

      if (!valid) {
        setError(validationError)
        setAppliedCoupon(null)
        setValidating(false)
        return { success: false, error: validationError }
      }

      const discount = calculateDiscount(coupon, cartTotal)
      
      setAppliedCoupon({
        ...coupon,
        discountAmount: discount
      })
      setCouponCode(code)
      setError(null)
      setValidating(false)

      return { success: true, coupon, discount }
    } catch (err) {
      setError(err.message)
      setAppliedCoupon(null)
      setValidating(false)
      return { success: false, error: err.message }
    }
  }

  const removeCoupon = () => {
    setAppliedCoupon(null)
    setCouponCode('')
    setError(null)
  }

  const getDiscountAmount = (cartTotal) => {
    if (!appliedCoupon) return 0
    return calculateDiscount(appliedCoupon, cartTotal)
  }

  const value = {
    appliedCoupon,
    couponCode,
    validating,
    error,
    applyCoupon,
    removeCoupon,
    getDiscountAmount
  }

  return (
    <CouponContext.Provider value={value}>
      {children}
    </CouponContext.Provider>
  )
}

export const useCoupon = () => {
  const context = useContext(CouponContext)
  if (!context) {
    throw new Error('useCoupon must be used within a CouponProvider')
  }
  return context
}

