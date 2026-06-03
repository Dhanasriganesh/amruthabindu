import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import {
  normalizeProducts,
  productsNeedCategoryMigration,
} from '../constants/categories'

function ensureDb() {
  if (!db || !isFirebaseConfigured()) return null
  return db
}

// ==================== PRODUCTS ====================

export async function saveProducts(products) {
  const normalized = normalizeProducts(products)
  try {
    const firestore = ensureDb()
    if (!firestore) {
      localStorage.setItem('products_data', JSON.stringify(normalized))
      localStorage.setItem('admin_products', JSON.stringify(normalized))
      return { success: true, localOnly: true }
    }

    const productsRef = doc(firestore, 'cms', 'products')
    await setDoc(productsRef, {
      data: normalized,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'admin'
    })
    
    // Also cache in localStorage for performance
    localStorage.setItem('products_data', JSON.stringify(normalized))
    localStorage.setItem('admin_products', JSON.stringify(normalized))
    
    console.log('✅ Products saved to Firestore')
    return { success: true, migrated: productsNeedCategoryMigration(products) }
  } catch (error) {
    console.error('❌ Error saving products to Firestore:', error)
    return { success: false, error: error.message }
  }
}

/** Rewrite legacy skin/hair/oral categories to Foods / Naturals in Firestore */
export async function migrateProductCategoriesInFirestore() {
  const products = await loadProducts()
  if (!products.length) {
    return { success: true, migrated: 0, message: 'No products to migrate' }
  }
  if (!productsNeedCategoryMigration(products)) {
    return { success: true, migrated: 0, message: 'Categories already up to date' }
  }
  const normalized = normalizeProducts(products)
  const result = await saveProducts(normalized)
  const count = normalized.filter((p, i) => p.category !== products[i]?.category).length
  return {
    ...result,
    migrated: count || normalized.length,
    message: `Migrated ${count || normalized.length} product(s) to Foods / Naturals`,
  }
}

export async function loadProducts() {
  try {
    const firestore = ensureDb()
    if (!firestore) {
      const cached = localStorage.getItem('products_data')
      return cached ? normalizeProducts(JSON.parse(cached)) : []
    }

    const productsRef = doc(firestore, 'cms', 'products')
    const docSnap = await getDoc(productsRef)
    
    if (docSnap.exists()) {
      const raw = docSnap.data().data || []
      const products = normalizeProducts(raw)

      if (products.length > 0) {
        localStorage.setItem('products_data', JSON.stringify(products))
        localStorage.setItem('admin_products', JSON.stringify(products))
        console.log('✅ Products loaded from Firestore:', products.length)
        if (productsNeedCategoryMigration(raw)) {
          console.log('ℹ️ Legacy categories detected — run migrate in admin or save products to update Firestore')
        }
      } else {
        localStorage.removeItem('products_data')
        localStorage.removeItem('admin_products')
        console.log('ℹ️ No products in Firestore cms/products')
      }
      return products
    }

    localStorage.removeItem('products_data')
    localStorage.removeItem('admin_products')
    console.log('ℹ️ No products document in Firestore')
    return []
  } catch (error) {
    console.error('❌ Error loading products from Firestore:', error)
    
    // Fallback to localStorage
    const cached = localStorage.getItem('products_data')
    return cached ? normalizeProducts(JSON.parse(cached)) : []
  }
}

// ==================== HOME CONTENT ====================

export async function saveHomeContent(content) {
  try {
    const firestore = ensureDb()
    if (!firestore) {
      localStorage.setItem('home_content', JSON.stringify(content))
      localStorage.setItem('admin_home_content', JSON.stringify(content))
      return { success: true, localOnly: true }
    }

    const contentRef = doc(firestore, 'cms', 'homeContent')
    await setDoc(contentRef, {
      data: content,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'admin'
    })
    
    // Cache in localStorage
    localStorage.setItem('home_content', JSON.stringify(content))
    localStorage.setItem('admin_home_content', JSON.stringify(content))
    
    console.log('✅ Home content saved to Firestore')
    return { success: true }
  } catch (error) {
    console.error('❌ Error saving home content to Firestore:', error)
    return { success: false, error: error.message }
  }
}

