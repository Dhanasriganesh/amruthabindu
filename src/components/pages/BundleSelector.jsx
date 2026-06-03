import React, { useState, useEffect } from 'react'
import { Check, Package, Gift } from 'lucide-react'
import { fetchProducts } from '../../services/products'

function BundleSelector({ bundleProduct, onSelectionChange, onPriceChange }) {
  const [selectedProducts, setSelectedProducts] = useState([])
  const [catalog, setCatalog] = useState([])
  const effectiveBasePrice =
    typeof bundleProduct.basePrice === 'number'
      ? bundleProduct.basePrice
      : bundleProduct?.sizes?.[0]?.price ?? 0
  const [totalPrice, setTotalPrice] = useState(effectiveBasePrice)

  const bundleConfig = bundleProduct.bundleConfig || {}
  const minSelections = bundleConfig.minSelections ?? 5
  const maxSelections = bundleConfig.maxSelections ?? 10
  const defaultSize = bundleConfig.defaultSize || '50g'

  useEffect(() => {
    fetchProducts({}).then(setCatalog)
  }, [])

  const nonBundleProducts = catalog.filter((p) => p.type !== 'bundle')
  const selectableIds =
    Array.isArray(bundleConfig.selectableProducts) && bundleConfig.selectableProducts.length > 0
      ? bundleConfig.selectableProducts
      : nonBundleProducts.map((p) => p.id)
  const availableProducts = nonBundleProducts.filter((p) => selectableIds.includes(p.id))

  useEffect(() => {
    let price = effectiveBasePrice

    selectedProducts.forEach((productId) => {
      const product = catalog.find((p) => p.id === productId)
      if (product) {
        const sizeVariant = product.sizes?.find((s) => s.size === defaultSize)
        if (sizeVariant) {
          price += sizeVariant.price
        }
      }
    })

    setTotalPrice(price)
    onPriceChange?.(price)
  }, [selectedProducts, effectiveBasePrice, defaultSize, onPriceChange, catalog])

  useEffect(() => {
    onSelectionChange?.(selectedProducts)
  }, [selectedProducts, onSelectionChange])

  const toggleProduct = (productId) => {
    setSelectedProducts((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId)
      }
      if (prev.length >= maxSelections) {
        alert(`You can select up to ${maxSelections} products`)
        return prev
      }
      return [...prev, productId]
    })
  }

  if (availableProducts.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        No products available for this hamper. Add products in the admin panel and configure
        bundle selectable products.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-amber-800">
        <Gift size={20} />
        <h3 className="font-semibold">Customize Your Hamper</h3>
      </div>
      <p className="text-sm text-stone-600">
        Select {minSelections}–{maxSelections} products ({selectedProducts.length} selected)
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {availableProducts.map((product) => {
          const isSelected = selectedProducts.includes(product.id)
          const sizeVariant = product.sizes?.find((s) => s.size === defaultSize)
          const addOnPrice = sizeVariant?.price || 0

          return (
            <button
              key={product.id}
              type="button"
              onClick={() => toggleProduct(product.id)}
              className={`flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                isSelected
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-stone-200 hover:border-amber-300'
              }`}
            >
              <div
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 ${
                  isSelected ? 'bg-amber-500 border-amber-500' : 'border-stone-300'
                }`}
              >
                {isSelected && <Check size={14} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Package size={16} className="text-amber-700 flex-shrink-0" />
                  <span className="font-medium text-stone-900 truncate">{product.name}</span>
                </div>
                {addOnPrice > 0 && (
                  <p className="text-xs text-stone-500 mt-1">+₹{addOnPrice} ({defaultSize})</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <div className="pt-4 border-t border-stone-200">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-stone-900">Estimated Total:</span>
          <span className="text-xl font-bold text-amber-800">₹{totalPrice}</span>
        </div>
      </div>
    </div>
  )
}

export default BundleSelector
