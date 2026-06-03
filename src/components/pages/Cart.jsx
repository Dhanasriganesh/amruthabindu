import React, { useEffect, useState } from 'react'
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft, Shield, Package, Heart, ArrowRight, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useCart } from '../../contexts/CartContext'
import { fetchProducts } from '../../services/products'

function Cart() {
  const { items: cartItems, updateQuantity, removeFromCart, getCartTotal, getCartSavings } = useCart()
  const [catalog, setCatalog] = useState([])

  useEffect(() => {
    fetchProducts({}).then(setCatalog)
  }, [])

  const findProduct = (productId) =>
    catalog.find((p) => p.id === productId || p.id === parseInt(productId))

  const handleUpdateQuantity = (id, size, newQuantity) => {
    updateQuantity(id, size, newQuantity)
  }

  const handleRemoveItem = (id, size) => {
    removeFromCart(id, size)
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-18">
          <div className="text-center max-w-md mx-auto">
            <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="text-stone-400" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-stone-900 mb-3" style={{ fontFamily: 'Playfair Display, serif' }}>
              Your cart is empty
            </h1>
            <p className="text-lg text-stone-600 mb-8">
              Discover our natural products and start your wellness journey
            </p>
            <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
              Start Shopping
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const subtotal = getCartTotal()
  const savings = getCartSavings()
  const shipping = 0 // Free shipping
  const total = subtotal + shipping - savings

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-7">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-stone-900" style={{ fontFamily: 'Playfair Display, serif' }}>
                Shopping Cart
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-stone-600 mt-1">
                {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
            <Link
              to="/shop"
              className="hidden md:inline-flex items-center gap-2 text-[#2d5f3f] text-sm lg:text-base font-semibold hover:gap-4 transition-all"
            >
              <ArrowLeft size={16} className="lg:w-[18px] lg:h-[18px]" />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-7 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-3 sm:space-y-4">
              {cartItems.map((item) => {
                const isBundleItem = item.bundleSelection && item.bundleSelection.length > 0

                return (
                  <div
                    key={`${item.id}-${item.size}`}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-stone-100"
                  >
                    <div className="p-4 sm:p-5">
                      <div className="flex gap-3 sm:gap-4 lg:gap-6">
                        {/* Product Image */}
                        <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 flex-shrink-0 bg-gradient-to-br from-stone-50 to-stone-100 rounded-lg sm:rounded-xl overflow-hidden">
                          {item.image ? (
                            <Link to={`/shop/product/${item.id}`}>
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                              />
                            </Link>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-stone-400">
                              <Package size={24} className="sm:w-8 sm:h-8" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2 sm:mb-3">
                            <div className="flex-1 pr-2">
                              <Link to={`/shop/product/${item.id}`}>
                                <h3 className="text-sm sm:text-base lg:text-lg font-bold text-stone-900 hover:text-[#2d5f3f] transition-colors mb-1 line-clamp-1">
                                  {item.name}
                                  {isBundleItem && (
                                    <span className="ml-1 sm:ml-2 inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-amber-100 text-amber-800">
                                      Bundle
                                    </span>
                                  )}
                                </h3>
                              </Link>
                              <p className="text-xs sm:text-sm text-stone-600">
                                {item.category.replace('-', ' ')} • {item.size}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveItem(item.id, item.size)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 sm:p-2 rounded-lg transition-all flex-shrink-0"
                              aria-label="Remove item"
                            >
                              <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>
                          </div>

                          {/* Quantity & Price */}
                          <div className="flex items-center justify-between">
                            {/* Quantity Controls */}
                            <div className="flex items-center gap-2 sm:gap-3">
                              <span className="text-xs sm:text-sm font-medium text-stone-600 hidden sm:inline">Qty:</span>
                              <div className="flex items-center bg-stone-100 rounded-lg">
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.size, item.quantity - 1)}
                                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-stone-200 rounded-l-lg transition-colors"
                                  disabled={item.quantity <= 1}
                                >
                                  <Minus size={14} className="sm:w-4 sm:h-4" />
                                </button>
                                <span className="w-10 sm:w-12 text-center font-semibold text-sm sm:text-base text-stone-900">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() => handleUpdateQuantity(item.id, item.size, item.quantity + 1)}
                                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center hover:bg-stone-200 rounded-r-lg transition-colors"
                                  disabled={item.maxStock && item.quantity >= item.maxStock}
                                >
                                  <Plus size={14} className="sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <div className="text-[10px] sm:text-xs lg:text-sm text-stone-500 mb-0.5 sm:mb-1">
                                ₹{item.price} each
                              </div>
                              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#2d5f3f]">
                                ₹{item.price * item.quantity}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bundle Items Display */}
                      {isBundleItem && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-stone-200">
                          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-3 sm:p-4 border border-amber-200">
                            <div className="flex items-center gap-2 mb-2 sm:mb-3">
                              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-amber-700 flex-shrink-0" />
                              <span className="text-xs sm:text-sm font-bold text-amber-900">
                                Hamper Contents:
                              </span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                              {item.bundleSelection.map((productId) => {
                                const product = findProduct(productId)
                                return product ? (
                                  <div key={productId} className="flex items-center gap-2 text-xs sm:text-sm text-stone-700">
                                    <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-amber-600 rounded-full flex-shrink-0"></div>
                                    <span className="line-clamp-1">{product.name} (200g)</span>
                                  </div>
                                ) : null
                              })}
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-700">
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-amber-600 rounded-full flex-shrink-0"></div>
                                <span>2 Colorful Diyas Set</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-stone-700">
                                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-amber-600 rounded-full flex-shrink-0"></div>
                                <span>Premium Gift Packaging</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Mobile CTA */}
            <Link
              to="/shop"
              className="md:hidden mt-4 sm:mt-6 btn-outline w-full inline-flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
              Continue Shopping
            </Link>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-5 lg:p-6 lg:sticky lg:top-24 border border-stone-100">
              <h2 className="text-xl sm:text-2xl font-bold text-stone-900 mb-4 sm:mb-6" style={{ fontFamily: 'Playfair Display, serif' }}>
                Order Summary
              </h2>

              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex justify-between text-stone-600 text-sm sm:text-base">
                  <span>Subtotal ({cartItems.length} items)</span>
                  <span className="font-semibold">₹{subtotal}</span>
                </div>

                {savings > 0 && (
                  <div className="flex justify-between text-green-600 text-sm sm:text-base">
                    <span className="flex items-center gap-1">
                      <Tag size={14} className="sm:w-4 sm:h-4" />
                      Savings
                    </span>
                    <span className="font-semibold">-₹{savings}</span>
                  </div>
                )}

                <div className="flex justify-between text-stone-600 text-sm sm:text-base">
                  <span>Shipping</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-stone-200">
                  <div className="flex justify-between items-baseline">
                    <span className="text-base sm:text-lg font-semibold text-stone-900">Total</span>
                    <div className="text-right">
                      <div className="text-2xl sm:text-3xl font-bold text-[#2d5f3f]">₹{total}</div>
                      <div className="text-xs sm:text-sm text-stone-500">Inclusive of all taxes</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center gap-2 sm:gap-3 text-emerald-800">
                    <Shield size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                    <span>Secure & Safe Payment</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-emerald-800">
                    <Package size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                    <span>Free Shipping on All Orders</span>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 text-emerald-800">
                    <Heart size={16} className="sm:w-[18px] sm:h-[18px] flex-shrink-0" />
                    <span>100% Natural Products</span>
                  </div>
                </div>
              </div>

              {/* Checkout Button */}
              <Link
                to="/checkout"
                className="btn-primary w-full text-center py-3 sm:py-4 text-base sm:text-lg flex items-center justify-center gap-2 mb-3"
              >
                Proceed to Checkout
                <ArrowRight size={18} className="sm:w-5 sm:h-5" />
              </Link>

              <Link
                to="/shop"
                className="btn-outline w-full text-center py-2.5 sm:py-3 text-sm sm:text-base flex items-center justify-center gap-2"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart
