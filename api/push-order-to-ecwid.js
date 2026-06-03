/**
 * Backend API endpoint to push orders to Ecwid
 * This keeps the secret token secure on the server side
 */

import dotenv from 'dotenv'
dotenv.config()

// Backend can read VITE_ prefixed vars, but also check non-prefixed versions
const ECWID_STORE_ID = process.env.VITE_ECWID_STORE_ID || process.env.ECWID_STORE_ID
const ECWID_SECRET_TOKEN = process.env.VITE_ECWID_SECRET_TOKEN || process.env.ECWID_SECRET_TOKEN
const ECWID_PUBLIC_TOKEN = process.env.VITE_ECWID_PUBLIC_TOKEN || process.env.ECWID_PUBLIC_TOKEN || 'public_1bfbXJfM8ihCk5LAH2B8zyP23UAZSs4y'

// For OAuth client credentials flow (if needed)
const ECWID_CLIENT_ID = ECWID_PUBLIC_TOKEN // Public token is the Client ID
const ECWID_CLIENT_SECRET = ECWID_SECRET_TOKEN // Secret token is the Client Secret

/**
 * Ecwid custom apps use API keys directly, not OAuth flow
 * The secret token is used directly for authentication
 */

// Test function to verify authentication works
async function testEcwidAuth() {
  try {
    const testUrl = `https://app.ecwid.com/api/v3/${ECWID_STORE_ID}/profile`
    const cleanedToken = ECWID_SECRET_TOKEN.trim()
    
    console.log('🧪 SERVER: Testing Ecwid authentication...')
    const testResponse = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${cleanedToken}`,
      }
    })
    
    console.log('🧪 SERVER: Auth test response:', testResponse.status, testResponse.statusText)
    
    if (testResponse.ok) {
      const profile = await testResponse.json()
      console.log('✅ SERVER: Authentication works! Store:', profile.name || 'Unknown')
      return true
    } else {
      const errorText = await testResponse.text()
      console.log('❌ SERVER: Auth test failed:', errorText)
      return false
    }
  } catch (err) {
    console.error('❌ SERVER: Auth test exception:', err.message)
    return false
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!ECWID_STORE_ID || !ECWID_SECRET_TOKEN) {
      console.warn('⚠️ Ecwid credentials not configured on server')
      return res.status(500).json({ 
        success: false, 
        error: 'Ecwid credentials not configured on server' 
      })
    }

    const orderData = req.body
    console.log('📦 SERVER: Pushing order to Ecwid:', orderData.orderId)
    console.log('🔑 SERVER: Using Store ID:', ECWID_STORE_ID)
    
    // Test authentication first - but don't fail if test fails, just log it
    console.log('🧪 SERVER: Testing authentication before creating order...')
    const authWorks = await testEcwidAuth()
    if (!authWorks) {
      console.warn('⚠️ SERVER: Authentication test failed, but continuing anyway...')
      console.warn('⚠️ SERVER: This might cause order creation to fail')
      // Don't return error - try to create order anyway
      // Sometimes the test fails but order creation works
    } else {
      console.log('✅ SERVER: Authentication test passed!')
    }

    // Transform order data to Ecwid format
    const ecwidOrder = transformToEcwidFormat(orderData)
    console.log('📋 SERVER: Ecwid order payload prepared')

    // Push to Ecwid API
    const apiUrl = `https://app.ecwid.com/api/v3/${ECWID_STORE_ID}/orders`
    console.log('🌐 SERVER: Calling Ecwid API:', apiUrl)

    // Log the full payload for debugging (to verify format matches Ecwid requirements)
    console.log('📋 SERVER: Full Ecwid order payload:', JSON.stringify(ecwidOrder, null, 2))

    // Per Ecwid docs: Secret token IS the access token for backend operations
    // It's non-expiring and works directly with Bearer authentication
    // No OAuth flow needed - just use secret token as Bearer token!
    
    console.log('🔐 SERVER: Using SECRET TOKEN as access token (per Ecwid documentation)')
    console.log('🔑 Store ID:', ECWID_STORE_ID)
    console.log('🔑 Secret Token format:', ECWID_SECRET_TOKEN?.startsWith('secret_') ? '✅ Correct (starts with secret_)' : '⚠️ Check format')
    
    // Verify secret token is set
    if (!ECWID_SECRET_TOKEN) {
      console.error('❌ SERVER: Ecwid secret token is missing')
      return res.status(500).json({
        success: false,
        error: 'Ecwid secret token not configured. Get it from Ecwid Admin → Settings → Apps → Your App → Access Tokens'
      })
    }
    
    // Debug: Verify token is correct format (no whitespace, proper length)
    const cleanedToken = ECWID_SECRET_TOKEN.trim()
    console.log('🔍 SERVER: Token verification:')
    console.log('   - Length:', cleanedToken.length)
    console.log('   - Starts with "secret_":', cleanedToken.startsWith('secret_'))
    console.log('   - First 30 chars:', cleanedToken.substring(0, 30) + '...')
    console.log('   - Last 10 chars:', '...' + cleanedToken.substring(cleanedToken.length - 10))
    console.log('   - Full token (first 50 + last 10):', cleanedToken.substring(0, 50) + '...' + cleanedToken.substring(cleanedToken.length - 10))
    
    if (cleanedToken !== ECWID_SECRET_TOKEN) {
      console.warn('⚠️ SERVER: Token had whitespace - using trimmed version')
    }
    
    // Verify the token matches what we expect from .env
    if (!cleanedToken.startsWith('secret_BMU')) {
      console.error('❌ SERVER: Token does not match expected format!')
      console.error('   Expected to start with: secret_BMU...')
      console.error('   Actual token starts with:', cleanedToken.substring(0, 20))
      console.error('   This might be why authentication is failing!')
      console.error('   Please verify .env file has correct VITE_ECWID_SECRET_TOKEN')
    }
    
    // Try to get access token via OAuth client credentials flow first
    // Some Ecwid apps require this instead of using secret token directly
    let accessToken = null
    try {
      console.log('🔐 SERVER: Attempting OAuth client credentials flow...')
      console.log('🔑 Client ID (Public Token):', ECWID_PUBLIC_TOKEN.substring(0, 20) + '...')
      console.log('🔑 Client Secret (Secret Token):', ECWID_SECRET_TOKEN.substring(0, 20) + '...')
      
      const oauthResponse = await fetch('https://my.ecwid.com/api/oauth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: ECWID_PUBLIC_TOKEN,
          client_secret: ECWID_SECRET_TOKEN
        })
      })
      
      if (oauthResponse.ok) {
        const oauthData = await oauthResponse.json()
        accessToken = oauthData.access_token
        console.log('✅ SERVER: Got access token via OAuth!')
        console.log('🔑 Access token (first 20 chars):', accessToken?.substring(0, 20) + '...')
      } else {
        const oauthError = await oauthResponse.text()
        console.log('⚠️ SERVER: OAuth flow failed:', oauthError)
        console.log('⚠️ SERVER: Will try using secret token directly...')
      }
    } catch (oauthErr) {
      console.log('⚠️ SERVER: OAuth exception:', oauthErr.message)
      console.log('⚠️ SERVER: Will try using secret token directly...')
    }
    
    // Use access token from OAuth, or fall back to cleaned secret token
    const tokenToUse = accessToken || cleanedToken
    console.log('🔑 SERVER: Using token for API call:', accessToken ? 'OAuth access token' : 'Secret token (direct)')
    console.log('🔑 SERVER: Token to use (first 30 chars):', tokenToUse.substring(0, 30) + '...')
    
    let response
    let lastError
    let responseBody = null // Store response body to avoid reading multiple times
    
    // Helper function to read response body only once
    const readResponseBody = async (res) => {
      // Check if body has already been consumed
      if (res.bodyUsed) {
        console.log('⚠️ Response body already consumed, returning cached error')
        return lastError || 'Response body already consumed'
      }
      
      const contentLength = res.headers.get('content-length')
      if (contentLength === '0') {
        console.log('⚠️ Response has content-length: 0 - no body to read')
        return ''
      }
      
      try {
        const text = await res.text()
        return text || ''
      } catch (err) {
        if (err.message.includes('already been read') || err.message.includes('Body is unusable')) {
          console.log('⚠️ Body already read, using cached error')
          return lastError || 'Response body already consumed'
        }
        console.error('❌ Error reading response body:', err.message)
        return ''
      }
    }
    
    // Try multiple authentication methods
    // Method 1: Bearer token with access token or secret token
    try {
      console.log('🔐 SERVER: Method 1 - Bearer token authentication')
      console.log('🔑 Token length:', tokenToUse.length)
      console.log('🔑 Token starts with:', tokenToUse.substring(0, 10))
      console.log('🔑 Token ends with:', '...' + tokenToUse.substring(tokenToUse.length - 10))
      
      // Build headers
      const headers1 = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenToUse}`,
      }
      
      // Log exact authorization header being sent (first 30 chars only for security)
      const authHeaderValue = `Bearer ${tokenToUse}`
      console.log('🔑 Authorization header value (first 40 chars):', authHeaderValue.substring(0, 40) + '...')
      console.log('🔑 Authorization header length:', authHeaderValue.length)
      
      // Make the request
      console.log('📡 SERVER: Making POST request to:', apiUrl)
      console.log('📋 SERVER: Request body size:', JSON.stringify(ecwidOrder).length, 'bytes')
      
      response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers1,
        body: JSON.stringify(ecwidOrder)
      })
      
      console.log('📡 SERVER: Method 1 response status:', response.status, response.statusText)
      
      // Log all response headers
      const responseHeaders = Object.fromEntries(response.headers.entries())
      console.log('📡 SERVER: Response headers:', JSON.stringify(responseHeaders, null, 2))
      
      if (!response.ok) {
        responseBody = null // Reset for this method
        const errorText = await readResponseBody(response)
        console.log('❌ SERVER: Method 1 error response length:', errorText.length)
        console.log('❌ SERVER: Method 1 error response:', errorText)
        lastError = errorText || 'Empty error response'
      } else {
        console.log('✅ SERVER: Method 1 SUCCESS!')
        responseBody = null // Reset for success case to read the actual response
      }
    } catch (err) {
      console.error('❌ SERVER: Method 1 exception:', err.message)
      console.error('❌ SERVER: Exception stack:', err.stack)
      lastError = err.message
      responseBody = null
    }
    
    // Method 2: Token without Bearer prefix (some APIs use just the token)
    if (!response || !response.ok) {
      try {
        console.log('🔐 SERVER: Method 2 - Token without Bearer prefix...')
        responseBody = null // Reset for new request
        
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': tokenToUse, // No Bearer prefix
          },
          body: JSON.stringify(ecwidOrder)
        })
        
        console.log('📡 SERVER: Method 2 response:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await readResponseBody(response)
          console.log('❌ SERVER: Method 2 error:', errorText || '(empty response body)')
          lastError = errorText || 'Empty error response'
        } else {
          console.log('✅ SERVER: Method 2 SUCCESS!')
          responseBody = null // Reset for success case
        }
      } catch (err) {
        console.error('❌ SERVER: Method 2 exception:', err.message)
        if (!lastError) lastError = err.message
        responseBody = null
      }
    }
    
    // Method 3: Query parameter (legacy method)
    if (!response || !response.ok) {
      try {
        console.log('🔐 SERVER: Method 3 - Query parameter authentication...')
        const apiUrlWithToken = `${apiUrl}?token=${tokenToUse}`
        responseBody = null // Reset for new request
        
        response = await fetch(apiUrlWithToken, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ecwidOrder)
        })
        
        console.log('📡 SERVER: Method 3 response:', response.status, response.statusText)
        
        if (!response.ok) {
          const errorText = await readResponseBody(response)
          console.log('❌ SERVER: Method 3 error:', errorText || '(empty response body)')
          lastError = errorText || 'Empty error response'
        } else {
          console.log('✅ SERVER: Method 3 SUCCESS!')
          responseBody = null // Reset for success case
        }
      } catch (err) {
        console.error('❌ SERVER: Method 3 exception:', err.message)
        if (!lastError) lastError = err.message
        responseBody = null
      }
    }
    
    // Log final response details
    if (response) {
      const responseHeaders = Object.fromEntries(response.headers.entries())
      console.log('📡 SERVER: Final response headers:', JSON.stringify(responseHeaders, null, 2))
    }
    
    // If it fails, the secret token might need to be used without "Bearer" prefix
    // Or there might be a permissions issue - check error details
    
    if (!response || !response.ok) {
      let errorText = lastError || 'Unknown error'
      let errorDetails = errorText
      
      // Don't try to read response body again - use what we already have
      if (response && !lastError && responseBody === null) {
        // Only read if we haven't read it yet
        try {
          errorText = await readResponseBody(response)
          try {
            errorDetails = JSON.parse(errorText)
          } catch {
            errorDetails = errorText
          }
        } catch (err) {
          errorText = lastError || 'Could not read error response'
          errorDetails = err.message
        }
      } else if (lastError) {
        try {
          errorDetails = JSON.parse(lastError)
        } catch {
          errorDetails = lastError
        }
      }
      
      console.error('❌ SERVER: Ecwid API error response:', errorDetails)
      const statusCode = response?.status || 500
      console.error('❌ SERVER: Response status:', statusCode, response?.statusText || 'No response')
      
      // Provide helpful error messages based on status code
      let errorMessage = `Ecwid API returned ${statusCode}`
      let suggestion = null
      
      if (statusCode === 401 || statusCode === 403) {
        errorMessage = `Ecwid API authentication failed (${statusCode}). INVALID_APP_KEYS error detected.`
        suggestion = `CRITICAL: The error "INVALID_APP_KEYS" suggests your custom app may not be properly installed/authorized.\n\n` +
          `ACTION REQUIRED:\n` +
          `1. Go to Ecwid Admin Panel → Settings → Apps → Your Custom App\n` +
          `2. Make sure the app is INSTALLED/AUTHORIZED in your store (not just created)\n` +
          `3. Verify the app shows as "Active" or "Installed" status\n` +
          `4. Check if you need to click "Install" or "Authorize" button\n` +
          `5. If app is installed, try regenerating the secret token:\n` +
          `   - Go to App Settings → Access Tokens → Regenerate Secret Token\n` +
          `   - Update your .env file with the new token\n\n` +
          `VERIFICATION:\n` +
          `- Store ID: ${ECWID_STORE_ID}\n` +
          `- Secret Token: ${ECWID_SECRET_TOKEN?.substring(0, 20)}... (length: ${ECWID_SECRET_TOKEN?.length})\n` +
          `- Token format: ${ECWID_SECRET_TOKEN?.startsWith('secret_') ? '✅ Correct' : '❌ Wrong format'}\n\n` +
          `Full error: ${JSON.stringify(errorDetails)}`
      } else if (statusCode === 400) {
        errorMessage = `Ecwid API rejected the request (400). Check order payload format.`
        suggestion = errorDetails?.errorMessage || 'Verify order data structure matches Ecwid API requirements.'
      }
      
      return res.status(statusCode).json({
        success: false,
        error: errorMessage,
        details: errorDetails,
        rawError: errorText,
        suggestion: suggestion
      })
    }

    const result = await response.json()
    console.log('✅ SERVER: Order synced to Ecwid successfully:', result.id)

    return res.status(200).json({
      success: true,
      ecwidOrderId: result.id,
      orderNumber: result.orderNumber
    })

  } catch (error) {
    console.error('❌ SERVER: Failed to push order to Ecwid:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to push order to Ecwid'
    })
  }
}

/**
 * Transform order data to Ecwid format
 */
function transformToEcwidFormat(orderData) {
  const {
    orderId,
    paymentId,
    items = [],
    totals = {},
    shippingAddress = {},
    deliveryInfo = {},
    paymentMethod = 'razorpay',
    userId = null,
    couponCode = null,
    errorMessage = null
  } = orderData

  // Transform items to Ecwid format
  // Note: Don't include productId if product doesn't exist in Ecwid
  // Ecwid will create the order item based on name, SKU, and price
  const ecwidItems = items.map((item, index) => {
    const itemData = {
      price: parseFloat(item.price) || 0,
      quantity: parseInt(item.quantity) || 1,
      name: item.name || 'Product',
      sku: item.sku || `SKU-${item.id || index}`,
      weight: item.weight || 0,
      selectedOptions: item.size ? [
        {
          name: 'Size',
          value: item.size,
          type: 'CHOICE'
        }
      ] : []
    }
    
    // Only include productId if we're sure it exists in Ecwid
    // For now, let Ecwid create items without productId (it will match by SKU or create new)
    // If you have products synced to Ecwid, uncomment this line:
    // itemData.productId = parseInt(item.id) || index + 1000
    
    return itemData
  })

  // Calculate totals
  const subtotal = parseFloat(totals.subtotal) || 0
  const shipping = parseFloat(totals.delivery) || 0
  const discount = parseFloat(totals.couponDiscount) || 0
  const total = parseFloat(totals.total) || (subtotal + shipping - discount)

  // Map Indian state names to ISO codes (Ecwid might require ISO format)
  const stateCodeMap = {
    'Telangana': 'TG',
    'Andhra Pradesh': 'AP',
    'Karnataka': 'KA',
    'Tamil Nadu': 'TN',
    'Kerala': 'KL',
    'Maharashtra': 'MH',
    'Gujarat': 'GJ',
    'Rajasthan': 'RJ',
    'Delhi': 'DL',
    'Punjab': 'PB',
    'Haryana': 'HR',
    'Uttar Pradesh': 'UP',
    'West Bengal': 'WB'
  }
  
  const getStateCode = (stateName) => {
    if (!stateName) return ''
    // Try to find ISO code, otherwise use state name as-is
    return stateCodeMap[stateName] || stateName
  }

  // Build Ecwid order object
  const ecwidOrder = {
    externalTransactionId: orderId || `order_${Date.now()}`,
    paymentMethod: paymentMethod === 'razorpay' ? 'Razorpay' : paymentMethod,
    paymentStatus: errorMessage ? 'INCOMPLETE' : 'PAID',
    paymentReference: paymentId || null,
    email: shippingAddress.email || 'noemail@example.com',
    items: ecwidItems,
    subtotal: subtotal,
    total: total,
    shippingOption: {
      shippingMethodName: deliveryInfo?.deliveryMethod || 'Standard Shipping',
      shippingRate: shipping
    },
    billingPerson: {
      name: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || 'Customer',
      companyName: shippingAddress.companyName || '',
      street: shippingAddress.address || '',
      city: shippingAddress.city || '',
      countryCode: 'IN',
      postalCode: shippingAddress.pincode || '',
      stateOrProvinceCode: getStateCode(shippingAddress.state),
      phone: shippingAddress.phone || ''
    },
    shippingPerson: {
      name: `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}`.trim() || 'Customer',
      companyName: shippingAddress.companyName || '',
      street: shippingAddress.address || '',
      city: shippingAddress.city || '',
      countryCode: 'IN',
      postalCode: shippingAddress.pincode || '',
      stateOrProvinceCode: getStateCode(shippingAddress.state),
      phone: shippingAddress.phone || ''
    },
    fulfillmentStatus: 'AWAITING_PROCESSING',
    customerGroup: userId ? 'Registered' : 'Guest',
    privateAdminNotes: buildAdminNotes(orderData),
    orderComments: shippingAddress.notes || '',
    ...(couponCode ? {
      couponDiscount: discount,
      discountCoupon: {
        name: couponCode,
        code: couponCode
      }
    } : {})
  }

  return ecwidOrder
}

function buildAdminNotes(orderData) {
  const notes = []
  notes.push(`Source: Custom Website`)
  notes.push(`Order ID: ${orderData.orderId}`)
  if (orderData.paymentId) {
    notes.push(`Payment ID: ${orderData.paymentId}`)
  }
  if (orderData.userId) {
    notes.push(`User ID: ${orderData.userId}`)
  }
  if (orderData.couponCode) {
    notes.push(`Coupon Used: ${orderData.couponCode}`)
  }
  if (orderData.errorMessage) {
    notes.push(`\n⚠️ PAYMENT FAILED`)
    notes.push(`Error: ${orderData.errorMessage}`)
  }
  notes.push(`\nCreated: ${new Date().toISOString()}`)
  return notes.join('\n')
}

