import dotenv from 'dotenv'
dotenv.config()

const ECWID_STORE_ID = process.env.VITE_ECWID_STORE_ID || process.env.ECWID_STORE_ID
const ECWID_SECRET_TOKEN = process.env.VITE_ECWID_SECRET_TOKEN || process.env.ECWID_SECRET_TOKEN

/**
 * Check order tracking status from Ecwid and automatically send emails
 * This runs periodically to check for status changes
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

    console.log('🔄 SERVER: Checking order tracking status from Ecwid...')
    
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

    const ordersSnap = await db.collection('orders').get()
    const orders = ordersSnap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((o) => o.ecwid_order_id && o.fulfillment_status !== 'DELIVERED')
    
    console.log(`📦 SERVER: Checking ${orders.length} orders for status updates`)
    
    const cleanedToken = ECWID_SECRET_TOKEN.trim()
    let updated = 0
    let emailsSent = 0
    
    // Check each order's status in Ecwid
    for (const order of orders) {
      try {
        const apiUrl = `https://app.ecwid.com/api/v3/${ECWID_STORE_ID}/orders/${order.ecwid_order_id}`
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${cleanedToken}`,
          }
        })
        
        if (!response.ok) {
          console.error(`❌ SERVER: Failed to fetch order ${order.ecwid_order_id} from Ecwid:`, response.status)
          continue
        }
        
        const ecwidOrder = await response.json()
        const ecwidStatus = mapEcwidStatusToOurStatus(ecwidOrder.fulfillmentStatus)
        const currentStatus = order.fulfillment_status || 'AWAITING_PROCESSING'
        
        // Check if status changed
        if (ecwidStatus !== currentStatus && ecwidStatus) {
          console.log(`🔄 SERVER: Order ${order.order_id} status changed: ${currentStatus} → ${ecwidStatus}`)
          
          const existing = await findOrderByOrderId(db, order.order_id)
          if (!existing) continue

          await db.collection('orders').doc(existing.id).update({
            fulfillment_status: ecwidStatus,
            tracking_number: ecwidOrder.trackingNumber || order.tracking_number,
          })
          
          updated++
          
          // Send email automatically if status changed
          if (order.shipping_address?.email) {
            try {
              await sendStatusEmail(order, ecwidStatus, ecwidOrder.trackingNumber || order.tracking_number)
              emailsSent++
              console.log(`✅ SERVER: Email sent to ${order.shipping_address.email} for status: ${ecwidStatus}`)
            } catch (emailError) {
              console.error(`❌ SERVER: Failed to send email for order ${order.order_id}:`, emailError.message)
            }
          }
        }
      } catch (orderError) {
        console.error(`❌ SERVER: Error checking order ${order.order_id}:`, orderError.message)
      }
    }
    
    console.log(`✅ SERVER: Tracking check complete - ${updated} orders updated, ${emailsSent} emails sent`)
    
    return res.status(200).json({
      success: true,
      updated,
      emailsSent,
      checked: orders.length,
      message: `Checked ${orders.length} orders. ${updated} status updates, ${emailsSent} emails sent.`
    })
    
  } catch (error) {
    console.error('❌ SERVER: Failed to check tracking:', error)
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to check tracking status'
    })
  }
}

/**
 * Map Ecwid fulfillment status to our status format
 */
function mapEcwidStatusToOurStatus(ecwidStatus) {
  const statusMap = {
    'AWAITING_PROCESSING': 'AWAITING_PROCESSING',
    'PROCESSING': 'PACKED',
    'SHIPPED': 'SHIPPED',
    'DELIVERED': 'DELIVERED',
    'WILL_NOT_DELIVER': 'CANCELLED',
    'RETURNED': 'RETURNED'
  }
  
  return statusMap[ecwidStatus] || null
}

/**
 * Send status update email to customer
 */
async function sendStatusEmail(order, status, trackingNumber) {
  try {
    const nodemailer = await import('nodemailer')
    
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #8B7355; margin-top: 0;">Your Order is Packed!</h2>
            <p>Dear ${customerName},</p>
            <p>Great news! Your order <strong>${orderId}</strong> has been packed and is ready to ship.</p>
            <p>We'll notify you once it's shipped with tracking information.</p>
            <p style="margin-top: 30px;">Thank you for choosing Amrutha Bindu!</p>
          </div>
        </div>
      `
    },
    'SHIPPED': {
      subject: '🚚 Your Order Has Been Shipped - Amrutha Bindu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #8B7355; margin-top: 0;">Your Order Has Been Shipped!</h2>
            <p>Dear ${customerName},</p>
            <p>Your order <strong>${orderId}</strong> has been shipped and is on its way to you!</p>
            ${trackingNumber ? `
              <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0;"><strong>Tracking Number:</strong> ${trackingNumber}</p>
                <p style="margin: 5px 0 0 0; font-size: 14px;">Track your order at: <a href="https://www.indiapost.gov.in/_layouts/15/Poster/TrackAndTrace.aspx?trackingNumber=${trackingNumber}" target="_blank">India Post Tracking</a></p>
              </div>
            ` : ''}
            <p>You can track your order using the tracking number above.</p>
            <p style="margin-top: 30px;">Thank you for choosing Amrutha Bindu!</p>
          </div>
        </div>
      `
    },
    'OUT_FOR_DELIVERY': {
      subject: '🚛 Your Order is Out for Delivery - Amrutha Bindu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #8B7355; margin-top: 0;">Your Order is Out for Delivery!</h2>
            <p>Dear ${customerName},</p>
            <p>Exciting news! Your order <strong>${orderId}</strong> is out for delivery and will reach you soon.</p>
            <p>Please ensure someone is available to receive the package.</p>
            <p style="margin-top: 30px;">Thank you for choosing Amrutha Bindu!</p>
          </div>
        </div>
      `
    },
    'DELIVERED': {
      subject: '✅ Your Order Has Been Delivered - Amrutha Bindu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <h2 style="color: #8B7355; margin-top: 0;">Your Order Has Been Delivered!</h2>
            <p>Dear ${customerName},</p>
            <p>Great news! Your order <strong>${orderId}</strong> has been successfully delivered.</p>
            <p>We hope you enjoy your products. If you have any questions or feedback, please don't hesitate to contact us.</p>
            <p style="margin-top: 30px;">Thank you for choosing Amrutha Bindu!</p>
          </div>
        </div>
      `
    }
  }

  return templates[status] || {
    subject: `Order Status Update - ${orderId}`,
    html: `<p>Your order ${orderId} status has been updated to ${status}.</p>`
  }
}

