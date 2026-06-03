import dotenv from 'dotenv'
dotenv.config()

const ECWID_STORE_ID = process.env.VITE_ECWID_STORE_ID || process.env.ECWID_STORE_ID
const ECWID_SECRET_TOKEN = process.env.VITE_ECWID_SECRET_TOKEN || process.env.ECWID_SECRET_TOKEN

/**
 * Update order status in Ecwid
 * Also updates Supabase and sends email to customer
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    if (!ECWID_STORE_ID || !ECWID_SECRET_TOKEN) {
      return res.status(500).json({
        success: false,
        error: 'Ecwid credentials not configured'
      })
    }

    const { orderId, ecwidOrderId, status, trackingNumber } = req.body

    if (!orderId || !status) {
      return res.status(400).json({
        success: false,
        error: 'orderId and status are required'
      })
    }

    console.log('🔄 SERVER: Updating order status in Ecwid...')
    console.log('   Order ID:', orderId)
    console.log('   Ecwid Order ID:', ecwidOrderId)
    console.log('   New Status:', status)
    console.log('   Tracking:', trackingNumber || 'N/A')

    // Map our status to Ecwid status
    const ecwidStatus = mapOurStatusToEcwidStatus(status)
    
    if (!ecwidStatus) {
      return res.status(400).json({
        success: false,
        error: `Invalid status: ${status}. Valid statuses: PACKED, SHIPPED, OUT_FOR_DELIVERY, DELIVERED`
      })
    }

    // Update in Ecwid if we have ecwidOrderId
    if (ecwidOrderId) {
      const apiUrl = `https://app.ecwid.com/api/v3/${ECWID_STORE_ID}/orders/${ecwidOrderId}`
      const cleanedToken = ECWID_SECRET_TOKEN.trim()
      
      const updatePayload = {
        fulfillmentStatus: ecwidStatus
      }
      
      // Add tracking number if provided
      if (trackingNumber && status === 'SHIPPED') {
        updatePayload.trackingNumber = trackingNumber
      }

      try {
        const response = await fetch(apiUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${cleanedToken}`,
          },
          body: JSON.stringify(updatePayload)
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error('❌ SERVER: Failed to update Ecwid order:', errorText)
          // Don't fail - continue with Supabase update
        } else {
          console.log('✅ SERVER: Order status updated in Ecwid')
        }
      } catch (err) {
        console.error('❌ SERVER: Exception updating Ecwid order:', err.message)
        // Don't fail - continue with Supabase update
      }
    } else {
      console.log('⚠️ SERVER: No Ecwid Order ID - skipping Ecwid update')
    }

    const { getFirestoreDb, findOrderByOrderId } = await import('./lib/firestore-server.js')
    let db
    try {
      db = getFirestoreDb()
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err.message || 'Firebase Admin not configured',
      })
    }

    const updateData = { fulfillment_status: status }
    if (trackingNumber) {
      updateData.tracking_number = trackingNumber
    }

    const existing = await findOrderByOrderId(db, orderId)
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
      })
    }

    await db.collection('orders').doc(existing.id).update(updateData)
    console.log('✅ SERVER: Order status updated in Firestore')

    const order = { ...existing, ...updateData }

    // Send email to customer (async - don't wait)
    if (order && order.shipping_address?.email) {
      sendStatusEmail(order, status, trackingNumber).catch(err => {
        console.error('❌ SERVER: Failed to send status email:', err.message)
      })
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      orderId,
      status
    })

  } catch (error) {
    console.error('❌ SERVER: Failed to update order status:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update order status'
    })
  }
}

/**
 * Map our status to Ecwid status format
 */
function mapOurStatusToEcwidStatus(status) {
  const statusMap = {
    'PACKED': 'PROCESSING',
    'SHIPPED': 'SHIPPED',
    'OUT_FOR_DELIVERY': 'SHIPPED', // Ecwid doesn't have out for delivery, use SHIPPED
    'DELIVERED': 'DELIVERED',
    'AWAITING_PROCESSING': 'AWAITING_PROCESSING'
  }
  
  return statusMap[status]
}

/**
 * Send status update email to customer
 */
async function sendStatusEmail(order, status, trackingNumber) {
  try {
    const nodemailer = await import('nodemailer')
    
    // Create transporter (same config as send-order-email.js)
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || process.env.GMAIL_USER || 'moksh.dev0411@gmail.com',
        pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD
      }
    })
    
    const customerEmail = order.shipping_address?.email
    if (!customerEmail) {
      console.log('⚠️ No customer email for status update')
      return
    }

    const emailTemplate = getStatusEmailTemplate(order, status, trackingNumber)
    
    await transporter.sendMail({
      from: process.env.SMTP_USER || process.env.GMAIL_USER || 'moksh.dev0411@gmail.com',
      to: customerEmail,
      subject: emailTemplate.subject,
      html: emailTemplate.html
    })

    console.log(`✅ Status email sent to ${customerEmail}`)
  } catch (error) {
    console.error('❌ Error sending status email:', error)
    throw error
  }
}

/**
 * Get email template for status update
 */
function getStatusEmailTemplate(order, status, trackingNumber) {
  const customerName = `${order.shipping_address?.firstName || ''} ${order.shipping_address?.lastName || ''}`.trim() || 'Customer'
  const orderId = order.order_id
  
  const templates = {
    'PACKED': {
      subject: '📦 Your Order is Packed - Amrutha Bindu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B7355;">Your Order is Packed!</h2>
          <p>Dear ${customerName},</p>
          <p>Great news! Your order <strong>${orderId}</strong> has been packed and is ready to ship.</p>
          <p>We'll notify you once it's shipped with tracking information.</p>
          <p>Thank you for choosing Amrutha Bindu!</p>
        </div>
      `
    },
    'SHIPPED': {
      subject: '🚚 Your Order Has Been Shipped - Amrutha Bindu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B7355;">Your Order Has Been Shipped!</h2>
          <p>Dear ${customerName},</p>
          <p>Your order <strong>${orderId}</strong> has been shipped and is on its way to you!</p>
          ${trackingNumber ? `<p><strong>Tracking Number:</strong> ${trackingNumber}</p>` : ''}
          <p>You can track your order using the tracking number above.</p>
          <p>Thank you for choosing Amrutha Bindu!</p>
        </div>
      `
    },
    'OUT_FOR_DELIVERY': {
      subject: '🚛 Your Order is Out for Delivery - Amrutha Bindu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B7355;">Your Order is Out for Delivery!</h2>
          <p>Dear ${customerName},</p>
          <p>Exciting news! Your order <strong>${orderId}</strong> is out for delivery and will reach you soon.</p>
          <p>Please ensure someone is available to receive the package.</p>
          <p>Thank you for choosing Amrutha Bindu!</p>
        </div>
      `
    },
    'DELIVERED': {
      subject: '✅ Your Order Has Been Delivered - Amrutha Bindu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B7355;">Your Order Has Been Delivered!</h2>
          <p>Dear ${customerName},</p>
          <p>Great news! Your order <strong>${orderId}</strong> has been successfully delivered.</p>
          <p>We hope you enjoy your products. If you have any questions or feedback, please don't hesitate to contact us.</p>
          <p>Thank you for choosing Amrutha Bindu!</p>
        </div>
      `
    }
  }

  return templates[status] || {
    subject: `Order Status Update - ${orderId}`,
    html: `<p>Your order ${orderId} status has been updated to ${status}.</p>`
  }
}

