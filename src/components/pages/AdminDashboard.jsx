import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, 
  Package, 
  Home, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Heading,
  Image,
  Tag,
  ShoppingBag,
  XCircle,
  BarChart3,
  Users,
  MailPlus
} from 'lucide-react'
import { useAdmin } from '../../contexts/AdminContext'
import ProductsManager from '../admin/ProductsManager'
import HomeContentManager from '../admin/HomeContentManager'
import HeaderContentManager from '../admin/HeaderContentManager'
import HeroSlidesManager from '../admin/HeroSlidesManager'
import CouponManager from '../admin/CouponManager'
import OrdersManager from '../admin/OrdersManager'
import FailedPaymentsManager from '../admin/FailedPaymentsManager'
import AnalyticsDashboard from '../admin/AnalyticsDashboard'
import LeadsManager from '../admin/LeadsManager'
import EmailMarketingManager from '../admin/EmailMarketingManager'

function AdminDashboard() {
  const { adminLogout } = useAdmin()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('analytics')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Start closed on mobile

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await adminLogout()
      navigate('/admin')
    }
  }

  const menuItems = [
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={20} />, description: 'View sales & stats' },
    { id: 'orders', label: 'All Orders', icon: <ShoppingBag size={20} />, description: 'Manage orders' },
    { id: 'leads', label: 'Leads', icon: <Users size={20} />, description: 'Track potential customers' },
    { id: 'failed', label: 'Failed Payments', icon: <XCircle size={20} />, description: 'Track failed orders' },
    { id: 'email-marketing', label: 'Email Marketing', icon: <MailPlus size={20} />, description: 'Send bulk emails' },
    { id: 'products', label: 'Products', icon: <Package size={20} />, description: 'Manage products' },
    { id: 'coupons', label: 'Coupons', icon: <Tag size={20} />, description: 'Manage coupons' },
    { id: 'hero', label: 'Hero Slides', icon: <Image size={20} />, description: 'Edit homepage slides' },
    { id: 'home', label: 'Home Content', icon: <Home size={20} />, description: 'Edit home page' },
    { id: 'header', label: 'Header', icon: <Heading size={20} />, description: 'Edit header' },
  ]

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`bg-emerald-900 text-white transition-all duration-300 flex flex-col fixed inset-y-0 left-0 z-50 ${
        isSidebarOpen ? 'w-64' : 'w-0 lg:w-20'
      } overflow-hidden`}>
        {/* Header */}
        <div className="p-4 border-b border-emerald-800">
          <div className="flex items-center justify-between">
            {isSidebarOpen && (
              <div>
                <h1 className="font-bold text-lg">Admin Panel</h1>
                <p className="text-xs text-emerald-300">Amrutha Bindu</p>
              </div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-emerald-800 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-emerald-700 text-white'
                      : 'text-emerald-100 hover:bg-emerald-800'
                  }`}
                >
                  {item.icon}
                  {isSidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-emerald-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-emerald-100 hover:bg-red-600 hover:text-white transition-colors"
          >
            <LogOut size={20} />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen transition-all duration-300 ${
        isSidebarOpen ? 'ml-64' : 'ml-0 lg:ml-20'
      }`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm">
          <div className="px-4 lg:px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Menu size={20} />
                </button>
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                  {menuItems.find(item => item.id === activeTab)?.label || 'Dashboard'}
                </h2>
              </div>
              <div className="hidden sm:flex items-center gap-4">
                <span className="text-sm text-gray-600">
                  Logged in as: <span className="font-semibold">Admin</span>
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 lg:p-6">
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'orders' && <OrdersManager />}
          {activeTab === 'leads' && <LeadsManager />}
          {activeTab === 'failed' && <FailedPaymentsManager />}
          {activeTab === 'email-marketing' && <EmailMarketingManager />}
          {activeTab === 'products' && <ProductsManager />}
          {activeTab === 'coupons' && <CouponManager />}
          {activeTab === 'hero' && <HeroSlidesManager />}
          {activeTab === 'home' && <HomeContentManager />}
          {activeTab === 'header' && <HeaderContentManager />}
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard

