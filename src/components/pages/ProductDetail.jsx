import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ShoppingCart, Heart, Share2, Star, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { fetchProductById, fetchRelated, fetchProducts } from '../../services/products'
import { getCategoryLabel, normalizeCategorySlug, SHOP_CATEGORIES } from '../../constants/categories'
import { WHATSAPP_PHONE } from '../../config/brand'
import BundleSelector from './BundleSelector'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { currentUser } = useAuth()
  
  const [product, setProduct] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [relatedProducts, setRelatedProducts] = useState([])
  
  // Bundle product states
  const [selectedBundleProducts, setSelectedBundleProducts] = useState([])
  const [bundlePrice, setBundlePrice] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const prod = await fetchProductById(id)
      if (!prod) {
        navigate('/shop')
        return
      }
      if (cancelled) return
      setProduct(prod)
      setSelectedSize(prod.sizes?.[0] || null)
      const related = await fetchRelated(prod, 4)
      if (!cancelled) setRelatedProducts(related)
      const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
      if (!cancelled) setIsFavorite(favorites.includes(prod.id))
    }
    load()
    return () => { cancelled = true }
  }, [id, navigate])

  const handleAddToCart = () => {
    if (product && selectedSize) {
      // For bundle products, include selection info
      if (product.type === 'bundle') {
        const bundleConfig = product.bundleConfig || {}
        const minSelections = (bundleConfig.minSelections ?? 0)
        
        if (selectedBundleProducts.length < minSelections) {
          alert(`Please select at least ${minSelections} products for your hamper`)
          return
        }
        
        // Add bundle with selected products info
        addToCart(product, { 
          ...selectedSize, 
          price: (bundlePrice || product.basePrice || product.sizes?.[0]?.price || 0),
          bundleSelection: selectedBundleProducts 
        }, quantity)
      } else {
        addToCart(product, selectedSize, quantity)
      }
    }
  }

  const handleBuyNow = async () => {
    if (!product) return
    if (product.type === 'bundle') {
      const bundleConfig = product.bundleConfig || {}
      const minSelections = (bundleConfig.minSelections ?? 0)
      if (selectedBundleProducts.length < minSelections) {
        alert(`Please select at least ${minSelections} products for your hamper`)
        return
      }
      // Build WhatsApp message with actual product names
      const phone = WHATSAPP_PHONE
      const catalog = await fetchProducts({})
      const items = selectedBundleProducts.map(id => {
        const p = catalog.find((x) => x.id === id)
        return `- ${p?.name || 'Product ' + id} (50g)`
      }).join('%0A')
      const message = `Hello! Amrutha Bindu%0A%0AI would like to customize the Diwali Hamper.%0A%0AMy selected products:%0A${items}%0A%0APlease confirm price and availability.`
      const url = `https://wa.me/${phone}?text=${message}`
      window.open(url, '_blank')
      return
    }
    if (selectedSize) {
      addToCart(product, selectedSize, quantity)
      navigate('/cart')
    }
  }

  const toggleFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]')
    if (isFavorite) {
      const updated = favorites.filter(fav => fav !== product.id)
      localStorage.setItem('favorites', JSON.stringify(updated))
      setIsFavorite(false)
    } else {
      favorites.push(product.id)
      localStorage.setItem('favorites', JSON.stringify(favorites))
      setIsFavorite(true)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href
        })
      } catch (err) {
        console.log('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length)
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    )
  }

  const selectedSizeObj = selectedSize || product.sizes[0]

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-emerald-50">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center text-sm text-gray-600">
          <Link to="/home" className="hover:text-emerald-700">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/shop" className="hover:text-emerald-700">Store</Link>
          <span className="mx-2">/</span>
          <Link
            to={SHOP_CATEGORIES.find((c) => c.value === normalizeCategorySlug(product.category))?.href || '/shop'}
            className="hover:text-emerald-700"
          >
            {getCategoryLabel(product.category)}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </div>
      </div>

      {/* Main Product Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          
          {/* Image Gallery */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden group">
              <div className="aspect-square relative">
                <img 
                  src={product.images[currentImageIndex]} 
                  alt={`${product.name} ${currentImageIndex + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      currentImageIndex === index 
                        ? 'border-emerald-600 ring-2 ring-emerald-200' 
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <img 
                      src={image} 
                      alt={`Thumbnail ${index + 1}`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                {product.name}
              </h1>
              
              {/* Rating */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={18} 
                      className={i < Math.floor(product.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-600">
                  {product.rating} ({product.reviews} reviews)
                </span>
              </div>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-6">
                <span className="text-4xl font-bold text-emerald-700">
                  {product.type === 'bundle' ? '' : `₹${selectedSizeObj.price.toLocaleString('en-IN')}`}
                </span>
                {product.type === 'bundle' && (
                  <span className="text-sm text-gray-600">(Customize your hamper)</span>
                )}
              </div>
            </div>

            {/* Bundle Selector for Hamper Products */}
            {product.type === 'bundle' ? (
              <BundleSelector 
                bundleProduct={product}
                onSelectionChange={setSelectedBundleProducts}
                onPriceChange={setBundlePrice}
              />
            ) : (
              <>
                {/* Weight Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Weight
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSize.size}
                      onChange={(e) => {
                        const size = product.sizes.find(s => s.size === e.target.value)
                        setSelectedSize(size)
                      }}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white text-gray-900 font-medium"
                    >
                      {product.sizes.map((size, index) => (
                        <option key={index} value={size.size}>
                          {size.size} {index > 0 && `(+₹${(size.price - product.sizes[0].price).toLocaleString('en-IN')})`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check className="w-5 h-5" />
                  <span className="font-semibold">In stock</span>
                  <span className="text-gray-600">({selectedSizeObj.stock} available)</span>
                </div>

                {/* Quantity Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-3">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors font-semibold text-lg"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, Math.min(selectedSizeObj.stock, parseInt(e.target.value) || 1)))}
                      className="w-20 h-10 text-center border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 font-semibold"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(selectedSizeObj.stock, quantity + 1))}
                      className="w-10 h-10 flex items-center justify-center border-2 border-gray-300 rounded-lg hover:border-emerald-500 hover:bg-emerald-50 transition-colors font-semibold text-lg"
                    >
                      +
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {product.type !== 'bundle' && (
                <button
                  onClick={handleAddToCart}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-xl"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add To Cart
                </button>
              )}
              
              <button
                onClick={handleBuyNow}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors shadow-lg hover:shadow-xl"
              >
                {product.type === 'bundle' ? 'Enquire on WhatsApp' : 'Buy Now'}
              </button>
              
              <div className="flex gap-3">
                <button
                  onClick={toggleFavorite}
                  className={`flex-1 border-2 ${
                    isFavorite 
                      ? 'border-red-500 bg-red-50 text-red-600' 
                      : 'border-gray-300 hover:border-red-500 hover:bg-red-50 text-gray-700'
                  } font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors`}
                >
                  <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Favorited' : 'Favorite'}
                </button>
                
                <button
                  onClick={handleShare}
                  className="flex-1 border-2 border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 text-gray-700 font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
              </div>
            </div>

            {/* Product Information */}
            <div className="bg-emerald-50 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-gray-900 text-lg">Product Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-28">Weight:</span>
                  <span className="text-gray-600">{selectedSizeObj.weight}</span>
                </div>
                <div className="flex">
                  <span className="font-semibold text-gray-700 w-28">Category:</span>
                  <span className="text-gray-600">{getCategoryLabel(product.category)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-12 bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4">
              {showFullDescription ? product.fullDescription : product.description}
            </p>
            {!showFullDescription && (
              <button
                onClick={() => setShowFullDescription(true)}
                className="text-emerald-700 hover:text-emerald-800 font-semibold"
              >
                Show More
              </button>
            )}
            
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Benefits</h3>
                <p className="text-gray-700">{product.benefits}</p>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 mb-2">Key Ingredients</h3>
                <p className="text-gray-700">{product.ingredients}</p>
              </div>
            </div>
          </div>
        </div>

        {/* You May Also Like */}
        {relatedProducts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">You May Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  to={`/shop/product/${relatedProduct.id}`}
                  className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-shadow overflow-hidden"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={relatedProduct.images[0]}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-emerald-700">
                      {relatedProduct.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-emerald-700">
                        ₹{relatedProduct.sizes[0].price.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button className="mt-3 w-full bg-emerald-700 hover:bg-emerald-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm">
                      Buy Now
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProductDetail

