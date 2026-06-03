import nodemailer from 'nodemailer'

/**
 * Create email transporter (same as send-order-email.js)
 */
function createTransporter() {
  const user = process.env.SMTP_USER || process.env.GMAIL_USER || 'moksh.dev0411@gmail.com'
  const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || 'aogz maqj cevm yhnk'
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  })
}

/**
 * API endpoint to send personalized emails to leads
 * Uses SAME email setup as order confirmation emails
 */
export default async function handler(req, res) {
  console.log('📧 ===== LEAD EMAIL API CALLED =====')
  console.log('📧 Request method:', req.method)
  
  if (req.method !== 'POST') {
    console.log('❌ Invalid method:', req.method)
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { 
      emailType,       // 'abandoned-cart', 'payment-issue', 'welcome', 'signup-welcome', 'follow-up', 'custom'
      leadData,        // Lead information (name, email, items, cartValue, etc.)
      customMessage,   // For custom emails
      customSubject    // For custom emails
    } = req.body

    console.log(`📧 Email Type: ${emailType}`)
    console.log(`📧 Recipient: ${leadData?.email}`)
    console.log(`📧 Lead Name: ${leadData?.name}`)

    // Validate required fields
    if (!leadData || !leadData.email) {
      console.log('❌ No email address provided')
      return res.status(400).json({ error: 'Lead email is required' })
    }

    console.log('📧 Importing email templates...')
    // Import email templates
    const { 
      abandonedCartTemplate, 
      paymentIssueTemplate, 
      welcomeCustomerTemplate,
      firstPurchaseFollowUpTemplate,
      customEmailTemplate,
      signupWelcomeTemplate
    } = await import('../src/templates/email-templates.js')

    // Select appropriate template
    console.log(`📧 Generating ${emailType} template...`)
    let emailContent
    switch (emailType) {
      case 'abandoned-cart':
        emailContent = abandonedCartTemplate(leadData)
        break
      case 'payment-issue':
        emailContent = paymentIssueTemplate(leadData)
        break
      case 'welcome':
        emailContent = welcomeCustomerTemplate(leadData)
        break
      case 'signup-welcome':
        emailContent = signupWelcomeTemplate(leadData)
        break
      case 'follow-up':
        emailContent = firstPurchaseFollowUpTemplate(leadData)
        break
      case 'custom':
        if (!customMessage) {
          return res.status(400).json({ error: 'Custom message is required' })
        }
        emailContent = customEmailTemplate(leadData.name, customMessage, customSubject)
        break
      default:
        return res.status(400).json({ error: 'Invalid email type' })
    }

    console.log('✅ Email template generated')
    console.log('📧 Subject:', emailContent.subject)

    // Create transporter (same as order emails)
    console.log('📧 Creating email transporter...')
    const transporter = createTransporter()
    console.log('✅ Transporter created')

    // Send email
    const mailOptions = {
      from: {
        name: 'Amrutha Bindu',
        address: process.env.SMTP_USER || process.env.GMAIL_USER || 'moksh.dev0411@gmail.com'
      },
      to: leadData.email,
      subject: emailContent.subject,
      html: emailContent.html
    }

    console.log(`📤 Sending email to ${leadData.email}...`)
    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Email sent successfully! Message ID: ${info.messageId}`)

    // Return success
    return res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      messageId: info.messageId,
      recipient: leadData.email,
      emailType: emailType
    })

  } catch (error) {
    console.error('❌ Error sending lead email:', error)
    console.error('❌ Error details:', error.message)
    console.error('❌ Error stack:', error.stack)
    return res.status(500).json({
      error: 'Failed to send email',
      details: error.message
    })
  }
}

