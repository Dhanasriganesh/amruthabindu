import React, { useState, useEffect } from 'react'
import { useLocation, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Filter,
  Grid,
  List,
  Star,
  ShoppingCart,
  Heart,
  Leaf,
  ArrowRight,
  Search,
} from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { fetchProducts } from '../../services/products'
import {
  SHOP_CATEGORIES,
  CATEGORY_SLUGS,
  getCategoryFromPath,
  getCategoryLabel,
  normalizeCategorySlug,
} from '../../constants/categories'

function useQuery() {
  const { search } = useLocation()
  return React.useMemo(() => new URLSearchParams(search), [search])
}

function Products() {
  const location = useLocation()
  const navigate = useNavigate()
  const query = useQuery()
  const { addToCart } = useCart()
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_SLUGS.ALL)
  const [selectedProductSizes, setSelectedProductSizes] = useState({})
  const [sortBy, setSortBy] = useState('name')
  const [viewMode, setViewMode] = useState('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('favorites') || '[]')
    } catch {
      return []
    }
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const list = await fetchProducts({})
      if (!cancelled) {
        setProducts(list)
        setFilteredProducts(list)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const q = query.get('q') || ''
    if (q) setSearchQuery(q)
  }, [query])

  useEffect(() => {
    const categoryFromPath = getCategoryFromPath(location.pathname)
    setSelectedCategory(categoryFromPath)
  }, [location.pathname])

  useEffect(() => {
    let filtered = [...products]

    if (selectedCategory !== CATEGORY_SLUGS.ALL) {
      filtered = filtered.filter(
        (product) => normalizeCategorySlug(product.category) === selectedCategory
      )
    }

    if (searchQuery) {
      const key = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (product) =>
          product.name?.toLowerCase().includes(key) ||
          product.description?.toLowerCase().includes(key) ||
          product.ingredients?.toLowerCase().includes(key) ||
          getCategoryLabel(product.category).toLowerCase().includes(key)
      )
    }

    filtered.sort((a, b) => {
      const priorityDiff = (b.priority || 0) - (a.priority || 0)
      if (priorityDiff !== 0) return priorityDiff

      switch (sortBy) {
        case 'price-low':
          return (a.sizes?.[0]?.price || 0) - (b.sizes?.[0]?.price || 0)
        case 'price-high':
          return (b.sizes?.[0]?.price || 0) - (a.sizes?.[0]?.price || 0)
        case 'rating':
          return (b.rating || 0) - (a.rating || 0)
        case 'reviews':
          return (b.reviews || 0) - (a.reviews || 0)
        default:
          return (a.name || '').localeCompare(b.name || '')
      }
    })

    setFilteredProducts(filtered)
  }, [selectedCategory, sortBy, searchQuery, products])

  const handleCategoryChange = (category) => {
    const item = SHOP_CATEGORIES.find((c) => c.value === category)
    if (item) navigate(item.href)
  }

  const handleAddToCart = (product) => {
    const selectedSize = selectedProductSizes[product.id] || product.sizes?.[0]?.size
    const sizeObj = product.sizes?.find((size) => size.size === selectedSize)
    if (sizeObj) addToCart(product, sizeObj, 1)
  }

  const handleSizeSelect = (productId, size) => {
    setSelectedProductSizes((prev) => ({ ...prev, [productId]: size }))
  }

  const toggleFavorite = (productId) => {
    setFavorites((prev) => {
      const exists = prev.includes(productId)
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId]
      localStorage.setItem('favorites', JSON.stringify(next))
      return next
    })
  }

  const activeMeta = SHOP_CATEGORIES.find((c) => c.value === selectedCategory) || SHOP_CATEGORIES[0]
  const heroTitle =
    selectedCategory === CATEGORY_SLUGS.ALL
      ? 'Shop'
      : activeMeta.label

  return (
    <div className="shop-page font-body-premium">
      <section className="shop-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <p className="home-section-label mb-3">Collections</p>
          <h1 className="shop-hero__title font-display">{heroTitle}</h1>
          <p className="shop-hero__subtitle">{activeMeta.description}</p>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="shop-category-tabs flex-1">
              {SHOP_CATEGORIES.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => handleCategoryChange(category.value)}
                  className={`shop-category-tab inline-flex items-center gap-2 ${
                    selectedCategory === category.value ? 'shop-category-tab--active' : ''
                  }`}
                >
                  <span aria-hidden>{category.icon}</span>
                  {category.shortLabel}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64 shrink-0">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none"
              />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products…"
                className="w-full pl-10 pr-4 py-2.5 rounded-full border border-stone-200 bg-white/90 text-sm text-[var(--shop-ink)] focus:outline-none focus:ring-2 focus:ring-[var(--shop-forest)]/30"
              />
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16">
        <div className="shop-toolbar mb-6 sm:mb-8">
          <div className="flex md:hidden items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-stone-100 text-sm font-medium"
            >
              <Filter size={16} />
              Sort
            </button>
            <span className="text-sm text-stone-500">
              {filteredProducts.length} items
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-[var(--shop-forest)] text-white' : 'bg-stone-100'}`}
                aria-label="Grid view"
              >
                <Grid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-[var(--shop-forest)] text-white' : 'bg-stone-100'}`}
                aria-label="List view"
              >
                <List size={16} />
              </button>
            </div>
          </div>

          <div className="hidden md:flex flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-stone-600">
              <span className="font-medium text-sm">Sort by</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 text-sm border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[var(--shop-forest)]/30"
              >
                <option value="name">Name (A–Z)</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviews</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-stone-600 font-medium">
                {filteredProducts.length}{' '}
                {filteredProducts.length === 1 ? 'product' : 'products'}
              </span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-[var(--shop-forest)] text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[var(--shop-forest)] text-white'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                  aria-label="List view"
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {showFilters && (
            <div className="md:hidden mt-3 pt-3 border-t border-stone-200">
              <label className="block text-sm font-medium text-stone-700 mb-2">Sort by</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg"
              >
                <option value="name">Name (A–Z)</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
                <option value="reviews">Most Reviews</option>
              </select>
            </div>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="shop-empty text-center py-16 sm:py-20 px-6">
            <Leaf size={48} className="mx-auto text-stone-300 mb-4" />
            {products.length === 0 ? (
              <>
                <h3 className="font-display text-2xl text-[var(--shop-ink)] mb-2">No products yet</h3>
                <p className="text-stone-600 text-sm max-w-md mx-auto">
                  Add products in the admin panel — they are saved to Firebase under{' '}
                  <code className="text-xs bg-stone-100 px-1 rounded">cms/products</code>.
                </p>
              </>
            ) : (
              <>
                <h3 className="font-display text-2xl text-[var(--shop-ink)] mb-2">No matches</h3>
                <p className="text-stone-600 text-sm mb-6">Try another category or search term.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('')
                    navigate('/shop')
                  }}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--shop-forest)] text-white font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  View all <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredProducts.map((product, idx) => (
              <ProductListRow
                key={product.id}
                product={product}
                idx={idx}
                selectedSize={selectedProductSizes[product.id] || product.sizes?.[0]?.size}
                sizeObj={
                  product.sizes?.find(
                    (s) => s.size === (selectedProductSizes[product.id] || product.sizes?.[0]?.size)
                  ) || product.sizes?.[0]
                }
                isFavorite={favorites.includes(product.id)}
                onSizeSelect={handleSizeSelect}
                onAddToCart={handleAddToCart}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredProducts.map((product, idx) => (
              <ProductGridCard
                key={product.id}
                product={product}
                idx={idx}
                selectedSize={selectedProductSizes[product.id] || product.sizes?.[0]?.size}
                sizeObj={
                  product.sizes?.find(
                    (s) => s.size === (selectedProductSizes[product.id] || product.sizes?.[0]?.size)
                  ) || product.sizes?.[0]
                }
                isFavorite={favorites.includes(product.id)}
                onSizeSelect={handleSizeSelect}
                onAddToCart={handleAddToCart}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductGridCard({
  product,
  idx,
  selectedSize,
  sizeObj,
  isFavorite,
  onSizeSelect,
  onAddToCart,
  onToggleFavorite,
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(idx * 0.05, 0.35) }}
      className="shop-card group flex flex-col h-full"
    >
      <Link to={`/shop/product/${product.id}`} className="block relative aspect-square overflow-hidden">
        {product.images?.[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-stone-100 text-stone-400">
            <Leaf size={36} />
          </div>
        )}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onToggleFavorite(product.id)
          }}
          className={`absolute top-3 right-3 w-9 h-9 rounded-full bg-white/95 shadow flex items-center justify-center transition-transform hover:scale-110 ${
            isFavorite ? 'text-red-500' : 'text-stone-600'
          }`}
          aria-label="Favorite"
        >
          <Heart size={16} className={isFavorite ? 'fill-current' : ''} />
        </button>
      </Link>

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <span className="shop-card__badge w-fit mb-2">
          {getCategoryLabel(product.category)}
        </span>
        <Link to={`/shop/product/${product.id}`}>
          <h3 className="font-display text-lg sm:text-xl text-[var(--shop-ink)] leading-snug mb-2 group-hover:text-[var(--shop-forest)] transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center gap-1 mb-3">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={12}
              className={
                i < Math.floor(product.rating || 0)
                  ? 'text-amber-400 fill-current'
                  : 'text-stone-300'
              }
            />
          ))}
          <span className="text-xs text-stone-500 ml-1">({product.reviews || 0})</span>
        </div>

        {product.type !== 'bundle' && (
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-lg font-bold text-[var(--shop-forest)]">
              ₹{sizeObj?.price || 0}
            </span>
            <select
              value={selectedSize}
              onChange={(e) => onSizeSelect(product.id, e.target.value)}
              className="text-xs border border-stone-200 rounded-lg px-2 py-1 bg-white"
            >
              {product.sizes?.map((size) => (
                <option key={size.size} value={size.size}>
                  {size.size}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="mt-auto">
          {product.type === 'bundle' ? (
            <Link
              to={`/shop/product/${product.id}`}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[var(--shop-forest)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Customize hamper
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[var(--shop-forest)] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <ShoppingCart size={16} />
              Add to cart
            </button>
          )}
        </div>
      </div>
    </motion.article>
  )
}

function ProductListRow({
  product,
  idx,
  selectedSize,
  sizeObj,
  isFavorite,
  onSizeSelect,
  onAddToCart,
  onToggleFavorite,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(idx * 0.04, 0.3) }}
      className="shop-card flex flex-col sm:flex-row overflow-hidden"
    >
      <Link
        to={`/shop/product/${product.id}`}
        className="sm:w-44 h-36 sm:h-auto flex-shrink-0 relative bg-stone-100"
      >
        {product.images?.[0] ? (
          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-stone-400">
            <Leaf size={32} />
          </div>
        )}
      </Link>
      <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="shop-card__badge">{getCategoryLabel(product.category)}</span>
          <Link to={`/shop/product/${product.id}`}>
            <h3 className="font-display text-xl text-[var(--shop-ink)] mt-2 hover:text-[var(--shop-forest)]">
              {product.name}
            </h3>
          </Link>
          <p className="text-sm text-stone-600 mt-1 line-clamp-2">{product.description}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {product.type !== 'bundle' && (
            <>
              <span className="text-lg font-bold text-[var(--shop-forest)]">₹{sizeObj?.price || 0}</span>
              <select
                value={selectedSize}
                onChange={(e) => onSizeSelect(product.id, e.target.value)}
                className="text-xs border rounded-lg px-2 py-1"
              >
                {product.sizes?.map((size) => (
                  <option key={size.size} value={size.size}>
                    {size.size}
                  </option>
                ))}
              </select>
            </>
          )}
          <button
            type="button"
            onClick={() => onToggleFavorite(product.id)}
            className={`p-2 rounded-lg ${isFavorite ? 'text-red-500 bg-red-50' : 'bg-stone-100'}`}
          >
            <Heart size={18} className={isFavorite ? 'fill-current' : ''} />
          </button>
          {product.type === 'bundle' ? (
            <Link
              to={`/shop/product/${product.id}`}
              className="px-4 py-2 rounded-full bg-[var(--shop-forest)] text-white text-sm font-semibold"
            >
              Customize
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => onAddToCart(product)}
              className="px-4 py-2 rounded-full bg-[var(--shop-forest)] text-white text-sm font-semibold flex items-center gap-1"
            >
              <ShoppingCart size={16} />
              Add
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default Products
