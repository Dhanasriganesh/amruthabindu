import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore'
import { db, isFirebaseConfigured } from '../lib/firebase'
import {
  normalizeProducts,
  productsNeedCategoryMigration,
  applyOilsCategoryMigration,
  productsNeedOilsCategoryMigration,
} from '../constants/categories'

const FIRESTORE_DOC_MAX_BYTES = 1_048_576
const CHUNK_TARGET_BYTES = 900_000

function estimateFirestoreDocBytes(payload) {
  return new TextEncoder().encode(JSON.stringify(payload)).length
}

function splitProductsIntoChunks(products) {
  const chunks = []
  let current = []

  for (const product of products) {
    const candidate = [...current, product]
    const bytes = estimateFirestoreDocBytes({
      data: candidate,
      lastUpdated: '',
      updatedBy: 'admin',
    })

    if (bytes > CHUNK_TARGET_BYTES && current.length > 0) {
      chunks.push(current)
      current = [product]
    } else if (bytes > FIRESTORE_DOC_MAX_BYTES) {
      if (current.length > 0) {
        chunks.push(current)
        current = []
      }
      chunks.push([product])
    } else {
      current = candidate
    }
  }

  if (current.length > 0) chunks.push(current)
  return chunks.length ? chunks : [[]]
}

async function cleanupProductChunks(firestore, fromIndex = 0) {
  for (let i = fromIndex; ; i++) {
    const ref = doc(firestore, 'cms', `products_chunk_${i}`)
    const snap = await getDoc(ref)
    if (!snap.exists()) break
    await deleteDoc(ref)
  }
}

async function writeProductsToFirestore(firestore, products) {
  const lastUpdated = new Date().toISOString()
  const chunks = splitProductsIntoChunks(products)

  if (chunks.length === 1) {
    const docPayload = { data: chunks[0], lastUpdated, updatedBy: 'admin' }
    const bytes = estimateFirestoreDocBytes(docPayload)
    if (bytes > FIRESTORE_DOC_MAX_BYTES) {
      const mb = (bytes / (1024 * 1024)).toFixed(2)
      throw new Error(
        `Product catalog chunk is too large (${mb} MB). Compress images or use fewer images per product.`
      )
    }

    await setDoc(doc(firestore, 'cms', 'products'), docPayload)
    await cleanupProductChunks(firestore, 0)
    return { chunkCount: 1 }
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunkPayload = {
      data: chunks[i],
      chunkIndex: i,
      lastUpdated,
      updatedBy: 'admin',
    }
    const bytes = estimateFirestoreDocBytes(chunkPayload)
    if (bytes > FIRESTORE_DOC_MAX_BYTES) {
      const mb = (bytes / (1024 * 1024)).toFixed(2)
      throw new Error(
        `Product chunk ${i + 1} is too large (${mb} MB). Compress images or use fewer images per product.`
      )
    }
    await setDoc(doc(firestore, 'cms', `products_chunk_${i}`), chunkPayload)
  }

  await setDoc(doc(firestore, 'cms', 'products'), {
    schemaVersion: 2,
    chunkCount: chunks.length,
    lastUpdated,
    updatedBy: 'admin',
  })

  await cleanupProductChunks(firestore, chunks.length)
  return { chunkCount: chunks.length }
}

async function readProductsFromFirestore(firestore) {
  const productsRef = doc(firestore, 'cms', 'products')
  const docSnap = await getDoc(productsRef)

  if (!docSnap.exists()) return null

  const meta = docSnap.data()

  if (meta.schemaVersion === 2 && meta.chunkCount > 0) {
    const chunkSnaps = await Promise.all(
      Array.from({ length: meta.chunkCount }, (_, i) =>
        getDoc(doc(firestore, 'cms', `products_chunk_${i}`))
      )
    )

    const products = []
    for (const snap of chunkSnaps) {
      if (snap.exists()) products.push(...(snap.data().data || []))
    }
    return products
  }

  return meta.data || []
}
function ensureDb() {
  if (!db || !isFirebaseConfigured()) return null
  return db
}

function clearProductsLocalCache() {
  try {
    localStorage.removeItem('products_data')
    localStorage.removeItem('admin_products')
  } catch (_) {
    // ignore
  }
}

/** localStorage only when Firebase is not configured (dev/offline). */
function cacheProductsLocally(products) {
  try {
    const json = JSON.stringify(products)
    localStorage.setItem('products_data', json)
    localStorage.setItem('admin_products', json)
  } catch (error) {
    clearProductsLocalCache()
    throw new Error(
      'Product data is too large for browser storage (~5 MB limit). Configure Firebase to save to Firestore.'
    )
  }
}

// ==================== PRODUCTS ====================

export async function saveProducts(products) {
  const normalized = normalizeProducts(products)
  try {
    const firestore = ensureDb()
    if (!firestore) {
      cacheProductsLocally(normalized)
      return { success: true, localOnly: true }
    }

    const { chunkCount } = await writeProductsToFirestore(firestore, normalized)

    // Firestore is the source of truth — do not mirror large base64 payloads in localStorage.
    clearProductsLocalCache()

    console.log(
      chunkCount > 1
        ? `✅ Products saved to Firestore (${chunkCount} chunks)`
        : '✅ Products saved to Firestore'
    )
    return { success: true, migrated: productsNeedCategoryMigration(products), chunkCount }
  } catch (error) {
    console.error('❌ Error saving products to Firestore:', error)
    return { success: false, error: error.message }
  }
}

/** Rewrite legacy categories to Dehydrated Powders / Health mix / Wood Pressed Oils */
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
    message: `Migrated ${count || normalized.length} product(s) to Dehydrated Powders / Health mix / Wood Pressed Oils`,
  }
}

/** Move cold-pressed oil products into Wood Pressed Oils and persist */
export async function migrateOilsCategoryInFirestore() {
  const products = await loadProducts()
  if (!products.length) {
    return { success: true, migrated: 0, message: 'No products to migrate' }
  }
  if (!productsNeedOilsCategoryMigration(products)) {
    return { success: true, migrated: 0, message: 'Oil products already in Wood Pressed Oils' }
  }
  const migrated = applyOilsCategoryMigration(products)
  const count = migrated.filter((p, i) => p.category !== products[i]?.category).length
  const result = await saveProducts(migrated)
  return {
    ...result,
    migrated: count,
    message: `Moved ${count} oil product(s) into Wood Pressed Oils`,
  }
}

export async function loadProducts() {
  try {
    const firestore = ensureDb()
    if (!firestore) {
      const cached = localStorage.getItem('products_data')
      return cached ? normalizeProducts(JSON.parse(cached)) : []
    }

    const raw = await readProductsFromFirestore(firestore)
    if (raw === null) {
      clearProductsLocalCache()
      console.log('ℹ️ No products document in Firestore')
      return []
    }

    const products = normalizeProducts(raw)

    if (products.length > 0) {
      clearProductsLocalCache()
      console.log('✅ Products loaded from Firestore:', products.length)
      if (productsNeedCategoryMigration(raw)) {
        console.log('ℹ️ Legacy categories detected — run migrate in admin or save products to update Firestore')
      }
    } else {
      clearProductsLocalCache()
      console.log('ℹ️ No products in Firestore cms/products')
    }
    return products
  } catch (error) {
    console.error('❌ Error loading products from Firestore:', error)

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
      window.dispatchEvent(new Event('homeContentUpdated'))
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
    window.dispatchEvent(new Event('homeContentUpdated'))
    
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

