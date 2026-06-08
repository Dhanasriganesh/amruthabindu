import React, { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Menu,
  X,
  User,
  ShoppingCart,
  Heart,
  ChevronDown,
  ChevronRight,
  LogOut,
  Package,
  Search,
  Home,
  ShoppingBag,
  Cookie,
  Leaf,
  Info,
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

const MOBILE_MENU_ITEMS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Shop', href: '/shop', icon: ShoppingBag },
  { name: 'Foods', href: '/shop/foods', icon: Cookie },
  { name: 'Naturals', href: '/shop/naturals', icon: Leaf },
  { name: 'Track Order', href: '/orders', icon: Package },
  { name: 'About', href: '/about', icon: Info },
  { name: 'Contact Us', href: '/contact', icon: Mail },
]

const menuPanelVariants = {
  hidden: { opacity: 0, y: -12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
  },
}

const menuContentVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.12 },
  },
  exit: {
    transition: { staggerChildren: 0.04, staggerDirection: -1 },
  },
}

const menuItemVariants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', stiffness: 400, damping: 32 },
  },
  exit: {
    opacity: 0,
    x: 16,
    transition: { duration: 0.18 },
  },
}

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
  const [mobileSearch, setMobileSearch] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [headerData, setHeaderData] = useState(DEFAULT_HEADER)
  const location = useLocation()
  const navigate = useNavigate()
  const searchInputRef = useRef(null)
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
    setMobileSearch('')
  }, [location.pathname])

  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const openMobileMenu = (focusSearch = false) => {
    setIsMenuOpen(true)
    if (focusSearch) {
      setTimeout(() => searchInputRef.current?.focus(), 280)
    }
  }

  const handleMobileSearch = (e) => {
    e.preventDefault()
    const query = mobileSearch.trim()
    setIsMenuOpen(false)
    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : '/shop')
  }

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
        className={`site-header font-body-premium ${scrolled ? 'site-header--scrolled' : 'site-header--top'} ${isMenuOpen ? 'site-header--menu-open' : ''}`}
      >
        {/* Mobile — floating pill bar */}
        <div className="site-header__mobile lg:hidden">
          <div className="site-header__mobile-pill">
            <button
              type="button"
              onClick={() => openMobileMenu(false)}
              className="site-header__mobile-icon"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              <Menu size={22} strokeWidth={1.75} />
            </button>

            <Link to="/" className="site-header__mobile-logo-link" aria-label={siteName}>
              <img src={logo} alt={siteName} className="site-header__mobile-logo" />
            </Link>

            <div className="site-header__mobile-actions">
              <button
                type="button"
                onClick={() => openMobileMenu(true)}
                className="site-header__mobile-icon"
                aria-label="Search products"
              >
                <Search size={20} strokeWidth={1.75} />
              </button>

              <Link
                to={currentUser ? '/account' : '/login'}
                className="site-header__mobile-icon"
                aria-label={currentUser ? 'Account' : 'Sign in'}
              >
                {currentUser && initials ? (
                  <span className="text-[10px] font-bold">{initials}</span>
                ) : (
                  <User size={20} strokeWidth={1.75} />
                )}
              </Link>

              <Link to="/cart" className="site-header__mobile-icon relative" aria-label="Cart">
                <ShoppingCart size={20} strokeWidth={1.75} />
                {cartCount > 0 && <span className="site-header__cart-badge">{cartCount}</span>}
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 site-header__container hidden lg:block">
          <div className="relative flex items-center justify-between gap-2 site-header__bar">
            <Link to="/" className="flex items-center gap-4 group z-10 shrink-0">
              <div className="relative shrink-0">
                <img
                  src={logo}
                  alt={siteName}
                  className="site-header__logo-img transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="leading-tight">
                <span className="font-display text-xl text-black tracking-tight block">{siteName}</span>
                <span className="text-[11px] uppercase tracking-[0.22em] text-black/70 font-medium">
                  {tagline}
                </span>
              </div>
            </Link>

            <nav
              className="absolute left-1/2 -translate-x-1/2 flex items-center"
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
                          <p className="site-header__mega-label px-3 pb-2 mb-1">Collections</p>
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

            <div className="flex items-center gap-2.5 z-10 shrink-0">
              <Link to="/shop" className="site-header__cta-shop">
                Shop <ArrowRight size={14} />
              </Link>
              <Link to="/favorites" className="site-header__icon-btn" aria-label="Favorites">
                <Heart size={18} strokeWidth={1.75} />
              </Link>
              <Link to="/cart" className="site-header__icon-btn relative" aria-label="Cart">
                <ShoppingCart size={18} strokeWidth={1.75} />
                {cartCount > 0 && <span className="site-header__cart-badge">{cartCount}</span>}
              </Link>

              {currentUser ? (
                <div
                  className="relative"
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
                <Link to="/login" className="site-header__icon-btn" aria-label="Sign in">
                  <User size={18} strokeWidth={1.75} />
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile full-screen menu */}
      <AnimatePresence>
        {isMenuOpen && (
            <motion.aside
              variants={menuPanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="site-header__mobile-menu lg:hidden"
            >
              <div className="site-header__mobile-menu-header">
                <div className="site-header__mobile-menu-header-spacer" aria-hidden="true" />
                <img src={logo} alt={siteName} className="site-header__mobile-menu-logo" />
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(false)}
                  className="site-header__mobile-menu-close"
                  aria-label="Close menu"
                >
                  <X size={22} strokeWidth={1.75} />
                </button>
              </div>

              <motion.div
                className="site-header__mobile-menu-inner"
                variants={menuContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.form
                  onSubmit={handleMobileSearch}
                  className="site-header__mobile-search"
                  variants={menuItemVariants}
                >
                  <Search size={16} strokeWidth={1.5} className="site-header__mobile-search-icon" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={mobileSearch}
                    onChange={(e) => setMobileSearch(e.target.value)}
                    placeholder="Search natural products..."
                    className="site-header__mobile-search-input"
                  />
                </motion.form>

                <motion.nav
                  className="site-header__mobile-nav"
                  aria-label="Mobile navigation"
                  variants={menuContentVariants}
                >
                  {MOBILE_MENU_ITEMS.map((item) => {
                    const Icon = item.icon
                    const active = isNavActive(location.pathname, item.href)
                    return (
                      <motion.div key={item.name} variants={menuItemVariants}>
                        <Link
                          to={item.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`site-header__mobile-nav-item ${active ? 'site-header__mobile-nav-item--active' : ''}`}
                        >
                          <span className="site-header__mobile-nav-icon">
                            <Icon size={17} strokeWidth={1.5} />
                          </span>
                          <span className="site-header__mobile-nav-label">{item.name}</span>
                          <ChevronRight size={15} strokeWidth={1.75} className="site-header__mobile-nav-chevron" />
                        </Link>
                      </motion.div>
                    )
                  })}
                </motion.nav>

                <motion.div className="site-header__mobile-promo" variants={menuItemVariants}>
                  <p className="site-header__mobile-promo-title">Pure. Rooted. Trusted.</p>
                  <p className="site-header__mobile-promo-text">
                    Crafted with nature. Delivered with care.
                  </p>
                  <Leaf
                    size={56}
                    strokeWidth={1}
                    className="site-header__mobile-promo-leaf"
                    aria-hidden="true"
                  />
                </motion.div>
              </motion.div>
            </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

export default Header
