import nodemailer from 'nodemailer'
import puppeteer from 'puppeteer'
import { CONTACT_EMAIL, SUPPORT_EMAIL, PHONE_DISPLAY } from '../lib/contact.js'

// Logo URL - hosted on the website
const LOGO_URL = 'https://amruthabindu.in/logo.png'

async function generateActualPDFFromHtml(html) {
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '0.3in',
        right: '0.3in',
        bottom: '0.3in',
        left: '0.3in'
      },
      printBackground: true
    })
    
    await browser.close()
    return pdfBuffer
  } catch (error) {
    console.error('PDF generation failed:', error)
    // Fallback to HTML
    return Buffer.from(html, 'utf8')
  }
}

function createTransporter() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

function renderCustomerFailedEmail(data) {
  const itemsHtml = (data.orderItems || [])
    .map((i) => `<li><strong>${i.title}</strong> × ${i.quantity} — ₹${i.price} (₹${i.price * i.quantity})</li>`) 
    .join('')
  const addressHtml = (data.customerAddress || '')
    .split('\n').map((l) => l.trim()).filter(Boolean).join('<br/>')
  
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Payment Issue - Amrutha Bindu</title></head>
  <body style="font-family:Arial,sans-serif;background:#f9f9f9;padding:20px;color:#333;">
    <div style="max-width:640px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,.08);overflow:hidden;">
      <div style="padding:24px;border-bottom:1px solid #eee;text-align:center;background:#fff3cd;">
        <img src="${LOGO_URL}" alt="Amrutha Bindu Logo" style="width:100px;height:auto;margin-bottom:12px;" />
        <h1 style="margin:0;font-size:22px;color:#856404;">⚠️ Payment Issue - Amrutha Bindu</h1>
        <p style="margin:8px 0 0 0;color:#856404;font-size:14px;">Order ID: ${data.orderId}</p>
      </div>
      <div style="padding:24px;line-height:1.6;">
        <p>Hi ${data.customerName || 'Customer'},</p>
        <p>We noticed that your payment for order <strong>${data.orderId}</strong> was ${data.paymentStatus || 'not completed'}.</p>
        
        ${data.errorMessage ? `<div style="background:#f8d7da;padding:12px;border-radius:8px;margin:18px 0;border-left:4px solid #dc3545;">
          <strong style="color:#721c24;">Error Details:</strong> ${data.errorMessage}
        </div>` : ''}
        
        <div style="background:#f8f9fa;padding:16px;border-radius:8px;margin:18px 0;">
          <div style="font-size:16px;font-weight:bold;margin-bottom:12px;color:#2c3e50;">📦 Order Details</div>
          <ul style="margin:8px 0 0 20px;">${itemsHtml}</ul>
          <p><span>Total Amount:</span> <strong>₹${data.orderTotal}</strong></p>
          <p><span>Payment Method:</span> <strong>${data.paymentMethod || 'Razorpay'}</strong></p>
        </div>
        
        ${addressHtml ? `<div style="background:#f8f9fa;padding:16px;border-radius:8px;">
          <div style="font-size:16px;font-weight:bold;margin-bottom:12px;color:#2c3e50;">🏠 Delivery Address</div>
          <div>${addressHtml}</div>
        </div>` : ''}
        
        <div style="background:#d1ecf1;padding:16px;border-radius:8px;margin:18px 0;">
          <h3 style="margin:0 0 8px 0;color:#0c5460;">What's Next?</h3>
          <p style="margin:0;">Don't worry! Your order is saved and you can complete the payment anytime. You can:</p>
          <ul style="margin:8px 0 0 20px;">
            <li>Try the payment again with a different card</li>
            <li>Contact us for assistance at ${SUPPORT_EMAIL}</li>
            <li>Use UPI, Net Banking, or other payment methods</li>
          </ul>
        </div>
        
        <div style="background:#e7f3ff;padding:16px;border-radius:8px;margin:18px 0;">
          <h3 style="margin:0 0 8px 0;color:#0066cc;">Need Help?</h3>
          <p style="margin:0;">Our customer support team is here to help you complete your order. Contact us:</p>
          <ul style="margin:8px 0 0 20px;">
            <li>Email: ${SUPPORT_EMAIL}</li>
            <li>Phone: ${PHONE_DISPLAY}</li>
            <li>Reply to this email for immediate assistance</li>
          </ul>
        </div>
        
        <p>We're here to help! Reply to this email or contact us if you need any assistance.</p>
        <p>Warm regards,<br/>Amrutha Bindu Team</p>
      </div>
    </div>
  </body></html>`
}

function renderAdminFailedEmail(data) {
  const itemsRows = (data.orderItems || [])
    .map((i) => `<tr><td>${i.title}</td><td>${i.quantity}</td><td>₹${i.price}</td><td>₹${i.price * i.quantity}</td></tr>`) 
    .join('')
  
  const addressLines = (data.customerAddress || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const formattedAddress = addressLines.length > 0 ? addressLines.join('<br/>') : 'No address provided'
  
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Payment Failed Order</title>
    <style>
      body{font-family:Arial,sans-serif;padding:2px;color:#333;margin:0;font-size:8px;line-height:1.1;}
      .urgent{background:#f8d7da;color:#721c24;padding:1px;text-align:center;font-weight:bold;margin:1px 0;font-size:7px;}
      .info{font-size:7px;margin:1px 0;}
      .shipping{background:#fef3c7;padding:2px;margin:1px 0;font-size:6px;}
      table{width:100%;border-collapse:collapse;margin:1px 0;font-size:6px;}
      th,td{border:1px solid #d1d5db;padding:1px;text-align:left;}
      th{background:#f3f4f6;color:#dc2626;font-weight:bold;}
      .total{font-size:7px;font-weight:bold;color:#dc2626;text-align:right;margin-top:1px;}
    </style>
  </head><body>
    <div class="urgent">⚠️ PAYMENT FAILED - ORDER ${data.orderId || 'N/A'} - ₹${data.orderTotal || 0}</div>
    
    <div class="info">
      <strong>Order:</strong> ${data.orderId || 'N/A'} | 
      <strong>Status:</strong> ${data.paymentStatus || 'PAYMENT FAILED'} | 
      <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
    </div>
    
    <div class="shipping">
      <strong>CUSTOMER:</strong> ${data.customerName || 'N/A'} | ${data.customerEmail || 'N/A'} | ${data.customerPhone || 'N/A'}<br/>
      ${formattedAddress}
    </div>
    
    <table>
      <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <div class="total">Total: ₹${data.orderTotal || 0}</div>
    
    <div style="background:#f8d7da;padding:2px;margin:1px 0;font-size:6px;">
      <strong>ACTION REQUIRED:</strong> Contact customer to complete payment or provide alternative payment options.
    </div>
  </body></html>`
}

