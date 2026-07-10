/**
 * Merge Naturals catalog products into Firestore cms/products.
 * Run: npm run seed:naturals
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { getFirestoreDb } from '../lib/server/firestore-server.js'
import { NATURALS_CATALOG_PRODUCTS } from '../src/data/naturals-catalog.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

function productKey(product) {
  return product.catalogSlug || product.name?.trim().toLowerCase() || String(product.id)
}

function mergeCatalog(existing = []) {
  const list = Array.isArray(existing) ? [...existing] : []
  const seen = new Set(list.map(productKey))

  for (const item of NATURALS_CATALOG_PRODUCTS) {
    const key = productKey(item)
    if (seen.has(key)) continue
    list.push({ ...item })
    seen.add(key)
  }

  return list
}

async function readProducts(db) {
  const ref = db.collection('cms').doc('products')
  const snap = await ref.get()
  if (!snap.exists) return []

  const meta = snap.data()
  if (meta.schemaVersion === 2 && meta.chunkCount > 0) {
    const chunkSnaps = await Promise.all(
      Array.from({ length: meta.chunkCount }, (_, i) =>
        db.collection('cms').doc(`products_chunk_${i}`).get()
      )
    )
    const products = []
    for (const chunk of chunkSnaps) {
      if (chunk.exists) products.push(...(chunk.data().data || []))
    }
    return products
  }

  return meta.data || []
}

async function writeProducts(db, products) {
  const lastUpdated = new Date().toISOString()
  await db.collection('cms').doc('products').set({
    data: products,
    lastUpdated,
    updatedBy: 'seed-naturals',
  })
}

async function main() {
  console.log('\n=== Seed Naturals Products ===\n')

  const db = getFirestoreDb()
  const existing = await readProducts(db)
  const merged = mergeCatalog(existing)
  const added = merged.length - existing.length

  if (added === 0) {
    console.log('All catalog products already exist in Firestore.')
    console.log(`Total products: ${merged.length}`)
    return
  }

  await writeProducts(db, merged)
  console.log(`Added ${added} product(s) to Firestore.`)
  console.log(`Total products: ${merged.length}`)
  for (const p of NATURALS_CATALOG_PRODUCTS) {
    if (!existing.some((e) => productKey(e) === productKey(p))) {
      console.log(`  + ${p.name}`)
    }
  }
}

main().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})
