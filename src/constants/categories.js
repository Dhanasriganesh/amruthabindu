/** Product categories — single source of truth for shop, admin, and CMS */

export const CATEGORY_SLUGS = {
  ALL: 'all',
  HEALTH_MIX: 'health-mix',
  DEHYDRATED_POWDERS: 'dehydrated-powders',
  WOOD_PRESSED_OILS: 'wood-pressed-oils',
}

/** @deprecated Prefer HEALTH_MIX / DEHYDRATED_POWDERS / WOOD_PRESSED_OILS */
export const CATEGORY_SLUG_ALIASES = {
  FOODS: CATEGORY_SLUGS.HEALTH_MIX,
  NATURALS: CATEGORY_SLUGS.DEHYDRATED_POWDERS,
  OILS: CATEGORY_SLUGS.WOOD_PRESSED_OILS,
}

/** Catalog slugs that belong in Wood Pressed Oils */
export const OILS_CATALOG_SLUGS = [
  'cold-pressed-groundnut-oil',
  'cold-pressed-white-sesame-oil',
  'cold-pressed-kuridi-coconut-oil',
]

/** Legacy slugs migrated to the current three shop categories */
export const LEGACY_CATEGORY_MAP = {
  foods: CATEGORY_SLUGS.HEALTH_MIX,
  naturals: CATEGORY_SLUGS.DEHYDRATED_POWDERS,
  oils: CATEGORY_SLUGS.WOOD_PRESSED_OILS,
  'skin-care': CATEGORY_SLUGS.DEHYDRATED_POWDERS,
  'hair-care': CATEGORY_SLUGS.DEHYDRATED_POWDERS,
  'oral-care': CATEGORY_SLUGS.DEHYDRATED_POWDERS,
  'gift-hamper': CATEGORY_SLUGS.HEALTH_MIX,
}

const CANONICAL_PRODUCT_CATEGORIES = new Set([
  CATEGORY_SLUGS.HEALTH_MIX,
  CATEGORY_SLUGS.DEHYDRATED_POWDERS,
  CATEGORY_SLUGS.WOOD_PRESSED_OILS,
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
    value: CATEGORY_SLUGS.DEHYDRATED_POWDERS,
    label: 'Dehydrated Powders',
    shortLabel: 'Powders',
    description: 'Nutrient-rich dehydrated leaf powders and blends',
    icon: '🌿',
    href: '/shop/dehydrated-powders',
  },
  {
    value: CATEGORY_SLUGS.HEALTH_MIX,
    label: 'Health mix',
    shortLabel: 'Health mix',
    description: 'Wholesome health mixes and nourishing blends',
    icon: '🥣',
    href: '/shop/health-mix',
  },
  {
    value: CATEGORY_SLUGS.WOOD_PRESSED_OILS,
    label: 'Wood Pressed Oils',
    shortLabel: 'Oils',
    description: 'Cold-pressed wood-pressed cooking oils',
    icon: '🫙',
    href: '/shop/wood-pressed-oils',
  },
]

export const PRODUCT_CATEGORY_OPTIONS = SHOP_CATEGORIES.filter(
  (c) => c.value !== CATEGORY_SLUGS.ALL
)

export function normalizeCategorySlug(category) {
  if (!category || typeof category !== 'string') return CATEGORY_SLUGS.DEHYDRATED_POWDERS
  const slug = category.trim().toLowerCase()
  if (CANONICAL_PRODUCT_CATEGORIES.has(slug)) return slug
  return LEGACY_CATEGORY_MAP[slug] || CATEGORY_SLUGS.DEHYDRATED_POWDERS
}

export function getCategoryLabel(slug) {
  const normalized = normalizeCategorySlug(slug)
  const found = SHOP_CATEGORIES.find((c) => c.value === normalized)
  return found?.label || normalized
}

export function getCategoryFromPath(pathname) {
  if (pathname.includes('/shop/dehydrated-powders') || pathname.includes('/shop/naturals')) {
    return CATEGORY_SLUGS.DEHYDRATED_POWDERS
  }
  if (pathname.includes('/shop/health-mix') || pathname.includes('/shop/foods')) {
    return CATEGORY_SLUGS.HEALTH_MIX
  }
  if (pathname.includes('/shop/wood-pressed-oils') || pathname.includes('/shop/oils')) {
    return CATEGORY_SLUGS.WOOD_PRESSED_OILS
  }
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

/** Remap known oil products into Wood Pressed Oils */
export function applyOilsCategoryMigration(products) {
  if (!Array.isArray(products)) return []
  return products.map((product) => {
    const normalized = normalizeProduct(product)
    if (!looksLikeOilProduct(product)) return normalized
    return {
      ...normalized,
      category: CATEGORY_SLUGS.WOOD_PRESSED_OILS,
    }
  })
}

export function productsNeedOilsCategoryMigration(products) {
  if (!Array.isArray(products)) return false
  return products.some(
    (p) =>
      looksLikeOilProduct(p) &&
      normalizeCategorySlug(p.category) !== CATEGORY_SLUGS.WOOD_PRESSED_OILS
  )
}

/** Home page collection cards */
export const HOME_COLLECTION_CATEGORIES = [
  {
    name: 'Dehydrated Powders',
    href: '/shop/dehydrated-powders',
    image: '/products-images/dehydrated-curry-leaf-powder.png',
    desc: 'Nutrient-rich dehydrated leaf powders and blends',
    span: '',
  },
  {
    name: 'Health mix',
    href: '/shop/health-mix',
    image: '/products-images/digestive-blend.png',
    desc: 'Wholesome health mixes and nourishing blends',
    span: '',
  },
  {
    name: 'Wood Pressed Oils',
    href: '/shop/wood-pressed-oils',
    image: '/products-images/cold-pressed-groundnuts-oil.png',
    desc: 'Cold-pressed wood-pressed cooking oils',
    span: '',
  },
]
