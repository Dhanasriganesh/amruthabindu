import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, LogIn, ShoppingBag } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

function CheckoutLoginPrompt({ onContinueAsGuest }) {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  // If already logged in, continue directly
  if (currentUser) {
    onContinueAsGuest()
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F5F5DC] via-[#FAF8F3] to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <ShoppingBag className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Almost There!
          </h1>
          <p className="text-lg text-gray-600">
            Choose how you'd like to proceed with your order
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Login/Signup Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-emerald-500">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Login or Sign Up
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Recommended for tracking orders and faster checkout next time
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">Track your order status in real-time</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">Save addresses for faster checkout</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">Access your order history anytime</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">Manage favorites and wishlist</p>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/login?redirect=checkout"
                className="block w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-3 px-6 rounded-lg transition-colors text-center"
              >
                <LogIn className="inline-block w-5 h-5 mr-2 mb-1" />
                Login
              </Link>
              <Link
                to="/signup?redirect=checkout"
                className="block w-full border-2 border-emerald-700 text-emerald-700 hover:bg-emerald-50 font-semibold py-3 px-6 rounded-lg transition-colors text-center"
              >
                Create Account
              </Link>
            </div>
          </div>

          {/* Guest Checkout Card */}
          <div className="bg-white rounded-xl shadow-lg p-8 border-2 border-gray-200 hover:border-gray-300 transition-colors">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <ShoppingBag className="w-8 h-8 text-gray-600" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-3">
              Continue as Guest
            </h2>
            <p className="text-sm text-gray-600 text-center mb-6">
              Quick checkout without creating an account
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">No account needed</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">Fast and simple</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-3 h-3 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm text-gray-700">Receive order confirmation via email</p>
              </div>
            </div>

            <button
              onClick={onContinueAsGuest}
              className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              Continue as Guest
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              You can create an account later to track this order
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/cart"
            className="text-gray-600 hover:text-gray-900 font-medium"
          >
            ← Back to Cart
          </Link>
        </div>
      </div>
    </div>
  )
}

export default CheckoutLoginPrompt

