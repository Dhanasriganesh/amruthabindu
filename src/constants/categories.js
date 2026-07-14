/** Product categories — single source of truth for shop, admin, and CMS */

export const CATEGORY_SLUGS = {
  ALL: 'all',
  FOODS: 'foods',
  NATURALS: 'naturals',
  OILS: 'oils',
}

/** Catalog slugs that belong in Oils (used to rematch products already in Firestore) */
export const OILS_CATALOG_SLUGS = [
  'cold-pressed-groundnut-oil',
  'cold-pressed-white-sesame-oil',
  'cold-pressed-kuridi-coconut-oil',
]

/** Legacy slugs migrated to Foods / Naturals / Oils in Firestore */
export const LEGACY_CATEGORY_MAP = {
  'skin-care': CATEGORY_SLUGS.NATURALS,
  'hair-care': CATEGORY_SLUGS.NATURALS,
  'oral-care': CATEGORY_SLUGS.NATURALS,
  'gift-hamper': CATEGORY_SLUGS.FOODS,
}

const CANONICAL_PRODUCT_CATEGORIES = new Set([
  CATEGORY_SLUGS.FOODS,
  CATEGORY_SLUGS.NATURALS,
  CATEGORY_SLUGS.OILS,
])

export const SHOP_CATEGORIES = [
  {
    value: CATEGORY_SLUGS.ALL,
    label: 'All Products',
    shortLabel: 'All',
    description: 'Our full collection of natural wellness',
    icon: '🌿',
    href: '/shop',
  },
  {
    value: CATEGORY_SLUGS.FOODS,
    label: 'Foods',
    shortLabel: 'Foods',
    description: 'Wholesome foods and nourishing staples',
    icon: '🥣',
    href: '/shop/foods',
  },
  {
    value: CATEGORY_SLUGS.NATURALS,
    label: 'Naturals',
    shortLabel: 'Naturals',
    description: 'Traditional powders and natural care',
    icon: '🌱',
    href: '/shop/naturals',
  },
  {
    value: CATEGORY_SLUGS.OILS,
    label: 'Oils',
    shortLabel: 'Oils',
    description: 'Cold-pressed wood-pressed cooking oils',
    icon: '🫙',
    href: '/shop/oils',
  },
]

export const PRODUCT_CATEGORY_OPTIONS = SHOP_CATEGORIES.filter(
  (c) => c.value !== CATEGORY_SLUGS.ALL
)

export function normalizeCategorySlug(category) {
  if (!category || typeof category !== 'string') return CATEGORY_SLUGS.NATURALS
  const slug = category.trim().toLowerCase()
  if (CANONICAL_PRODUCT_CATEGORIES.has(slug)) return slug
  return LEGACY_CATEGORY_MAP[slug] || CATEGORY_SLUGS.NATURALS
}

export function getCategoryLabel(slug) {
  const normalized = normalizeCategorySlug(slug)
  const found = SHOP_CATEGORIES.find((c) => c.value === normalized)
  return found?.label || normalized
}

export function getCategoryFromPath(pathname) {
  if (pathname.includes('/shop/foods')) return CATEGORY_SLUGS.FOODS
  if (pathname.includes('/shop/naturals')) return CATEGORY_SLUGS.NATURALS
  if (pathname.includes('/shop/oils')) return CATEGORY_SLUGS.OILS
  return CATEGORY_SLUGS.ALL
}

export function normalizeProduct(product) {
  if (!product || typeof product !== 'object') return product
  return {
    ...product,
    category: normalizeCategorySlug(product.category),
  }
}

export function normalizeProducts(products) {
  if (!Array.isArray(products)) return []
  return products.map(normalizeProduct)
}

export function productsNeedCategoryMigration(products) {
  if (!Array.isArray(products)) return false
  return products.some((p) => {
    const slug = (p.category || '').trim().toLowerCase()
    return slug && !CANONICAL_PRODUCT_CATEGORIES.has(slug)
  })
}

function looksLikeOilProduct(product) {
  if (!product) return false
  if (OILS_CATALOG_SLUGS.includes(product.catalogSlug)) return true
  const name = (product.name || '').toLowerCase()
  if (!name.includes('oil')) return false
  return (
    name.includes('groundnut') ||
    name.includes('sesame') ||
    name.includes('coconut') ||
    name.includes('kuridi') ||
    name.includes('wood pressed') ||
    name.includes('cold-pressed') ||
    name.includes('cold pressed')
  )
}

/** Remap known oil products still stored as Naturals/Foods → Oils */
export function applyOilsCategoryMigration(products) {
  if (!Array.isArray(products)) return []
  return products.map((product) => {
    if (!looksLikeOilProduct(product)) return normalizeProduct(product)
    return {
      ...product,
      category: CATEGORY_SLUGS.OILS,
    }
  })
}

export function productsNeedOilsCategoryMigration(products) {
  if (!Array.isArray(products)) return false
  return products.some(
    (p) =>
      looksLikeOilProduct(p) && normalizeCategorySlug(p.category) !== CATEGORY_SLUGS.OILS
  )
}

/** Home page collection cards */
export const HOME_COLLECTION_CATEGORIES = [
  {
    name: 'Foods',
    href: '/shop/foods',
    image: '/face.jpg',
    desc: 'Wholesome foods and nourishing staples',
    span: '',
  },
  {
    name: 'Naturals',
    href: '/shop/naturals',
    image: '/hair.jpg',
    desc: 'Traditional powders and natural care',
    span: '',
  },
  {
    name: 'Oils',
    href: '/shop/oils',
    image: '/products-images/cold-pressed-groundnuts-oil.png',
    desc: 'Cold-pressed wood-pressed cooking oils',
    span: '',
  },
]
