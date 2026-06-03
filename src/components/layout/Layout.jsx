import React from 'react'
import { useLocation } from 'react-router-dom'
import Header from '../header/Header'
import Footer from '../footer/Footer'
import CartNotification from '../CartNotification'
import { CartProvider } from '../../contexts/CartContext'
import { AuthProvider } from '../../contexts/AuthContext'
import { AdminProvider } from '../../contexts/AdminContext'
import { UserProvider } from '../../contexts/UserContext'
import { FavoritesProvider } from '../../contexts/FavoritesContext'
import { CouponProvider } from '../../contexts/CouponContext'

function Layout({ children }) {
    const location = useLocation()
    const isAdminRoute = location.pathname.startsWith('/admin')

    // For admin routes, don't show header/footer
    if (isAdminRoute) {
        return (
            <AdminProvider>
                <AuthProvider>
                    <UserProvider>
                        <CartProvider>
                            <FavoritesProvider>
                                <CouponProvider>
                                    {children}
                                </CouponProvider>
                            </FavoritesProvider>
                        </CartProvider>
                    </UserProvider>
                </AuthProvider>
            </AdminProvider>
        )
    }

    return (
        <AdminProvider>
            <AuthProvider>
                <UserProvider>
                    <CartProvider>
                        <FavoritesProvider>
                            <CouponProvider>
                                <Header />
                                <main className="min-h-screen bg-gradient-to-b from-white via-stone-50 to-white">
                                    {children}
                                </main>
                                <Footer />
                                <CartNotification />
                            </CouponProvider>
                        </FavoritesProvider>
                    </CartProvider>
                </UserProvider>
            </AuthProvider>
        </AdminProvider>
    )
}

export default Layout
