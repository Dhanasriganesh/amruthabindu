import dotenv from 'dotenv'

dotenv.config()

const SHIPROCKET_API_BASE = 'https://apiv2.shiprocket.in/v1/external'
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_API_EMAIL || process.env.VITE_SHIPROCKET_API_EMAIL
const SHIPROCKET_PASSWORD = process.env.SHIPROCKET_API_PASSWORD || process.env.VITE_SHIPROCKET_API_PASSWORD
const PICKUP_LOCATION = process.env.SHIPROCKET_PICKUP_LOCATION || 'Primary'

let cachedToken = null
let tokenExpiresAt = 0
let cachedPickupLocation = null

export async function resolvePickupLocation() {
  if (cachedPickupLocation) return cachedPickupLocation

  try {
    const response = await shiprocketFetch('/settings/company/pickup', { method: 'GET' })
    const data = await response.json()
    const raw = data?.data?.shipping_address
    const list = Array.isArray(raw) ? raw : raw ? [raw] : []

    const envLocation = process.env.SHIPROCKET_PICKUP_LOCATION
    if (envLocation && list.some((a) => a.pickup_location === envLocation)) {
      cachedPickupLocation = envLocation
      return cachedPickupLocation
    }

    const primary = list.find((a) => a.is_primary_location === 1) || list[0]
    if (primary?.pickup_location) {
      if (envLocation && envLocation !== primary.pickup_location) {
        console.warn(
          `SHIPROCKET_PICKUP_LOCATION "${envLocation}" not found — using "${primary.pickup_location}"`
        )
      }
      cachedPickupLocation = primary.pickup_location
      return cachedPickupLocation
    }
  } catch (err) {
    console.warn('Could not fetch Shiprocket pickup locations:', err.message)
  }

  cachedPickupLocation = PICKUP_LOCATION
  return cachedPickupLocation
}

export function isShiprocketConfigured() {
  return Boolean(SHIPROCKET_EMAIL && SHIPROCKET_PASSWORD)
}

export async function getShiprocketToken(forceRefresh = false) {
  if (!isShiprocketConfigured()) {
    throw new Error('Shiprocket credentials not configured')
  }

  if (!forceRefresh && cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  const response = await fetch(`${SHIPROCKET_API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: SHIPROCKET_EMAIL,
      password: SHIPROCKET_PASSWORD,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Shiprocket authentication failed: ${errorText}`)
  }

  const data = await response.json()
  cachedToken = data.token
  // Token valid for 10 days; refresh after 9 days
  tokenExpiresAt = Date.now() + 9 * 24 * 60 * 60 * 1000

  return cachedToken
}

