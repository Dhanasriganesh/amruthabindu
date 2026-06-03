import { loadProductsFromSupabase } from './cms'
import { normalizeCategorySlug } from '../constants/categories'

/**
 * Load products from Firestore (cms/products). Returns [] when database is empty.
 * Clears stale localStorage cache when Firestore has no products.
 */
export async function loadProductsFromDatabase() {
  try {
    const remoteProducts = await loadProductsFromSupabase()
    if (remoteProducts && remoteProducts.length > 0) {
      return remoteProducts
    }
    localStorage.removeItem('products_data')
    localStorage.removeItem('admin_products')
    return []
  } catch (error) {
    console.warn('⚠️ Could not load products from Firebase:', error.message)
    const cached = localStorage.getItem('products_data')
    if (cached) {
      try {
        const parsed = JSON.parse(cached)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }
}

export async function fetchProducts(filters = {}) {
  let products = await loadProductsFromDatabase()

  if (filters.category && filters.category !== 'all') {
    const cat = normalizeCategorySlug(filters.category)
    products = products.filter((p) => normalizeCategorySlug(p.category) === cat)
  }

  if (filters.search) {
    const key = String(filters.search).toLowerCase()
    products = products.filter(
      (p) =>
        p.name?.toLowerCase().includes(key) ||
        p.description?.toLowerCase().includes(key) ||
        p.ingredients?.toLowerCase().includes(key) ||
        p.category?.toLowerCase().includes(key)
    )
  }

  products.sort((a, b) => {
    const priorityDiff = (b.priority || 0) - (a.priority || 0)
    if (priorityDiff !== 0) return priorityDiff
    return (a.name || '').localeCompare(b.name || '')
  })

  if (filters.limitCount) {
    products = products.slice(0, filters.limitCount)
  }

  return products
}

export async function fetchProductById(id) {
  const products = await loadProductsFromDatabase()
  return products.find((p) => p.id === parseInt(id) || p.id === String(id)) || null
}

export async function fetchRelated(product, count = 4) {
  if (!product) return []
  const items = await fetchProducts({ category: product.category, limitCount: count + 1 })
  return items.filter((p) => p.id !== product.id).slice(0, count)
}
