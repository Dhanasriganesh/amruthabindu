import dotenv from 'dotenv'

dotenv.config()

const NIMBUSPOST_API_BASE = 'https://api.nimbuspost.com/v1'
const NIMBUSPOST_EMAIL = process.env.NIMBUSPOST_API_EMAIL?.trim()
const NIMBUSPOST_PASSWORD = process.env.NIMBUSPOST_API_PASSWORD?.trim()
const NIMBUSPOST_API_KEY = process.env.NIMBUSPOST_API_KEY?.trim()

let cachedToken = null
let tokenExpiresAt = 0
let cachedPickupPincode = null

export function isNimbuspostEnabled() {
  const flag = String(process.env.NIMBUSPOST_ENABLED ?? 'true').trim().toLowerCase()
  return !['false', '0', 'no', 'off'].includes(flag)
}

export function isNimbuspostConfigured() {
  return isNimbuspostEnabled() && Boolean(NIMBUSPOST_EMAIL && NIMBUSPOST_PASSWORD)
}

export async function getNimbuspostToken(forceRefresh = false) {
  if (!isNimbuspostConfigured()) {
    throw new Error('Nimbuspost credentials not configured')
  }

  if (!forceRefresh && cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken
  }

  const loginBody = {
    email: NIMBUSPOST_EMAIL,
    password: NIMBUSPOST_PASSWORD,
  }
  if (NIMBUSPOST_API_KEY) {
    loginBody.api_key = NIMBUSPOST_API_KEY
  }

  const response = await fetch(`${NIMBUSPOST_API_BASE}/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(loginBody),
  })

  const data = await response.json().catch(() => ({}))

  if (!response.ok || !data?.status || !data?.data) {
    const errorText = data?.message || JSON.stringify(data)
    throw new Error(`Nimbuspost authentication failed: ${errorText}`)
  }

  cachedToken = data.data
  // JWT valid ~3 hours; refresh after 2.5 hours
  tokenExpiresAt = Date.now() + 2.5 * 60 * 60 * 1000

  return cachedToken
}

export async function nimbuspostFetch(path, options = {}) {
  const token = await getNimbuspostToken()
  const response = await fetch(`${NIMBUSPOST_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })

  if (response.status === 401) {
    const refreshedToken = await getNimbuspostToken(true)
    const retryResponse = await fetch(`${NIMBUSPOST_API_BASE}${path}`, {
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

export async function getPickupPincode() {
  if (cachedPickupPincode) return cachedPickupPincode

  if (process.env.NIMBUSPOST_PICKUP_PINCODE) {
    cachedPickupPincode = String(process.env.NIMBUSPOST_PICKUP_PINCODE).replace(/\D/g, '').slice(0, 6)
    return cachedPickupPincode
  }

  throw new Error(
    'NIMBUSPOST_PICKUP_PINCODE is required — set your warehouse pincode from Nimbuspost → Settings → Warehouse'
  )
}

function getPickupDetailsFromEnv() {
  const pincode = String(process.env.NIMBUSPOST_PICKUP_PINCODE || '').replace(/\D/g, '').slice(0, 6)
  const phone = String(process.env.NIMBUSPOST_PICKUP_PHONE || process.env.VITE_WHATSAPP_PHONE || '')
    .replace(/\D/g, '')
    .slice(-10)

  return {
    warehouse_name: process.env.NIMBUSPOST_PICKUP_WAREHOUSE_NAME?.trim() || 'Amrutha Bindu',
    name: process.env.NIMBUSPOST_PICKUP_CONTACT_NAME?.trim() || 'Amrutha Bindu',
    address: process.env.NIMBUSPOST_PICKUP_ADDRESS?.trim() || '',
    city: process.env.NIMBUSPOST_PICKUP_CITY?.trim() || 'Hyderabad',
    state: process.env.NIMBUSPOST_PICKUP_STATE?.trim() || 'Telangana',
    pincode,
    phone,
  }
}

export function transformToNimbuspostFormat(orderData, options = {}) {
  const {
    orderId,
    items = [],
    totals = {},
    shippingAddress = {},
    paymentMethod = 'razorpay',
    couponCode = null,
    deliveryInfo = null,
  } = orderData

  const delivery = deliveryInfo || orderData.delivery_info || null

  const subtotal = Math.round(parseFloat(totals.subtotal) || 0)
  const discount = Math.round(parseFloat(totals.couponDiscount) || 0)
  const orderAmount = Math.max(1, subtotal - discount)

  const firstName = shippingAddress.firstName || 'Customer'
  const lastName = shippingAddress.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim()
  const phone = String(shippingAddress.phone || '9999999999').replace(/\D/g, '').slice(-10) || '9999999999'
  const pincode = String(shippingAddress.pincode || '500001').replace(/\D/g, '').slice(0, 6) || '500001'

  const defaultWeightKg = parseFloat(process.env.NIMBUSPOST_DEFAULT_WEIGHT || '0.5')
  const defaultLength = parseFloat(process.env.NIMBUSPOST_DEFAULT_LENGTH || '10')
  const defaultBreadth = parseFloat(process.env.NIMBUSPOST_DEFAULT_BREADTH || '10')
  const defaultHeight = parseFloat(process.env.NIMBUSPOST_DEFAULT_HEIGHT || '10')

  const orderItems = items.map((item, index) => ({
    name: item.size ? `${item.name} (${item.size})` : (item.name || 'Product'),
    sku: item.sku || `SKU-${item.id || index + 1}`,
    qty: parseInt(item.quantity, 10) || 1,
    price: Math.round(parseFloat(item.price) || 0),
  }))

  if (orderItems.length === 0) {
    orderItems.push({
      name: 'Order Item',
      sku: 'SKU-DEFAULT',
      qty: 1,
      price: orderAmount,
    })
  }

  const payload = {
    order_number: String(orderId).slice(0, 50),
    payment_type: paymentMethod === 'cod' ? 'cod' : 'prepaid',
    order_amount: orderAmount,
    weight: Math.round(defaultWeightKg * 1000),
    length: defaultLength,
    breadth: defaultBreadth,
    height: defaultHeight,
    order_items: orderItems,
    comment: `Website order${couponCode ? ` | Coupon: ${couponCode}` : ''}`,
    consignee: {
      name: fullName,
      phone,
      email: shippingAddress.email || 'noemail@example.com',
      address: shippingAddress.address || 'Address not provided',
      address_2: '',
      city: shippingAddress.city || 'City',
      state: shippingAddress.state || 'Telangana',
      pincode,
      country: shippingAddress.country || 'India',
    },
  }

  const pickupAddressId = process.env.NIMBUSPOST_PICKUP_ADDRESS_ID?.trim()
  if (pickupAddressId) {
    payload.pickup_address_id = pickupAddressId
  } else {
    const pickup = getPickupDetailsFromEnv()
    if (!pickup.address || pickup.pincode.length !== 6 || pickup.phone.length !== 10) {
      throw new Error(
        'Nimbuspost pickup warehouse not configured. Add warehouse in Nimbuspost → Settings → Warehouse, then set NIMBUSPOST_PICKUP_ADDRESS, NIMBUSPOST_PICKUP_PINCODE, and NIMBUSPOST_PICKUP_PHONE in .env (pickup_address_id is optional and usually not shown in the panel).'
      )
    }
    payload.pickup = pickup
  }

  const includeCourier = options.includeCourier !== false
  const courierId = options.courierId ?? (includeCourier ? (delivery?.courierId ?? delivery?.courier_id) : null)
  if (courierId) {
    payload.courier_id = String(courierId)
  }

  const existingNimbuspostOrderId =
    options.nimbuspostOrderId ?? orderData.nimbuspostOrderId ?? orderData.nimbuspost_order_id
  if (existingNimbuspostOrderId) {
    payload.order_id = String(existingNimbuspostOrderId)
  }

  return payload
}

function parseNimbuspostResponse(responseText) {
  try {
    return JSON.parse(responseText)
  } catch {
    return { message: responseText }
  }
}

function extractNimbuspostIds(result) {
  const shipmentData = result?.data || result
  return {
    nimbuspostOrderId: shipmentData.order_id?.toString() || null,
    shipmentId: shipmentData.shipment_id?.toString() || null,
    awbNumber: shipmentData.awb_number?.toString() || null,
    status: shipmentData.status?.toString() || null,
    courierName: shipmentData.courier_name?.toString() || null,
    label: shipmentData.label?.toString() || null,
  }
}

export async function createNimbuspostOrder(orderData) {
  const payload = transformToNimbuspostFormat(orderData, { includeCourier: false })
  payload.auto_ship = false
  payload.autoship = false

  const path = process.env.NIMBUSPOST_CREATE_ORDER_PATH?.trim() || '/shipments'
  const response = await nimbuspostFetch(path, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const result = parseNimbuspostResponse(await response.text())

  if (!response.ok || result?.status === false) {
    const message = result?.message || result?.error || 'Could not create order in Nimbuspost'
    const autoshipHint = String(message).toLowerCase().includes('autoship')
      ? ' Disable Order Allocation/autoship in Nimbuspost, or contact Nimbuspost support to enable API order sync without auto-booking.'
      : ''
    return {
      success: false,
      error: `${message}${autoshipHint}`,
      details: result,
    }
  }

  const ids = extractNimbuspostIds(result)
  if (!ids.nimbuspostOrderId && !ids.shipmentId) {
    return {
      success: false,
      error: result?.message || 'Nimbuspost did not return an order id',
      details: result,
    }
  }

  return {
    success: true,
    ...ids,
    booked: Boolean(ids.awbNumber) || String(ids.status || '').toLowerCase() === 'booked',
    message: ids.awbNumber ? 'Order created and booked in Nimbuspost' : 'Order created in Nimbuspost',
  }
}

export async function bookNimbuspostShipment(orderData, courierId) {
  if (!courierId) {
    return { success: false, error: 'Courier partner is required to ship' }
  }

  const payload = transformToNimbuspostFormat(orderData, {
    courierId: String(courierId),
    nimbuspostOrderId: orderData.nimbuspostOrderId ?? orderData.nimbuspost_order_id,
    includeCourier: true,
  })

  const response = await nimbuspostFetch('/shipments', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  const result = parseNimbuspostResponse(await response.text())

  if (!response.ok || result?.status === false) {
    const pickupMissing =
      result?.message?.toLowerCase().includes('pickup') ||
      result?.message?.toLowerCase().includes('warehouse')
    return {
      success: false,
      error: pickupMissing
        ? 'Nimbuspost pickup warehouse not configured. Check NIMBUSPOST_PICKUP_* in .env and your Nimbuspost warehouse settings.'
        : result?.message || result?.error || `Nimbuspost API returned ${response.status}`,
      details: result,
    }
  }

  const ids = extractNimbuspostIds(result)
  if (!ids.awbNumber && !ids.shipmentId && !ids.nimbuspostOrderId) {
    return {
      success: false,
      error: result?.message || 'Nimbuspost did not book the shipment',
      details: result,
    }
  }

  return {
    success: true,
    ...ids,
    booked: true,
    message: 'Shipment booked in Nimbuspost',
  }
}

export async function listCouriersForOrder(orderData) {
  const shippingAddress = orderData.shippingAddress || orderData.shipping_address || {}
  const pincode = String(shippingAddress.pincode || '').replace(/\D/g, '').slice(0, 6)
  if (pincode.length !== 6) {
    return { success: false, error: 'Valid delivery pincode required' }
  }

  const paymentMethod = orderData.paymentMethod || orderData.payment_method || 'razorpay'
  const totals = orderData.totals || {}
  const subtotal = Math.round(parseFloat(totals.subtotal) || 0)
  const discount = Math.round(parseFloat(totals.couponDiscount) || 0)
  const orderValue = Math.max(1, subtotal - discount)
  const delivery = orderData.deliveryInfo || orderData.delivery_info || null

  const quote = await getShippingQuote({
    deliveryPincode: pincode,
    items: orderData.items || [],
    orderValue,
    cod: paymentMethod === 'cod',
    weightKg: delivery?.weightKg,
    includeAllCouriers: true,
  })

  if (!quote.success) {
    return quote
  }

  return {
    success: true,
    couriers: quote.couriers || [],
    recommendedCourierId: quote.recommendedCourierId,
  }
}

export async function resolveCourierIdForOrder(orderData) {
  const delivery = orderData.deliveryInfo || orderData.delivery_info || null
  const existing = delivery?.courierId ?? delivery?.courier_id
  if (existing) return String(existing)

  const shippingAddress = orderData.shippingAddress || orderData.shipping_address || {}
  const pincode = String(shippingAddress.pincode || '').replace(/\D/g, '').slice(0, 6)
  if (pincode.length !== 6) return null

  const paymentMethod = orderData.paymentMethod || orderData.payment_method || 'razorpay'
  const totals = orderData.totals || {}
  const subtotal = Math.round(parseFloat(totals.subtotal) || 0)
  const discount = Math.round(parseFloat(totals.couponDiscount) || 0)
  const orderValue = Math.max(1, subtotal - discount)

  const quote = await getShippingQuote({
    deliveryPincode: pincode,
    items: orderData.items || [],
    orderValue,
    cod: paymentMethod === 'cod',
    weightKg: delivery?.weightKg,
  })

  return quote.recommendedCourierId ? String(quote.recommendedCourierId) : null
}

export function mapNimbuspostStatusToOurStatus(nimbusStatus) {
  if (!nimbusStatus) return null

  const normalized = String(nimbusStatus).toUpperCase().trim()

  if (normalized.includes('DELIVERED')) return 'DELIVERED'
  if (normalized.includes('OUT FOR DELIVERY') || normalized.includes('OUT_FOR_DELIVERY')) {
    return 'OUT_FOR_DELIVERY'
  }
  if (
    normalized.includes('IN TRANSIT') ||
    normalized.includes('IN_TRANSIT') ||
    normalized.includes('PICKED UP') ||
    normalized.includes('PICKED_UP') ||
    normalized.includes('SHIPPED') ||
    normalized.includes('DISPATCHED') ||
    normalized.includes('BOOKED')
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
  const data = trackResponse?.data || trackResponse

  if (!data) return { status: null, awb: null }

  const awb =
    data.awb_number ||
    data.awb ||
    data.tracking_number ||
    trackResponse?.awb_number ||
    null

  const status =
    data.status ||
    data.current_status ||
    data.shipment_status ||
    (Array.isArray(data.tracking_history) && data.tracking_history.length > 0
      ? data.tracking_history[data.tracking_history.length - 1]?.status ||
        data.tracking_history[data.tracking_history.length - 1]?.activity
      : null) ||
    null

  return { status, awb }
}

export async function getShippingQuote({
  deliveryPincode,
  weightKg,
  cod = false,
  orderValue = 0,
  items = [],
  includeAllCouriers = false,
}) {
  if (!isNimbuspostConfigured()) {
    return {
      success: false,
      skipped: true,
      message: 'Nimbuspost not configured',
    }
  }

  const { billableWeightKg } = await import('./cart-weight.js')
  const pin = String(deliveryPincode || '').replace(/\D/g, '').slice(0, 6)
  if (pin.length !== 6) {
    return { success: false, error: 'Valid 6-digit delivery pincode required' }
  }

  const weight = billableWeightKg(items, weightKg)
  const freeAbove = parseFloat(process.env.FREE_SHIPPING_MIN_ORDER || '0')
  const isFreeShipping = freeAbove > 0 && orderValue >= freeAbove

  try {
    const pickupPincode = await getPickupPincode()
    const weightGrams = Math.max(500, Math.round(weight * 1000))
    const defaultLength = parseFloat(process.env.NIMBUSPOST_DEFAULT_LENGTH || '10')
    const defaultBreadth = parseFloat(process.env.NIMBUSPOST_DEFAULT_BREADTH || '10')
    const defaultHeight = parseFloat(process.env.NIMBUSPOST_DEFAULT_HEIGHT || '10')

    const response = await nimbuspostFetch('/courier/serviceability', {
      method: 'POST',
      body: JSON.stringify({
        origin: pickupPincode,
        destination: pin,
        weight: weightGrams,
        cod: cod ? 1 : 0,
        length: defaultLength,
        breadth: defaultBreadth,
        height: defaultHeight,
        order_amount: Math.max(1, Math.round(orderValue || 0)),
        payment_type: cod ? 'cod' : 'prepaid',
      }),
    })
    const data = await response.json()

    if (!response.ok || data?.status === false) {
      return {
        success: false,
        error: data?.message || 'Could not fetch shipping rate',
        details: data,
      }
    }

    const companies = Array.isArray(data?.data) ? data.data : []
    if (!companies.length) {
      return {
        success: false,
        error: 'Delivery is not available for this pincode. Please try a different address.',
      }
    }

    const slabMatches = companies.filter(
      (c) => Number(c.min_weight || c.chargeable_weight || 0) === weightGrams
    )
    const candidates = slabMatches.length ? slabMatches : companies

    const sorted = [...candidates].sort(
      (a, b) =>
        parseFloat(a.total_charges || a.freight_charges || 0) -
        parseFloat(b.total_charges || b.freight_charges || 0)
    )

    const rateMode = (process.env.SHIPPING_RATE_MODE || 'recommended').toLowerCase()
    let selected = sorted[0]

    if (rateMode === 'recommended') {
      const preferredNames = ['Ekart', 'Delhivery Surface', 'Xpressbees Surface', 'Amazon Shipping']
      const preferred = sorted.find((c) => preferredNames.includes(c.name))
      if (preferred) selected = preferred
    }

    let price = parseFloat(selected.total_charges || selected.freight_charges || 0)
    if (!price || price <= 0) {
      return {
        success: false,
        error: 'Could not determine delivery charge for this pincode.',
        details: data,
      }
    }

    const markup = parseFloat(process.env.SHIPPING_MARKUP || '0')
    if (markup > 0) price += markup

    price = Math.ceil(price)

    const couriers = includeAllCouriers
      ? sorted.map((c) => ({
          id: c.id ?? null,
          name: c.name || 'Courier',
          price: Math.ceil(parseFloat(c.total_charges || c.freight_charges || 0)),
          estimatedDelivery: c.edd || null,
        }))
      : undefined

    return {
      success: true,
      deliveryPrice: isFreeShipping ? 0 : price,
      courierName: selected.name || null,
      estimatedDelivery: selected.edd || null,
      weightKg: weight,
      freeShipping: isFreeShipping,
      pickupPincode,
      deliveryPincode: pin,
      cod: Boolean(cod),
      rateMode,
      recommendedCourierId: selected.id ?? null,
      couriers,
    }
  } catch (error) {
    console.warn('Nimbuspost rate lookup failed:', error.message)
    return {
      success: false,
      error: error.message || 'Could not reach Nimbuspost',
      message: 'Nimbuspost unavailable — could not calculate delivery charge',
    }
  }
}

export function getTrackingUrl(awb) {
  if (!awb) return ''
  return `https://nimbuspost.com/tracking/?awb=${encodeURIComponent(awb)}`
}
