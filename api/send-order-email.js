import nodemailer from 'nodemailer'
import puppeteer from 'puppeteer'
import {
  CONTACT_EMAIL,
  SUPPORT_EMAIL,
  PHONE_DISPLAY,
  SHOP_ADDRESS_FULL,
  INSTAGRAM_URL,
  INSTAGRAM_HANDLE,
} from '../lib/contact.js'

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

async function generateActualPDF(data) {
  const html = generateInvoicePDF(data)
  
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
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
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

function generateInvoicePDF(data) {
  const itemsRows = (data.orderItems || [])
    .map((i) => `<tr><td>${i.title}</td><td>${i.quantity}</td><td>₹${i.price}</td><td>₹${i.price * i.quantity}</td></tr>`)
    .join('')
  
  const addressLines = (data.customerAddress || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const formattedAddress = addressLines.length > 0 ? addressLines.join('<br/>') : 'No address provided'
  
  return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        @page { margin: 0.3in; size: A4; }
        body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.3; margin: 0; padding: 0; color: #333; }
        .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; border-bottom: 2px solid #8B7355; padding-bottom: 10px; }
        .logo { width: 60px; height: 60px; }
        .company-info { text-align: right; }
        .company-name { font-size: 16px; font-weight: bold; color: #8B7355; margin: 0; }
        .company-tagline { font-size: 8px; color: #666; margin: 0; }
        .invoice-title { font-size: 20px; font-weight: bold; color: #8B7355; text-align: center; margin: 15px 0; }
        .details-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px; }
        .detail-section h3 { font-size: 12px; color: #8B7355; margin: 0 0 8px 0; border-bottom: 1px solid #8B7355; padding-bottom: 3px; }
        .detail-row { display: flex; justify-content: space-between; margin: 3px 0; font-size: 9px; }
        .detail-label { font-weight: bold; }
        .items-table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 9px; }
        .items-table th { background: #8B7355; color: white; padding: 8px; text-align: left; font-weight: bold; }
        .items-table td { padding: 6px; border: 1px solid #ddd; }
        .items-table tr:nth-child(even) { background: #f9f9f9; }
        .totals { margin-top: 15px; }
        .total-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 10px; }
        .total-row.final { border-top: 2px solid #8B7355; padding-top: 8px; font-weight: bold; font-size: 12px; color: #8B7355; }
        .footer { margin-top: 20px; text-align: center; font-size: 8px; color: #666; border-top: 1px solid #ddd; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <img src="${LOGO_URL}" alt="Amrutha Bindu Logo" class="logo">
        <div class="company-info">
            <h1 class="company-name">AMRUTHA BINDU</h1>
            <p class="company-tagline">100% HAND-MADE • Traditional Self-Care Products</p>
        </div>
    </div>
    
    <div class="invoice-title">INVOICE</div>
    
    <div class="details-grid">
        <div class="detail-section">
            <h3>Invoice Details</h3>
            <div class="detail-row"><span class="detail-label">Invoice No:</span><span>${data.orderId}</span></div>
            <div class="detail-row"><span class="detail-label">Payment ID:</span><span>${data.paymentId || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">Date:</span><span>${data.date}</span></div>
            <div class="detail-row"><span class="detail-label">Payment Method:</span><span>Razorpay</span></div>
        </div>
        
        <div class="detail-section">
            <h3>Customer Details</h3>
            <div class="detail-row"><span class="detail-label">Name:</span><span>${data.customerName || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">Email:</span><span>${data.customerEmail || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">Phone:</span><span>${data.customerPhone || 'N/A'}</span></div>
            <div class="detail-row"><span class="detail-label">Address:</span><span>${formattedAddress}</span></div>
        </div>
    </div>
    
    <table class="items-table">
        <thead>
            <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
            </tr>
        </thead>
        <tbody>
            ${itemsRows}
        </tbody>
    </table>
    
    <div class="totals">
        <div class="total-row">
            <span>Subtotal:</span>
            <span>₹${data.subtotal || 0}</span>
        </div>
        <div class="total-row">
            <span>Delivery Charges:</span>
            <span>₹${data.delivery || 0}</span>
        </div>
        <div class="total-row final">
            <span>Grand Total:</span>
            <span>₹${data.orderTotal}</span>
        </div>
    </div>
    
    <div class="footer">
        <p>Thank you for choosing Amrutha Bindu!</p>
        <p>For any queries, contact us at: ${SUPPORT_EMAIL}</p>
    </div>
</body>
</html>`
}

function createTransporter() {
  // Support both SMTP_USER/SMTP_PASS and GMAIL_USER/GMAIL_APP_PASSWORD
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || 'moksh.dev0411@gmail.com'
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || 'aogz maqj cevm yhnk'
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

function renderCustomerEmail(data) {
  // Build order items table
  const itemsRows = (data.orderItems || [])
    .map((item) => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">
          <strong style="color: #333; font-size: 15px;">${item.title}</strong>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">×${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₹${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('')
  
  // Parse address
  const addressLines = (data.customerAddress || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const addressHtml = addressLines.join('<br/>')
  
  // Get order date
  const orderDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  
  // Calculate shipping
  const subtotal = parseFloat(data.subtotal) || 0
  const delivery = parseFloat(data.delivery) || 0
  const shippingText = delivery === 0 ? 'Free shipping' : `₹${delivery.toFixed(2)}`
  
  // Determine payment method display
  const paymentMethodDisplay = (data.paymentMethod || 'Razorpay').toLowerCase().includes('razorpay') ? 'Online Payment (Razorpay)' : data.paymentMethod
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Order is Confirmed - Amrutha Bindu</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d5f3f 0%, #1e4a2f 100%); padding: 40px 30px; text-align: center;">
              <img src="${LOGO_URL}" alt="Amrutha Bindu Logo" style="width: 140px; height: auto; margin-bottom: 20px;" />
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px 0; color: #333; font-size: 24px; font-weight: 600;">Hi ${data.customerName || 'Customer'},</h2>
              
              <p style="margin: 0 0 15px 0; color: #555; font-size: 16px; line-height: 1.6;">
                Thank you so much for your order! Your journey to authentic, herbal wellness has officially begun. We are truly grateful you've chosen to bring our powders into your ritual.
              </p>

              <p style="margin: 0 0 30px 0; color: #555; font-size: 16px; line-height: 1.6;">
                Your order has been received and is now being carefully processed by our team.
              </p>

              <!-- Order Summary Box -->
              <div style="background-color: #f9fdf9; border: 2px solid #2d5f3f; border-radius: 8px; padding: 25px; margin: 0 0 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #2d5f3f; font-size: 18px; font-weight: 600;">
                  📦 Order #${data.orderId || 'N/A'}
                </h3>
                <p style="margin: 0 0 20px 0; color: #666; font-size: 14px;">
                  <strong>Placed on:</strong> ${orderDate}
                </p>

                <!-- Order Items Table -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px; border: 1px solid #e0e0e0; border-radius: 4px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f0f8f4;">
                      <th style="padding: 12px; text-align: left; color: #2d5f3f; font-weight: 600;">Product</th>
                      <th style="padding: 12px; text-align: center; color: #2d5f3f; font-weight: 600;">Qty</th>
                      <th style="padding: 12px; text-align: right; color: #2d5f3f; font-weight: 600;">Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${itemsRows}
                  </tbody>
                </table>

                <!-- Totals -->
                <table width="100%" cellpadding="8" cellspacing="0" style="margin-top: 15px;">
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 15px;"><strong>Subtotal:</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #333; font-size: 15px;">₹${subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #666; font-size: 15px;"><strong>Shipping:</strong> ${shippingText}</td>
                    <td style="padding: 8px 0; text-align: right; color: #333; font-size: 15px;">${shippingText}</td>
                  </tr>
                  <tr style="border-top: 2px solid #2d5f3f;">
                    <td style="padding: 12px 0; color: #2d5f3f; font-size: 18px; font-weight: bold;"><strong>Total:</strong></td>
                    <td style="padding: 12px 0; text-align: right; color: #2d5f3f; font-size: 18px; font-weight: bold;">₹${(data.orderTotal || 0).toFixed(2)}</td>
                  </tr>
                </table>

                <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">
                  <strong>Payment method:</strong> ${paymentMethodDisplay}
                </p>
              </div>

              <!-- Next Steps Section -->
              <div style="background-color: #fff9e6; border-left: 4px solid #2d5f3f; padding: 20px; margin: 0 0 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px 0; color: #2d5f3f; font-size: 18px; font-weight: 600;">
                  📋 Next Steps & What to Expect:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #555; font-size: 15px; line-height: 1.8;">
                  <li style="margin-bottom: 10px;">
                    <strong>Order Processing:</strong> We will carefully hand-pack your items with love. This usually takes 1 to 2 business days.
                  </li>
                  <li style="margin-bottom: 10px;">
                    <strong>Shipment Notification:</strong> You will receive another email with your tracking number as soon as your package is on its way.
                  </li>
                  <li>
                    <strong>Delivery:</strong> ${paymentMethodDisplay.toLowerCase().includes('cod') || paymentMethodDisplay.toLowerCase().includes('cash') ? `Please have the exact amount ready (₹${(data.orderTotal || 0).toFixed(2)}) for our delivery partner.` : 'Your order will be delivered to your address.'}
                  </li>
                </ul>
              </div>

              <!-- Customer Details -->
              <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 0 0 30px 0;">
                <h3 style="margin: 0 0 15px 0; color: #2d5f3f; font-size: 18px; font-weight: 600;">
                  Customer Details
                </h3>
                <p style="margin: 0 0 10px 0; color: #555; font-size: 14px;">
                  <strong>Username:</strong> ${data.customerEmail ? data.customerEmail.split('@')[0] : 'Customer'}
                </p>
                <p style="margin: 0 0 15px 0; color: #666; font-size: 13px; font-style: italic;">
                  Haven't set a password yet? <a href="https://amruthabindu.in/reset-password" style="color: #2d5f3f; text-decoration: underline;">Set Your Password Here</a> to easily track your order and manage your account.
                </p>
                ${addressHtml ? `
                <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
                  <p style="margin: 0 0 10px 0; color: #2d5f3f; font-size: 15px; font-weight: 600;">
                    📍 Shipping Address:
                  </p>
                  <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">
                    ${addressHtml}
                  </p>
                  ${data.customerPhone ? `<p style="margin: 10px 0 0 0; color: #555; font-size: 14px;"><strong>Phone:</strong> ${data.customerPhone}</p>` : ''}
                </div>
                ` : ''}
              </div>

              <!-- Help Section -->
              <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin: 0 0 30px 0;">
                <h3 style="margin: 0 0 10px 0; color: #2d5f3f; font-size: 17px; font-weight: 600;">
                  💚 We're Here to Help
                </h3>
                <p style="margin: 0 0 15px 0; color: #555; font-size: 15px; line-height: 1.6;">
                  If you have any questions about your order or need to make a change, please simply reply to this email or contact us at <a href="mailto:${CONTACT_EMAIL}" style="color: #2d5f3f; text-decoration: underline;">${CONTACT_EMAIL}</a>.
                </p>
                <p style="margin: 0; color: #555; font-size: 15px;">
                  Alternatively, WhatsApp us on <strong style="color: #2d5f3f;">${PHONE_DISPLAY}</strong>
                </p>
              </div>

              <!-- Closing -->
              <p style="margin: 0 0 15px 0; color: #555; font-size: 16px; line-height: 1.6;">
                Thank you for trusting us with your care. We can't wait for you to experience the difference of nature's finest.
              </p>

              <p style="margin: 0 0 30px 0; color: #555; font-size: 16px; line-height: 1.6; font-style: italic;">
                <strong>With gratitude,</strong><br>
                The Team at Amrutha Bindu<br>
                <a href="https://www.amruthabindu.in" style="color: #2d5f3f; text-decoration: none;">www.amruthabindu.in</a>
              </p>

              <!-- P.S. Section -->
              <div style="background-color: #fff9e6; border-left: 4px solid #2d5f3f; padding: 15px; border-radius: 4px;">
                <p style="margin: 0; color: #555; font-size: 14px; line-height: 1.6;">
                  <strong>P.S.</strong> Follow your order's journey and discover the stories behind our powders on Instagram <a href="${INSTAGRAM_URL}" style="color: #2d5f3f; text-decoration: underline;">${INSTAGRAM_HANDLE}</a>!
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 25px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">
                📧 ${CONTACT_EMAIL} • 📞 ${PHONE_DISPLAY}
              </p>
              <p style="margin: 0 0 10px 0; color: #999; font-size: 12px;">
                ${SHOP_ADDRESS_FULL}
              </p>
              <p style="margin: 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} Amrutha Bindu. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function renderAdminEmail(data) {
  const itemsRows = (data.orderItems || [])
    .map((i) => `<tr><td>${i.title}</td><td>${i.quantity}</td><td>₹${i.price}</td><td>₹${i.price * i.quantity}</td></tr>`) 
    .join('')
  
  // Format the complete shipping address for admin
  const addressLines = (data.customerAddress || '').split('\n').map((l) => l.trim()).filter(Boolean)
  const formattedAddress = addressLines.length > 0 ? addressLines.join('<br/>') : 'No address provided'
  
  return `<!doctype html><html><head><meta charset="utf-8"/><title>Order</title>
    <style>
      body{font-family:Arial,sans-serif;padding:2px;color:#333;margin:0;font-size:8px;line-height:1.1;}
      .urgent{background:#fee2e2;color:#dc2626;padding:1px;text-align:center;font-weight:bold;margin:1px 0;font-size:7px;}
      .info{font-size:7px;margin:1px 0;}
      .shipping{background:#fef3c7;padding:2px;margin:1px 0;font-size:6px;}
      table{width:100%;border-collapse:collapse;margin:1px 0;font-size:6px;}
      th,td{border:1px solid #d1d5db;padding:1px;text-align:left;}
      th{background:#f3f4f6;color:#15803d;font-weight:bold;}
      .total{font-size:7px;font-weight:bold;color:#15803d;text-align:right;margin-top:1px;}
    </style>
  </head><body>
    <div class="urgent">⚡ SHIP ORDER ${data.orderId || 'N/A'} - ₹${data.orderTotal || 0}</div>
    
    <div class="info">
      <strong>Order:</strong> ${data.orderId || 'N/A'} | 
      <strong>Payment:</strong> ${data.paymentId || 'N/A'} | 
      <strong>Date:</strong> ${new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
    </div>
    
    <div class="shipping">
      <strong>SHIP TO:</strong> ${data.customerName || 'N/A'} | ${data.customerEmail || 'N/A'} | ${data.customerPhone || 'N/A'}<br/>
      ${formattedAddress}
    </div>
    
    <table>
      <thead><tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
      <tbody>${itemsRows}</tbody>
    </table>
    <div class="total">Total: ₹${data.orderTotal || 0}</div>
  </body></html>`
}

export default async function handler(req, res) {
  console.log('📧 ===== EMAIL API CALLED =====')
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

    // Check environment variables
    console.log('🔐 SMTP_USER:', process.env.SMTP_USER || 'NOT SET')
    console.log('🔐 GMAIL_USER:', process.env.GMAIL_USER || 'NOT SET')
    console.log('🔐 SMTP_PASS:', process.env.SMTP_PASS ? '***SET***' : 'NOT SET')
    console.log('🔐 GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '***SET***' : 'NOT SET')
    console.log('🔐 ADMIN_EMAIL:', process.env.ADMIN_EMAIL || 'NOT SET')

    const transporter = createTransporter()
    console.log('✅ Transporter created')
    
    const adminEmail = process.env.ADMIN_EMAIL || 'harshavardhanpenthala@gmail.com'

    // Generate actual PDF invoice
    const invoiceData = {
      orderId: body.orderId,
      paymentId: body.paymentId,
      customerName: body.customerName,
      customerEmail: body.customerEmail,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      orderItems: body.orderItems || [],
      orderTotal: body.orderTotal || 0,
      paymentMethod: body.paymentMethod || 'Razorpay',
      subtotal: body.subtotal,
      delivery: body.delivery,
      date: new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
    }
    
    console.log('📄 Using frontend invoice HTML for PDF...')
    const frontendHtml = body.invoiceHtml || generateInvoicePDF(invoiceData)
    const pdfBuffer = await generateActualPDFFromHtml(frontendHtml)
    console.log('📄 PDF generated successfully')
    
    const attachments = [{
      filename: `Invoice_${body.orderId || 'order'}.pdf`,
      content: pdfBuffer,
      contentType: 'application/pdf'
    }]
    console.log('📎 Attachments:', 'Actual PDF Invoice attached')

    // Send to customer
    if (body.customerEmail) {
      console.log('📤 Sending email to customer:', body.customerEmail)
      const customerResult = await transporter.sendMail({
        from: process.env.SMTP_USER || 'moksh.dev0411@gmail.com',
        to: body.customerEmail,
        subject: `Your Amrutha Bindu Order #${body.orderId || 'XXXX'} is Confirmed!`,
        html: renderCustomerEmail(body),
        attachments,
      })
      console.log('✅ Customer email sent successfully:', customerResult.messageId)
    } else {
      console.log('⚠️ No customer email provided, skipping customer notification')
    }

    // Send to admin
    console.log('📤 Sending email to admin:', adminEmail)
    console.log('📤 Admin email details:', {
      from: process.env.SMTP_USER || 'moksh.dev0411@gmail.com',
      to: adminEmail,
      subject: '🧾 New Order Paid - Amrutha Bindu',
      hasAttachments: attachments ? attachments.length : 0
    })
    
    try {
      const adminResult = await transporter.sendMail({
        from: process.env.SMTP_USER || 'moksh.dev0411@gmail.com',
        to: adminEmail,
        subject: '🧾 New Order Paid - Amrutha Bindu',
        html: renderAdminEmail(body),
        attachments,
      })
      console.log('✅ Admin email sent successfully:', adminResult.messageId)
    } catch (adminError) {
      console.error('❌ Admin email failed:', adminError.message)
      console.error('❌ Admin email error details:', adminError)
      throw adminError
    }

    console.log('🎉 All emails sent successfully!')
    return res.status(200).json({ success: true, message: 'Emails sent successfully' })
  } catch (e) {
    console.error('❌ EMAIL ERROR:', e)
    console.error('❌ Error message:', e?.message)
    console.error('❌ Error stack:', e?.stack)
    return res.status(500).json({ error: e?.message || 'Email send failed', details: e?.stack })
  }
}


