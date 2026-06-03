import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Gift, Package } from 'lucide-react'
import { fetchProductById, fetchProducts } from '../../services/products'
import BundleSelector from './BundleSelector'

function BundlePage() {
  const { id } = useParams()
  const [bundleProduct, setBundleProduct] = useState(null)
  const [catalog, setCatalog] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [totalPrice, setTotalPrice] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      const [product, all] = await Promise.all([
        fetchProductById(id),
        fetchProducts({}),
      ])
      if (cancelled) return
      setCatalog(all)
      if (product && product.type === 'bundle') {
        setBundleProduct(product)
        setTotalPrice(product.basePrice || product.sizes?.[0]?.price || 0)
      }
    }
    load()
    return () => { cancelled = true }
  }, [id])

  const findProduct = (productId) =>
    catalog.find((p) => p.id === productId || p.id === parseInt(productId))

  const handleSelectionChange = (products) => {
    setSelectedProducts(products)
  }

  const handlePriceChange = (price) => {
    setTotalPrice(price)
  }

  const generateWhatsAppMessage = () => {
    if (!bundleProduct || selectedProducts.length === 0) return ''

    const selectedProductNames = selectedProducts
      .map((productId) => {
        const product = findProduct(productId)
        return product ? product.name : 'Unknown Product'
      })
      .join(', ')

    const message = `🎁 *Diwali Hamper Inquiry*

*Selected Products:*
${selectedProductNames}

*Total Items:* ${selectedProducts.length}
*Estimated Price:* ₹${totalPrice}

Hi! I'm interested in customizing a Diwali hamper with the above products. Please let me know the final price and availability.

Thank you!`

    return encodeURIComponent(message)
  }

  const handleWhatsAppInquiry = () => {
    if (selectedProducts.length < (bundleProduct?.bundleConfig?.minSelections || 5)) {
      alert(`Please select at least ${bundleProduct?.bundleConfig?.minSelections || 5} products before inquiring.`)
      return
    }

    const message = generateWhatsAppMessage()
    const phone = import.meta.env.VITE_WHATSAPP_PHONE || '917337334653'
    const whatsappUrl = `https://wa.me/${phone}?text=${message}`
    window.open(whatsappUrl, '_blank')
  }

  if (!bundleProduct) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-stone-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stone-900 mb-2">Bundle Not Found</h2>
          <p className="text-stone-600 mb-6">The requested bundle could not be found.</p>
          <Link to="/shop" className="btn-primary">
            Back to Shop
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 text-stone-600 hover:text-stone-900 transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            Back to Shop
          </Link>

          <div className="flex items-start gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift className="w-10 h-10 sm:w-12 sm:h-12 text-orange-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-2">
                {bundleProduct.name}
              </h1>
              <p className="text-stone-600 mb-4">{bundleProduct.description}</p>
              <div className="flex items-center gap-4 text-sm text-stone-500">
                <span>⭐ {bundleProduct.rating} ({bundleProduct.reviews} reviews)</span>
                <span>🎁 Customizable Hamper</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <BundleSelector
            bundleProduct={bundleProduct}
            onSelectionChange={handleSelectionChange}
            onPriceChange={handlePriceChange}
          />
        </div>

        {selectedProducts.length > 0 && (
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Ready to Order?</h3>
                <p className="text-gray-600">Inquire about your custom hamper via WhatsApp</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-gray-900 mb-2">Your Selection:</h4>
              <ul className="space-y-1 text-sm text-gray-700">
                {selectedProducts.map((productId) => {
                  const product = findProduct(productId)
                  return (
                    <li key={productId} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {product?.name || 'Unknown Product'}
                    </li>
                  )
                })}
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total Items:</span>
                  <span className="font-bold text-green-600">{selectedProducts.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Estimated Price:</span>
                  <span className="font-bold text-green-600">₹{totalPrice}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleWhatsAppInquiry}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <MessageCircle size={24} />
              Inquire via WhatsApp
            </button>

            <p className="text-xs text-gray-500 text-center mt-3">
              We'll respond within 24 hours with final pricing and availability
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default BundlePage
