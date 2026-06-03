import React, { useEffect, useState, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  User,
  ShoppingCart,
  Heart,
  ChevronDown,
  LogOut,
  Package,
  Phone,
  Mail,
  ArrowRight,
} from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { useUser } from '../../contexts/UserContext'
import { loadHeaderContent } from '../../services/cms'
import {
  DEFAULT_HEADER,
  HEADER_CONTENT_UPDATED_EVENT,
  mergeHeaderContent,
  readHeaderContentCache,
} from '../../utils/headerContent'

function isNavActive(pathname, href) {
  if (href === '/home' || href === '/') {
    return pathname === '/' || pathname === '/home'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [headerData, setHeaderData] = useState(DEFAULT_HEADER)
  const location = useLocation()
  const navigate = useNavigate()
  const { getCartItemsCount } = useCart()
  const { currentUser, logout } = useAuth()
  const { getDisplayName } = useUser()
  const [profileName, setProfileName] = useState('')

  const { logo, siteName, tagline, navigation } = headerData
  const cartCount = getCartItemsCount()
  const initials = profileName
    ? profileName
        .split(' ')
        .map((p) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : ''

  const refreshHeaderContent = useCallback(async () => {
    const cached = readHeaderContentCache()
    if (cached) setHeaderData(cached)
    try {
      const content = await loadHeaderContent()
      if (content) setHeaderData(mergeHeaderContent(content))
    } catch (error) {
      console.error('Failed to load header content:', error)
    }
  }, [])

  useEffect(() => {
    refreshHeaderContent()
    const onUpdated = () => refreshHeaderContent()
    window.addEventListener(HEADER_CONTENT_UPDATED_EVENT, onUpdated)
    return () => window.removeEventListener(HEADER_CONTENT_UPDATED_EVENT, onUpdated)
  }, [refreshHeaderContent])

  useEffect(() => {
    setProfileName(getDisplayName())
  }, [getDisplayName, currentUser])

  useEffect(() => {
    const load = () => setProfileName(getDisplayName())
    window.addEventListener('profileUpdated', load)
    return () => window.removeEventListener('profileUpdated', load)
  }, [getDisplayName])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setIsMenuOpen(false)
    setOpenDropdown(null)
    setShowUserDropdown(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const handleLogout = async () => {
    try {
      await logout()
      setShowUserDropdown(false)
      setIsMenuOpen(false)
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <>
      <header
        className={`site-header font-body-premium ${scrolled ? 'site-header--scrolled' : 'site-header--top'}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-[4.5rem] sm:h-[5rem] lg:h-[5.5rem]">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 sm:gap-4 group z-10 shrink-0">
              <div className="relative">
                <img
                  src={logo}
                  alt={siteName}
                  className="site-header__logo-img transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute -inset-1 rounded-full bg-black/5 scale-0 group-hover:scale-100 transition-transform duration-300 -z-10" />
              </div>
              <div className="hidden sm:block leading-tight">
                <span className="font-display text-lg sm:text-xl text-black tracking-tight block">
                  {siteName}
                </span>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-black/70 font-medium">
                  {tagline}
                </span>
              </div>
            </Link>

            {/* Center nav — desktop */}
            <nav
              className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center"
              aria-label="Main navigation"
            >
              <div className="site-header__nav-pill">
                {navigation.map((item) => (
                  <div
                    key={item.name}
                    className="relative"
                    onMouseEnter={() => item.hasDropdown && setOpenDropdown(item.name)}
                    onMouseLeave={() => item.hasDropdown && setOpenDropdown(null)}
                  >
                    <Link
                      to={item.href}
                      className={`site-header__nav-link inline-flex items-center gap-1 font-body-premium ${
                        isNavActive(location.pathname, item.href) ? 'site-header__nav-link--active' : ''
                      }`}
                    >
                      {item.name}
                      {item.hasDropdown && (
                        <ChevronDown
                          size={14}
                          className={`opacity-60 transition-transform duration-200 ${
                            openDropdown === item.name ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </Link>

                    <AnimatePresence>
                      {item.hasDropdown && item.submenu && openDropdown === item.name && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.2 }}
                          className="site-header__mega"
                          onMouseEnter={() => setOpenDropdown(item.name)}
                          onMouseLeave={() => setOpenDropdown(null)}
                        >
                          <p className="site-header__mega-label px-3 pb-2 mb-1">
                            Collections
                          </p>
                          <div className="grid grid-cols-1 gap-0.5">
                            {item.submenu.map((sub) => (
                              <Link
                                key={sub.name}
                                to={sub.href}
                                className="site-header__mega-link flex items-center justify-between group/sub font-body-premium"
                              >
                                <span>{sub.name}</span>
                                <ArrowRight
                                  size={14}
                                  className="opacity-0 -translate-x-2 group-hover/sub:opacity-100 group-hover/sub:translate-x-0 transition-all text-black"
                                />
                              </Link>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:gap-2.5 z-10">
              <Link to="/shop" className="site-header__cta-shop">
                Shop <ArrowRight size={14} />
              </Link>

              <Link to="/favorites" className="site-header__icon-btn hidden sm:flex" aria-label="Favorites">
                <Heart size={18} strokeWidth={1.75} />
              </Link>

              <Link to="/cart" className="site-header__icon-btn relative" aria-label="Cart">
                <ShoppingCart size={18} strokeWidth={1.75} />
                {cartCount > 0 && (
                  <span className="site-header__cart-badge">{cartCount}</span>
                )}
              </Link>

              {currentUser ? (
                <div
                  className="relative hidden lg:block"
                  onMouseEnter={() => setShowUserDropdown(true)}
                  onMouseLeave={() => setShowUserDropdown(false)}
                >
                  <button type="button" className="site-header__icon-btn !w-10 !h-10" aria-label="Account">
                    <span className="text-xs font-bold text-black">{initials || <User size={16} />}</span>
                  </button>
                  <AnimatePresence>
                    {showUserDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white/95 backdrop-blur-xl border border-stone-200/80 shadow-xl overflow-hidden"
                      >
                        <div className="px-4 py-3 border-b border-stone-100 bg-stone-50/80">
                          <p className="text-sm font-semibold text-black truncate font-body-premium">
                            {profileName || 'Account'}
                          </p>
                          <p className="text-xs text-black/60 truncate">{currentUser.email}</p>
                        </div>
                        <div className="py-1">
                          {[
                            { to: '/account', icon: User, label: 'My Account' },
                            { to: '/orders', icon: Package, label: 'Orders' },
                            { to: '/favorites', icon: Heart, label: 'Favorites' },
                          ].map(({ to, icon: Icon, label }) => (
                            <Link
                              key={to}
                              to={to}
                              className="flex items-center gap-3 px-4 py-2.5 text-sm text-black hover:bg-black/5 font-body-premium"
                            >
                              <Icon size={16} />
                              {label}
                            </Link>
                          ))}
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-black hover:bg-black/5 font-body-premium"
                          >
                            <LogOut size={16} />
                            Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="site-header__icon-btn hidden lg:flex"
                  aria-label="Sign in"
                >
                  <User size={18} strokeWidth={1.75} />
                </Link>
              )}

              <button
                type="button"
                onClick={() => setIsMenuOpen(true)}
                className="site-header__icon-btn lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="site-header__overlay lg:hidden"
              aria-label="Close menu"
              onClick={() => setIsMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="site-header__drawer lg:hidden"
            >
              <div className="flex items-center justify-between p-5 border-b border-stone-200/80">
                <Link to="/" className="flex items-center gap-3" onClick={() => setIsMenuOpen(false)}>
                  <img src={logo} alt="" className="h-12 w-12 sm:h-14 sm:w-14 object-contain" />
                  <span className="font-display text-lg text-black">{siteName}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="site-header__icon-btn"
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <nav className="p-6" aria-label="Mobile navigation">
                {navigation.map((item) => (
                  <div key={item.name}>
                    <Link
                      to={item.href}
                      className={`site-header__drawer-link ${
                        isNavActive(location.pathname, item.href) ? 'site-header__drawer-link--active' : ''
                      }`}
                      onClick={() => !item.submenu?.length && setIsMenuOpen(false)}
                    >
                      {item.name}
                    </Link>
                    {item.submenu?.length > 0 && (
                      <div className="pl-4 pb-4 space-y-2">
                        {item.submenu.map((sub) => (
                          <Link
                            key={sub.name}
                            to={sub.href}
                            className="block text-sm text-black/80 hover:text-black font-body-premium py-1"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>

              <div className="px-6 pb-8 space-y-4">
                <Link
                  to="/shop"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-full bg-black text-white font-semibold"
                >
                  Shop now <ArrowRight size={18} />
                </Link>

                <div className="flex gap-3 pt-4 border-t border-stone-200/80">
                  <a
                    href="tel:+917337334653"
                    className="flex items-center gap-2 text-sm text-black"
                  >
                    <Phone size={16} /> Call
                  </a>
                  <a
                    href="mailto:contact@amruthabindu.in"
                    className="flex items-center gap-2 text-sm text-black"
                  >
                    <Mail size={16} /> Email
                  </a>
                </div>

                {!currentUser && (
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block text-center text-sm font-semibold text-black"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header
