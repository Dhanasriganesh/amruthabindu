/**
 * Test whether orders sync to Nimbuspost.
 * Run: npm run test:nimbuspost
 */
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '..', '.env') })

import {
  isNimbuspostConfigured,
  createNimbuspostOrder,
  transformToNimbuspostFormat,
  getPickupPincode,
} from '../lib/server/nimbuspost.js'

async function main() {
  console.log('\n=== Nimbuspost Order Sync Test ===\n')

  if (!isNimbuspostConfigured()) {
    console.log('FAIL: Nimbuspost credentials missing in .env')
    console.log('Set NIMBUSPOST_API_EMAIL and NIMBUSPOST_API_PASSWORD')
    process.exit(1)
  }

  console.log('1. Credentials .............. OK')
  console.log(`   Email: ${process.env.NIMBUSPOST_API_EMAIL}`)
  console.log(`   Pickup pincode in .env: ${process.env.NIMBUSPOST_PICKUP_PINCODE || '(NOT SET)'}`)

  console.log('\n2. Checking pickup pincode...')
  try {
    const pickupPincode = await getPickupPincode()
    console.log(`   Pickup pincode ............. OK (${pickupPincode})`)
  } catch (err) {
    console.log(`FAIL: ${err.message}`)
    process.exit(1)
  }

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

  console.log('\n3. Creating test order in Nimbuspost (orders only, no AWB)...')
  console.log(`   Order ID: ${orderId}`)

  const result = await createNimbuspostOrder(orderData)

  if (!result.success) {
    console.log(`FAIL: ${result.error}`)
    process.exit(1)
  }

  console.log('\nSUCCESS — order synced to Nimbuspost!')
  console.log(`   Channel order ID: ${orderId}`)
  console.log(`   Nimbuspost order ID: ${result.nimbuspostOrderId}`)
  if (result.shipmentId) console.log(`   Shipment ID: ${result.shipmentId}`)
  if (result.awbNumber) console.log(`   AWB (unexpected on create): ${result.awbNumber}`)
  console.log(`   Booked: ${result.booked ? 'yes' : 'no — ship from admin when ready'}`)
  console.log('\nCheck your dashboard:')
  console.log('   https://ship.nimbuspost.com/')
  console.log(`   Search for order: ${orderId}\n`)
}

main().catch((err) => {
  console.error('Test failed:', err.message)
  process.exit(1)
})