export async function shiprocketFetch(path, options = {}) {
  const token = await getShiprocketToken()
  const response = await fetch(`${SHIPROCKET_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (response.status === 401) {
    const refreshedToken = await getShiprocketToken(true)
    const retryResponse = await fetch(`${SHIPROCKET_API_BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${refreshedToken}`,
        ...options.headers,
      },
    })
    return retryResponse
  }

  return response
}

export function transformToShiprocketFormat(orderData, pickupLocation = PICKUP_LOCATION) {
  const {
    orderId,
    items = [],
    totals = {},
    shippingAddress = {},
    paymentMethod = 'razorpay',
    couponCode = null,
  } = orderData

  const subtotal = Math.round(parseFloat(totals.subtotal) || 0)
  const shipping = Math.round(parseFloat(totals.delivery) || 0)
  const discount = Math.round(parseFloat(totals.couponDiscount) || 0)
  const subTotal = Math.max(1, subtotal - discount)

  const firstName = shippingAddress.firstName || 'Customer'
  const lastName = shippingAddress.lastName || ''
  const phone = String(shippingAddress.phone || '9999999999').replace(/\D/g, '').slice(-10) || '9999999999'
  const pincode = String(shippingAddress.pincode || '500001').replace(/\D/g, '').slice(0, 6) || '500001'

  const orderItems = items.map((item, index) => ({
    name: item.size ? `${item.name} (${item.size})` : (item.name || 'Product'),
    sku: item.sku || `SKU-${item.id || index + 1}`,
    units: parseInt(item.quantity, 10) || 1,
    selling_price: Math.round(parseFloat(item.price) || 0),
    discount: 0,
    tax: 0,
  }))

  if (orderItems.length === 0) {
    orderItems.push({
      name: 'Order Item',
      sku: 'SKU-DEFAULT',
      units: 1,
      selling_price: subTotal,
      discount: 0,
      tax: 0,
    })
  }

  const now = new Date()
  const orderDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`

  const defaultWeight = parseFloat(process.env.SHIPROCKET_DEFAULT_WEIGHT || '0.5')
  const defaultLength = parseFloat(process.env.SHIPROCKET_DEFAULT_LENGTH || '10')
  const defaultBreadth = parseFloat(process.env.SHIPROCKET_DEFAULT_BREADTH || '10')
  const defaultHeight = parseFloat(process.env.SHIPROCKET_DEFAULT_HEIGHT || '10')

  return {
    order_id: String(orderId).slice(0, 50),
    order_date: orderDate,
    pickup_location: pickupLocation,
    comment: `Website order${couponCode ? ` | Coupon: ${couponCode}` : ''}`,
    billing_customer_name: firstName,
    billing_last_name: lastName,
    billing_address: shippingAddress.address || 'Address not provided',
    billing_address_2: '',
    billing_city: shippingAddress.city || 'City',
    billing_pincode: pincode,
    billing_state: shippingAddress.state || 'Telangana',
    billing_country: shippingAddress.country || 'India',
    billing_email: shippingAddress.email || 'noemail@example.com',
    billing_phone: phone,
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: paymentMethod === 'cod' ? 'COD' : 'Prepaid',
    shipping_charges: shipping,
    giftwrap_charges: 0,
    transaction_charges: 0,
    total_discount: discount,
    sub_total: subTotal,
    length: defaultLength,
    breadth: defaultBreadth,
    height: defaultHeight,
    weight: defaultWeight,
  }
}

export function mapShiprocketStatusToOurStatus(shiprocketStatus) {
  if (!shiprocketStatus) return null

  const normalized = String(shiprocketStatus).toUpperCase().trim()

  if (normalized.includes('DELIVERED')) return 'DELIVERED'
  if (normalized.includes('OUT FOR DELIVERY') || normalized.includes('OUT_FOR_DELIVERY')) return 'OUT_FOR_DELIVERY'
  if (
    normalized.includes('IN TRANSIT') ||
    normalized.includes('IN_TRANSIT') ||
    normalized.includes('PICKED UP') ||
    normalized.includes('PICKED_UP') ||
    normalized.includes('SHIPPED') ||
    normalized.includes('DISPATCHED')
  ) {
    return 'SHIPPED'
  }
  if (
    normalized.includes('READY TO SHIP') ||
    normalized.includes('READY_TO_SHIP') ||
    normalized.includes('PACKED') ||
    normalized.includes('MANIFEST')
  ) {
    return 'PACKED'
  }
  if (normalized.includes('CANCEL') || normalized.includes('RTO')) return 'CANCELLED'

  return null
}

export function extractTrackingStatus(trackResponse) {
  const trackingData = trackResponse?.tracking_data
  if (!trackingData) return { status: null, awb: null }

  const shipmentTrack = trackingData.shipment_track
  if (Array.isArray(shipmentTrack) && shipmentTrack.length > 0) {
    const latest = shipmentTrack[0]
    return {
      status: latest.current_status || latest.shipment_status || null,
      awb: latest.awb_code || trackResponse.awb_code || null,
    }
  }

  const activities = trackingData.shipment_track_activities
  if (Array.isArray(activities) && activities.length > 0) {
    const latestActivity = activities[activities.length - 1]
    return {
      status: latestActivity.activity || latestActivity.status || null,
      awb: trackResponse.awb_code || null,
    }
  }

  return {
    status: trackResponse.current_status || null,
    awb: trackResponse.awb_code || null,
  }
}

let cachedPickupPincode = null

export async function getPickupPincode() {
  if (cachedPickupPincode) return cachedPickupPincode

  if (process.env.SHIPROCKET_PICKUP_PINCODE) {
    cachedPickupPincode = String(process.env.SHIPROCKET_PICKUP_PINCODE).replace(/\D/g, '').slice(0, 6)
    return cachedPickupPincode
  }

  const response = await shiprocketFetch('/settings/company/pickup', { method: 'GET' })
  const data = await response.json()
  const raw = data?.data?.shipping_address
  const list = Array.isArray(raw) ? raw : raw ? [raw] : []
  const pickupLocation = await resolvePickupLocation()
  const match =
    list.find((a) => a.pickup_location === pickupLocation) ||
    list.find((a) => a.is_primary_location === 1) ||
    list[0]

  cachedPickupPincode = String(match?.pin_code || '500049').replace(/\D/g, '').slice(0, 6)
  return cachedPickupPincode
}

export async function getShippingQuote({
  deliveryPincode,
  weightKg,
  cod = false,
  orderValue = 0,
  items = [],
}) {
  if (!isShiprocketConfigured()) {
    return {
      success: false,
      skipped: true,
      message: 'Shiprocket not configured',
    }
  }

  const { estimateCartWeightKg } = await import('./cart-weight.js')
  const pin = String(deliveryPincode || '').replace(/\D/g, '').slice(0, 6)
  if (pin.length !== 6) {
    return { success: false, error: 'Valid 6-digit delivery pincode required' }
  }

  const weight = weightKg || estimateCartWeightKg(items)
  const freeAbove = parseFloat(process.env.FREE_SHIPPING_MIN_ORDER || '0')
  if (freeAbove > 0 && orderValue >= freeAbove) {
    return {
      success: true,
      deliveryPrice: 0,
      freeShipping: true,
      estimatedDelivery: null,
      courierName: null,
      weightKg: weight,
      pickupPincode: await getPickupPincode(),
      deliveryPincode: pin,
    }
  }

  const pickupPincode = await getPickupPincode()
  const params = new URLSearchParams({
    pickup_postcode: pickupPincode,
    delivery_postcode: pin,
    cod: cod ? '1' : '0',
    weight: String(Math.max(0.1, weight)),
  })

  const response = await shiprocketFetch(`/courier/serviceability?${params}`, { method: 'GET' })
  const data = await response.json()

  if (!response.ok) {
    return {
      success: false,
      error: data?.message || 'Could not fetch shipping rate',
      details: data,
    }
  }

  const companies = data?.data?.available_courier_companies || []
  if (!companies.length) {
    return {
      success: false,
      error: 'Delivery is not available for this pincode. Please try a different address.',
    }
  }

  const sorted = [...companies].sort(
    (a, b) => parseFloat(a.rate || a.freight_charge || 0) - parseFloat(b.rate || b.freight_charge || 0)
  )
  const cheapest = sorted[0]
  let price = parseFloat(cheapest.rate || cheapest.freight_charge || 0)

  const markup = parseFloat(process.env.SHIPPING_MARKUP || '0')
  if (markup > 0) price += markup

  price = Math.ceil(price)

  return {
    success: true,
    deliveryPrice: price,
    courierName: cheapest.courier_name || null,
    estimatedDelivery: cheapest.etd || cheapest.estimated_delivery_days || null,
    weightKg: weight,
    freeShipping: false,
    pickupPincode,
    deliveryPincode: pin,
    cod: Boolean(cod),
  }
}
