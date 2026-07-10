import { NATURALS_CATALOG_PRODUCTS } from '../data/naturals-catalog'

function productKey(product) {
  return product.catalogSlug || product.name?.trim().toLowerCase() || String(product.id)
}

/** Add catalog products that are not already in the store (by catalogSlug or name). */
export function mergeCatalogProducts(existing = []) {
  const list = Array.isArray(existing) ? [...existing] : []
  const seen = new Set(list.map(productKey))

  for (const catalogItem of NATURALS_CATALOG_PRODUCTS) {
    const key = productKey(catalogItem)
    if (seen.has(key)) continue
    list.push({ ...catalogItem })
    seen.add(key)
  }

  return list
}

export function catalogProductsMissing(existing = []) {
  const seen = new Set((existing || []).map(productKey))
  return NATURALS_CATALOG_PRODUCTS.filter((p) => !seen.has(productKey(p)))
}

export { NATURALS_CATALOG_PRODUCTS }
