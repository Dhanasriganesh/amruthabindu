import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Mail, Lock, User } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

function Signup() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signup } = useAuth()
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const nextErrors = {}
    if (!formData.name) nextErrors.name = 'Name is required'
    if (!formData.email) nextErrors.email = 'Email is required'
    if (!formData.password) nextErrors.password = 'Password is required'
    if (formData.password.length < 6) nextErrors.password = 'Password must be at least 6 characters'
    if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match'
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
      const user = await signup(formData.email, formData.password, formData.name)
      
      // Check if email confirmation is required
      if (user && !user.email_confirmed_at) {
        // Email confirmation required - show message
        alert('Account created! Please check your email to verify your account before logging in.')
      }
      
      // Handle redirects after signup
      const redirect = searchParams.get('redirect')
      if (redirect === 'checkout') {
        navigate('/checkout/address')
      } else if (redirect) {
        navigate(`/${redirect}`)
      } else {
        navigate('/')
      }
    } catch (err) {
      let errorMessage = err?.message || 'Signup failed'
      
      if (errorMessage.includes('already registered')) {
        errorMessage = 'This email is already registered. Please login instead.'
      }
      
      setErrors({ email: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Signup Form */}
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
          <h1 className="text-2xl font-bold text-gray-900 mb-1 text-center" style={{ fontFamily: 'Playfair Display, serif' }}>Join Us Today!</h1>
          <p className="text-center text-gray-600 mb-5 text-sm">Create your account to start shopping</p>
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <div className="relative">
              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className={`w-full px-4 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-[#2d5f3f] focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your full name"
                autoComplete="name"
              />
              <User size={16} className="absolute right-3 top-2.5 text-gray-400" />
            </div>
            {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-[#2d5f3f] focus:border-transparent ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your email address"
                autoComplete="email"
              />
              <Mail size={16} className="absolute right-3 top-2.5 text-gray-400" />
            </div>
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
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
                className={`w-full px-4 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-[#2d5f3f] focus:border-transparent ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Enter your password"
                autoComplete="new-password"
              />
              <Lock size={16} className="absolute right-3 top-2.5 text-gray-400" />
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 pr-10 border rounded-md focus:ring-2 focus:ring-[#2d5f3f] focus:border-transparent ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'}`}
                placeholder="Confirm your password"
                autoComplete="new-password"
              />
              <Lock size={16} className="absolute right-3 top-2.5 text-gray-400" />
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#2d5f3f] text-white py-2.5 rounded-lg font-semibold hover:bg-[#234d32] transition-colors disabled:opacity-50 shadow-md"
          >
            {isSubmitting ? 'Creating account…' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/login" className="text-[#2d5f3f] hover:text-[#234d32] font-semibold">Login</Link>
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

export default Signup
