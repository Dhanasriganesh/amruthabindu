import React, { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Phone, Package, Heart, LogOut, ShoppingBag } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useUser } from '../../contexts/UserContext'

function Account() {
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()
  const { userProfile, guestProfile, updateUserProfile } = useUser()
  const [profile, setProfile] = useState({ name: '', email: '', phone: '' })
  const [saved, setSaved] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    // Load profile data from auth user or guest profile
    if (currentUser && userProfile) {
      setProfile({
        name: userProfile.name || '',
        email: userProfile.email || '',
        phone: userProfile.phone || ''
      })
    } else if (guestProfile) {
      setProfile({
        name: guestProfile.name || '',
        email: guestProfile.email || '',
        phone: guestProfile.phone || ''
      })
    } else {
      // Try localStorage fallback
      try {
        const p = JSON.parse(localStorage.getItem('profile') || '{}')
        if (p && (p.name || p.email || p.phone)) {
          setProfile({ name: p.name || '', email: p.email || '', phone: p.phone || '' })
        }
      } catch {}
    }
  }, [currentUser, userProfile, guestProfile])

  const handleChange = (e) => {
    const { name, value } = e.target
    setProfile(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    try {
      await updateUserProfile(profile)
      setSaved(true)
      setIsEditing(false)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      alert('Failed to save profile. Please try again.')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
            <p className="text-sm text-gray-600 mt-1">{profile.email || 'Guest user'}</p>
          </div>
          {currentUser && (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <button
            onClick={() => setIsEditing(true)}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-500 hover:shadow-sm transition-all"
          >
            <User size={20} className="text-emerald-600" />
            <span className="text-xs font-medium text-gray-700">Profile</span>
          </button>
          <Link
            to="/orders"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-500 hover:shadow-sm transition-all"
          >
            <Package size={20} className="text-emerald-600" />
            <span className="text-xs font-medium text-gray-700">Orders</span>
          </Link>
          <Link
            to="/favorites"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-500 hover:shadow-sm transition-all"
          >
            <Heart size={20} className="text-emerald-600" />
            <span className="text-xs font-medium text-gray-700">Favorites</span>
          </Link>
          <Link
            to="/cart"
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-500 hover:shadow-sm transition-all"
          >
            <ShoppingBag size={20} className="text-emerald-600" />
            <span className="text-xs font-medium text-gray-700">Cart</span>
          </Link>
        </div>

        {/* Main Content */}
        {!isEditing ? (
          /* Profile View */
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
              <button
                onClick={() => setIsEditing(true)}
                className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
              >
                Edit
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                <User size={18} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm font-medium text-gray-900">{profile.name || 'Not set'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                <Mail size={18} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium text-gray-900">{profile.email || 'Not set'}</p>
                </div>
                {currentUser && (
                  <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded">Verified</span>
                )}
              </div>

              <div className="flex items-center gap-3 py-3">
                <Phone size={18} className="text-gray-400" />
                <div className="flex-1">
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">{profile.phone || 'Not set'}</p>
                </div>
              </div>
            </div>

            {!currentUser && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Tip:</strong> Create an account to save your orders and enjoy a personalized shopping experience!
                </p>
                <div className="flex gap-2 mt-3">
                  <Link
                    to="/login"
                    className="flex-1 text-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="flex-1 text-center px-4 py-2 border border-emerald-600 text-emerald-600 hover:bg-emerald-50 text-sm font-medium rounded-lg transition-colors"
                  >
                    Sign Up
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Edit Profile Form */
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Profile</h2>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  name="name"
                  value={profile.name}
                  onChange={handleChange}
                  placeholder="Your name"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={profile.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  disabled={!!currentUser}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {currentUser && (
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                <input
                  name="phone"
                  value={profile.phone}
                  onChange={handleChange}
                  placeholder="98765 43210"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
              {saved && <p className="text-sm text-emerald-600 text-center">✓ Saved successfully!</p>}
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default Account


