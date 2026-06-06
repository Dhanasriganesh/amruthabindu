export async function sendStatusEmail(order, status, trackingNumber) {
  const nodemailer = await import('nodemailer')

  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER || process.env.GMAIL_USER || 'moksh.dev0411@gmail.com',
      pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
    },
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
    html: emailTemplate.html,
  })

  console.log(`✅ Status email sent to ${customerEmail}`)
}

function getTrackingLink(trackingNumber) {
  if (!trackingNumber) return ''
  return `https://shiprocket.co/tracking/${encodeURIComponent(trackingNumber)}`
}

export function getStatusEmailTemplate(order, status, trackingNumber) {
  const customerName = `${order.shipping_address?.firstName || ''} ${order.shipping_address?.lastName || ''}`.trim() || 'Customer'
  const orderId = order.order_id
  const trackingLink = getTrackingLink(trackingNumber)

  const templates = {
    PACKED: {
      subject: '📦 Your Order is Packed - Amrutha Bindu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B7355;">Your Order is Packed!</h2>
          <p>Dear ${customerName},</p>
          <p>Great news! Your order <strong>${orderId}</strong> has been packed and is ready to ship.</p>
          <p>We'll notify you once it's shipped with tracking information.</p>
          <p>Thank you for choosing Amrutha Bindu!</p>
        </div>
      `,
    },
    SHIPPED: {
      subject: '🚚 Your Order Has Been Shipped - Amrutha Bindu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B7355;">Your Order Has Been Shipped!</h2>
          <p>Dear ${customerName},</p>
          <p>Your order <strong>${orderId}</strong> has been shipped and is on its way to you!</p>
          ${trackingNumber ? `
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 0;"><strong>Tracking Number (AWB):</strong> ${trackingNumber}</p>
              <p style="margin: 5px 0 0 0; font-size: 14px;">Track your order at: <a href="${trackingLink}" target="_blank">Shiprocket Tracking</a></p>
            </div>
          ` : ''}
          <p>Thank you for choosing Amrutha Bindu!</p>
        </div>
      `,
    },
    OUT_FOR_DELIVERY: {
      subject: '🚛 Your Order is Out for Delivery - Amrutha Bindu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B7355;">Your Order is Out for Delivery!</h2>
          <p>Dear ${customerName},</p>
          <p>Exciting news! Your order <strong>${orderId}</strong> is out for delivery and will reach you soon.</p>
          ${trackingNumber ? `<p><strong>Tracking Number:</strong> <a href="${trackingLink}" target="_blank">${trackingNumber}</a></p>` : ''}
          <p>Please ensure someone is available to receive the package.</p>
          <p>Thank you for choosing Amrutha Bindu!</p>
        </div>
      `,
    },
    DELIVERED: {
      subject: '✅ Your Order Has Been Delivered - Amrutha Bindu',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #8B7355;">Your Order Has Been Delivered!</h2>
          <p>Dear ${customerName},</p>
          <p>Great news! Your order <strong>${orderId}</strong> has been successfully delivered.</p>
          <p>We hope you enjoy your products. If you have any questions or feedback, please don't hesitate to contact us.</p>
          <p>Thank you for choosing Amrutha Bindu!</p>
        </div>
      `,
    },
  }

  return templates[status] || {
    subject: `Order Status Update - ${orderId}`,
    html: `<p>Your order ${orderId} status has been updated to ${status}.</p>`,
  }
}
