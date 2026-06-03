/** Product categories — single source of truth for shop, admin, and CMS */

export const CATEGORY_SLUGS = {
  ALL: 'all',
  FOODS: 'foods',
  NATURALS: 'naturals',
}

/** Legacy slugs migrated to Foods / Naturals in Firestore */
export const LEGACY_CATEGORY_MAP = {
  'skin-care': CATEGORY_SLUGS.NATURALS,
  'hair-care': CATEGORY_SLUGS.NATURALS,
  'oral-care': CATEGORY_SLUGS.NATURALS,
  'gift-hamper': CATEGORY_SLUGS.FOODS,
}

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
]

export const PRODUCT_CATEGORY_OPTIONS = SHOP_CATEGORIES.filter(
  (c) => c.value !== CATEGORY_SLUGS.ALL
)

export function normalizeCategorySlug(category) {
  if (!category || typeof category !== 'string') return CATEGORY_SLUGS.NATURALS
  const slug = category.trim().toLowerCase()
  if (slug === CATEGORY_SLUGS.FOODS || slug === CATEGORY_SLUGS.NATURALS) return slug
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
    return slug && slug !== CATEGORY_SLUGS.FOODS && slug !== CATEGORY_SLUGS.NATURALS
  })
}

/** Home page collection cards */
export const HOME_COLLECTION_CATEGORIES = [
  {
    name: 'Foods',
    href: '/shop/foods',
    image: '/face.jpg',
    desc: 'Wholesome foods and nourishing staples',
    span: 'md:col-span-2 md:row-span-2',
  },
  {
    name: 'Naturals',
    href: '/shop/naturals',
    image: '/hair.jpg',
    desc: 'Traditional powders and natural care',
    span: '',
  },
]