export default async function handler(req, res) {
  console.log('📧 ===== FAILED PAYMENT EMAIL API CALLED =====')
  console.log('📧 Request method:', req.method)
  console.log('📧 Request body:', JSON.stringify(req.body, null, 2))
  
  try {
    if (req.method !== 'POST') {
      console.log('❌ Invalid method:', req.method)
      return res.status(405).json({ error: 'Method not allowed' })
    }
    
    const body = req.body || {}
    console.log('📧 Order ID:', body.orderId)
    console.log('📧 Customer Email:', body.customerEmail)
    console.log('📧 Payment Status:', body.paymentStatus)

    // Check environment variables
    console.log('🔐 SMTP_USER:', process.env.SMTP_USER || 'NOT SET')
    console.log('🔐 GMAIL_USER:', process.env.GMAIL_USER || 'NOT SET')
    console.log('🔐 SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET')
    console.log('🔐 GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '***SET***' : 'NOT SET')
    console.log('🔐 ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'NOT SET')

    const transporter = createTransporter()
    console.log('✅ Transporter created')
    
    const adminEmail = process.env.ADMIN_EMAIL || 'harshavardhanpenthala@gmail.com'

    // Send to customer
    if (body.customerEmail) {
      console.log('📤 Sending failed payment email to customer:', body.customerEmail)
      console.log('📤 Customer email details:', {
        from: process.env.SMTP_USER || 'groupartihcus@gmail.com',
        to: body.customerEmail,
        subject: `⚠️ Payment Issue - Order ${body.orderId} - Amrutha Bindu`,
        hasHtml: !!renderCustomerFailedEmail(body)
      })
      
      try {
        const customerResult = await transporter.sendMail({
          from: process.env.SMTP_USER || 'groupartihcus@gmail.com',
          to: body.customerEmail,
          subject: `⚠️ Payment Issue - Order ${body.orderId} - Amrutha Bindu`,
          html: renderCustomerFailedEmail(body),
        })
        console.log('✅ Customer failed payment email sent successfully:', customerResult.messageId)
        console.log('✅ Customer email response:', customerResult.response)
      } catch (customerError) {
        console.error('❌ Customer email failed:', customerError.message)
        console.error('❌ Customer email error details:', customerError)
        throw customerError
      }
    } else {
      console.log('⚠️ No customer email provided, skipping customer notification')
    }

    // Send to admin
    console.log('📤 Sending failed payment email to admin:', adminEmail)
    const adminResult = await transporter.sendMail({
      from: process.env.SMTP_USER || 'groupartihcus@gmail.com',
      to: adminEmail,
      subject: `⚠️ Payment Failed - Order ${body.orderId} - Amrutha Bindu`,
      html: renderAdminFailedEmail(body),
    })
    console.log('✅ Admin failed payment email sent successfully:', adminResult.messageId)

    console.log('🎉 All failed payment emails sent successfully!')
    return res.status(200).json({ success: true, message: 'Failed payment emails sent successfully' })
  } catch (e) {
    console.error('❌ FAILED PAYMENT EMAIL ERROR:', e)
    console.error('❌ Error message:', e?.message)
    console.error('❌ Error stack:', e?.stack)
    return res.status(500).json({ error: e?.message || 'Failed payment email send failed', details: e?.stack })
  }
}
