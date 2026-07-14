import { NATURALS_CATALOG_PRODUCTS } from '../data/naturals-catalog'
import { applyOilsCategoryMigration } from '../constants/categories'

function productKey(product) {
  return product.catalogSlug || product.name?.trim().toLowerCase() || String(product.id)
}

/** Add catalog products that are not already in the store (by catalogSlug or name).
 *  Also sync category (and key fields) from catalog when a match already exists.
 */
export function mergeCatalogProducts(existing = []) {
  const list = Array.isArray(existing) ? [...existing] : []
  const byKey = new Map(list.map((p, index) => [productKey(p), index]))

  for (const catalogItem of NATURALS_CATALOG_PRODUCTS) {
    const key = productKey(catalogItem)
    const existingIndex = byKey.get(key)
    if (existingIndex === undefined) {
      list.push({ ...catalogItem })
      byKey.set(key, list.length - 1)
      continue
    }

    const current = list[existingIndex]
    list[existingIndex] = {
      ...current,
      catalogSlug: current.catalogSlug || catalogItem.catalogSlug,
      category: catalogItem.category,
    }
  }

  return applyOilsCategoryMigration(list)
}

export function catalogProductsMissing(existing = []) {
  const seen = new Set((existing || []).map(productKey))
  return NATURALS_CATALOG_PRODUCTS.filter((p) => !seen.has(productKey(p)))
}

export { NATURALS_CATALOG_PRODUCTS }