export async function loadHomeContent() {
  try {
    const firestore = ensureDb()
    if (!firestore) {
      const cached = localStorage.getItem('home_content')
      return cached ? JSON.parse(cached) : null
    }

    const contentRef = doc(firestore, 'cms', 'homeContent')
    const docSnap = await getDoc(contentRef)
    
    if (docSnap.exists()) {
      const content = docSnap.data().data
      
      // Cache in localStorage
      localStorage.setItem('home_content', JSON.stringify(content))
      localStorage.setItem('admin_home_content', JSON.stringify(content))
      
      console.log('✅ Home content loaded from Firestore')
      return content
    } else {
      console.log('ℹ️ No home content found in Firestore')
      return null
    }
  } catch (error) {
    console.error('❌ Error loading home content from Firestore:', error)
    
    // Fallback to localStorage
    const cached = localStorage.getItem('home_content')
    return cached ? JSON.parse(cached) : null
  }
}

// ==================== HEADER CONTENT ====================

export async function saveHeaderContent(content) {
  try {
    const firestore = ensureDb()
    if (!firestore) {
      localStorage.setItem('header_content', JSON.stringify(content))
      localStorage.setItem('admin_header_content', JSON.stringify(content))
      return { success: true, localOnly: true }
    }

    const contentRef = doc(firestore, 'cms', 'headerContent')
    await setDoc(contentRef, {
      data: content,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'admin'
    })
    
    // Cache in localStorage
    localStorage.setItem('header_content', JSON.stringify(content))
    localStorage.setItem('admin_header_content', JSON.stringify(content))
    
    console.log('✅ Header content saved to Firestore')
    return { success: true }
  } catch (error) {
    console.error('❌ Error saving header content to Firestore:', error)
    return { success: false, error: error.message }
  }
}

export async function loadHeaderContent() {
  try {
    const firestore = ensureDb()
    if (!firestore) {
      const cached = localStorage.getItem('header_content')
      return cached ? JSON.parse(cached) : null
    }

    const contentRef = doc(firestore, 'cms', 'headerContent')
    const docSnap = await getDoc(contentRef)
    
    if (docSnap.exists()) {
      const content = docSnap.data().data
      
      // Cache in localStorage
      localStorage.setItem('header_content', JSON.stringify(content))
      localStorage.setItem('admin_header_content', JSON.stringify(content))
      
      console.log('✅ Header content loaded from Firestore')
      return content
    } else {
      console.log('ℹ️ No header content found in Firestore')
      return null
    }
  } catch (error) {
    console.error('❌ Error loading header content from Firestore:', error)
    
    // Fallback to localStorage
    const cached = localStorage.getItem('header_content')
    return cached ? JSON.parse(cached) : null
  }
}

// ==================== INITIALIZE CMS ====================

export async function initializeCMS() {
  try {
    console.log('🔄 Initializing CMS from Firestore...')
    
    // Load all CMS content
    const products = await loadProducts()
    const homeContent = await loadHomeContent()
    const headerContent = await loadHeaderContent()
    
    return {
      success: true,
      products,
      homeContent,
      headerContent
    }
  } catch (error) {
    console.error('❌ Error initializing CMS:', error)
    return { success: false, error: error.message }
  }
}

// ==================== SYNC CHECK ====================

export async function checkCMSSync() {
  try {
    const firestore = ensureDb()
    if (!firestore) return null

    const productsRef = doc(firestore, 'cms', 'products')
    const homeRef = doc(firestore, 'cms', 'homeContent')
    const headerRef = doc(firestore, 'cms', 'headerContent')
    
    const [productsSnap, homeSnap, headerSnap] = await Promise.all([
      getDoc(productsRef),
      getDoc(homeRef),
      getDoc(headerRef)
    ])
    
    return {
      products: {
        exists: productsSnap.exists(),
        lastUpdated: productsSnap.exists() ? productsSnap.data().lastUpdated : null
      },
      homeContent: {
        exists: homeSnap.exists(),
        lastUpdated: homeSnap.exists() ? homeSnap.data().lastUpdated : null
      },
      headerContent: {
        exists: headerSnap.exists(),
        lastUpdated: headerSnap.exists() ? headerSnap.data().lastUpdated : null
      }
    }
  } catch (error) {
    console.error('❌ Error checking CMS sync:', error)
    return null
  }
}

// Backward-compatible aliases (formerly Supabase CMS names)
export {
  saveProducts as saveProductsToSupabase,
  loadProducts as loadProductsFromSupabase,
  saveHomeContent as saveHomeContentToSupabase,
  loadHomeContent as loadHomeContentFromSupabase,
  saveHeaderContent as saveHeaderContentToSupabase,
  loadHeaderContent as loadHeaderContentFromSupabase,
}

