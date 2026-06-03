import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

function Login() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { login } = useAuth()
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const nextErrors = {}
    if (!formData.email) nextErrors.email = 'Email is required'
    if (!formData.password) nextErrors.password = 'Password is required'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    try {
      await login(formData.email, formData.password)
      
      // Handle redirects after login
      const redirect = searchParams.get('redirect')
      if (redirect === 'checkout') {
        navigate('/checkout/address')
      } else if (redirect) {
        navigate(`/${redirect}`)
      } else {
        navigate('/')
      }
    } catch (err) {
      // Handle specific error messages
      let errorMessage = err?.message || 'Login failed'
      
      if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email address. Check your inbox for a verification link.'
      } else if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.'
      }
      
      setErrors({ email: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Login Form */}
      <div 
        className="w-full lg:w-1/2 flex items-center justify-center p-8"
        style={{
          backgroundImage: 'url(/images/web/doo.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat'
        }}
      >
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>Welcome </h1>
          <p className="text-center text-gray-600 mb-6 text-sm">Sign in to your account to continue shopping</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.email && !errors.password && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-700">{errors.email}</p>
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 pr-10 border rounded-md focus:ring-2 focus:ring-[#2d5f3f] focus:border-transparent ${errors.email && errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your email address"
                autoComplete="email"
              />
              <Mail size={16} className="absolute right-3 top-3 text-gray-400" />
            </div>
            {errors.email && errors.password && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 pr-10 border rounded-md focus:ring-2 focus:ring-[#2d5f3f] focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <Lock size={16} className="absolute right-3 top-3 text-gray-400" />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div className="flex items-center justify-end">
            <Link to="/forgot-password" className="text-xs text-gray-600 hover:text-[#2d5f3f]">
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#2d5f3f] text-white py-2.5 rounded-lg font-semibold hover:bg-[#234d32] transition-colors disabled:opacity-50 shadow-md"
          >
            {isSubmitting ? 'Signing in…' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-[#2d5f3f] hover:text-[#234d32] font-semibold">Sign Up</Link>
        </p>
        </div>
      </div>

      {/* Right Side - Product Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 items-center justify-center p-8"
        style={{
          backgroundImage: 'url(/images/web/doo.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'repeat'
        }}
      >
        <img 
          src="/images/web/loginimg.png" 
          alt="Amrutha Bindu Products" 
          className="max-w-md w-full h-auto rounded-xl shadow-2xl object-contain"
        />
      </div>
    </div>
  )
}

export default Login
