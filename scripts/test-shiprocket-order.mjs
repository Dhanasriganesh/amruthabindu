/**
 * Test whether orders sync to Shiprocket.
 * Run: node scripts/test-shiprocket-order.mjs
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

import {
  isShiprocketConfigured,
  shiprocketFetch,
  transformToShiprocketFormat,
  resolvePickupLocation,
} from '../api/lib/shiprocket.js'

async function checkPickupLocations() {
  const response = await shiprocketFetch('/settings/company/pickup', { method: 'GET' })
  const data = await response.json()
  const raw = data?.data?.shipping_address
  const addresses = Array.isArray(raw) ? raw : raw ? [raw] : []

  return { ok: response.ok, addresses, raw: data }
}

async function main() {
  console.log('\n=== Shiprocket Order Sync Test ===\n')

  if (!isShiprocketConfigured()) {
    console.log('FAIL: Shiprocket credentials missing in .env')
    console.log('Set SHIPROCKET_API_EMAIL and SHIPROCKET_API_PASSWORD')
    process.exit(1)
  }

  console.log('1. Credentials .............. OK')
  console.log(`   Email: ${process.env.SHIPROCKET_API_EMAIL}`)
  console.log(`   Pickup name in .env: ${process.env.SHIPROCKET_PICKUP_LOCATION || '(auto)'}`)

  console.log('\n2. Checking pickup locations...')
  const pickup = await checkPickupLocations()
  const hasPickup = pickup.addresses.length > 0

  if (hasPickup) {
    pickup.addresses.forEach((a) => {
      console.log(`   - ${a.pickup_location}${a.is_primary_location ? ' (PRIMARY)' : ''}`)
    })
  }

  if (!hasPickup) {
    console.log('FAIL: No pickup address found in your Shiprocket account.')
    console.log('')
    console.log('This is required before orders can appear in the dashboard.')
    console.log('')
    console.log('Fix in Shiprocket panel:')
    console.log('  Settings → Pickup Address → Add new pickup address')
    console.log('  Use nickname "Primary" OR update SHIPROCKET_PICKUP_LOCATION in .env')
    console.log('')
    console.log('Then run this test again: node scripts/test-shiprocket-order.mjs')
    process.exit(1)
  }

  console.log('   Pickup locations found ..... OK')

  const pickupLocation = await resolvePickupLocation()
  console.log(`   Using pickup location: ${pickupLocation}`)

  const orderId = `TEST-${Date.now()}`
  const orderData = {
    orderId,
    items: [
      {
        name: 'Amrutha Bindu Test Product',
        size: '100g',
        quantity: 1,
        price: 199,
        sku: 'TEST-SKU-1',
        id: '1',
      },
    ],
    totals: { subtotal: 199, delivery: 0, couponDiscount: 0, total: 199 },
    shippingAddress: {
      firstName: 'Test',
      lastName: 'Customer',
      email: 'test@amruthabindu.in',
      phone: '9876543210',
      address: '123 Test Street, Banjara Hills',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500034',
      country: 'India',
    },
    paymentMethod: 'cod',
  }

  console.log('\n3. Creating test order in Shiprocket...')
  console.log(`   Order ID: ${orderId}`)

  const payload = transformToShiprocketFormat(orderData, pickupLocation)
  const response = await shiprocketFetch('/orders/create/adhoc', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  const text = await response.text()
  let result
  try {
    result = JSON.parse(text)
  } catch {
    result = { message: text }
  }

  if (!response.ok) {
    console.log(`FAIL: Shiprocket returned ${response.status}`)
    console.log(JSON.stringify(result, null, 2))
    process.exit(1)
  }

  const shiprocketOrderId = result.order_id || result.data?.order_id
  const shipmentId = result.shipment_id || result.data?.shipment_id

  console.log('\nSUCCESS — order created in Shiprocket!')
  console.log(`   Channel order ID: ${orderId}`)
  console.log(`   Shiprocket order ID: ${shiprocketOrderId}`)
  if (shipmentId) console.log(`   Shipment ID: ${shipmentId}`)
  console.log('\nCheck your dashboard:')
  console.log('   https://app.shiprocket.in/seller/orders/new')
  console.log(`   Search for order: ${orderId}\n`)
}

main().catch((err) => {
  console.error('Test failed:', err.message)
  process.exit(1)
})
