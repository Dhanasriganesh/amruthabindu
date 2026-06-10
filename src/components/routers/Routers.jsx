import React, { useCallback } from 'react'
import Home from '../pages/Home'
import Products from '../pages/Products'
import ProductDetail from '../pages/ProductDetail'
import Contact from '../pages/Contact'
import Cart from '../pages/Cart'
import About from '../pages/About'
import CheckoutAddress from '../pages/CheckoutAddress'
import CheckoutDelivery from '../pages/CheckoutDelivery'
import CheckoutPayment from '../pages/CheckoutPayment'
import CheckoutLoginPrompt from '../pages/CheckoutLoginPrompt'
import OrderSuccess from '../pages/OrderSuccess'
import Login from '../pages/Login'
import Signup from '../pages/Signup'
import ForgotPassword from '../pages/ForgotPassword'
import ResetPassword from '../pages/ResetPassword'
import Privacy from '../footer/Privacy'
import Favorites from '../pages/Favorites'
import Orders from '../pages/Orders'
import Terms from '../footer/Terms'
import Shipping from '../footer/Shipping'
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'
import Account from '../pages/Account'
import Admin from '../pages/Admin'
import PaymentCallback from '../pages/PaymentCallback'
import ScrollToTop from '../ScrollToTop'
import AdminLogin from '../pages/AdminLogin'
import AdminDashboard from '../pages/AdminDashboard'
import ProtectedAdminRoute from '../admin/ProtectedAdminRoute'
import BundlePage from '../pages/BundlePage'

function Routers() {
  const navigate = useNavigate()

  const handleContinueAsGuest = useCallback(() => {
    navigate('/checkout/address')
  }, [navigate])

  return (
    <div>
        <ScrollToTop />
        <Routes>
            <Route path='/' element={<Products />} />
            <Route path='/home' element={<Home />} />
            <Route path='/about' element={<About />} />
            <Route path='/about/our-story' element={<About />} />
            <Route path='/about/manufacturing' element={<About />} />
            <Route path='/about/sustainability' element={<About />} />
            <Route path='/about/ingredients' element={<About />} />
            <Route path='/shop' element={<Products />} />
            <Route path='/shop/foods' element={<Products />} />
            <Route path='/shop/naturals' element={<Products />} />
            <Route path='/shop/skin-care' element={<Navigate to="/shop/naturals" replace />} />
            <Route path='/shop/hair-care' element={<Navigate to="/shop/naturals" replace />} />
            <Route path='/shop/oral-care' element={<Navigate to="/shop/naturals" replace />} />
            <Route path='/shop/product/:id' element={<ProductDetail />} />
            <Route path='/bundle/:id' element={<BundlePage />} />
            <Route path='/contact' element={<Contact />} />
            <Route path='/cart' element={<Cart />} />
            <Route path='/checkout' element={<CheckoutLoginPrompt onContinueAsGuest={handleContinueAsGuest} />} />
            <Route path='/checkout/address' element={<CheckoutAddress />} />
            <Route path='/checkout/delivery' element={<CheckoutDelivery />} />
            <Route path='/checkout/payment' element={<CheckoutPayment />} />
            <Route path='/payment/callback' element={<PaymentCallback />} />
            <Route path='/order-success' element={<OrderSuccess />} />
            <Route path='/login' element={<Login />} />
            <Route path='/signup' element={<Signup />} />
            <Route path='/forgot-password' element={<ForgotPassword />} />
            <Route path='/reset-password' element={<ResetPassword />} />
            <Route path='/privacy' element={<Privacy />} />
            <Route path='/terms' element={<Terms />} />
            <Route path='/shipping' element={<Shipping />} />
            <Route path='/account' element={<Account />} />
            <Route path='/orders' element={<Orders />} />
            <Route path='/favorites' element={<Favorites />} />
            {/* Admin routes */}
            <Route path='/admin' element={<AdminLogin />} />
            <Route path='/admindashboard' element={
              <ProtectedAdminRoute>
                <AdminDashboard />
              </ProtectedAdminRoute>
            } />
            {/* dev seed route removed */}
        </Routes>
    </div>
  )
}

export default Routers
