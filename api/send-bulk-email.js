import nodemailer from 'nodemailer'
import { CONTACT_EMAIL, PHONE_DISPLAY, SHOP_ADDRESS_FULL } from '../lib/contact.js'

/**
 * Create email transporter (same as other email APIs)
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
 * API endpoint to send bulk emails to marketing list
 */
export default async function handler(req, res) {
  console.log('📧 ===== BULK EMAIL API CALLED =====')
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { recipients, subject, message } = req.body

    console.log(`📧 Sending bulk email to ${recipients?.length || 0} recipients`)
    console.log(`📧 Subject: ${subject}`)

    // Validate
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Recipients list is required' })
    }

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message are required' })
    }

    // Create transporter
    const transporter = createTransporter()
    console.log('✅ Transporter created')

    let successCount = 0
    let failedCount = 0
    const errors = []

    // Send emails one by one (with small delay to avoid rate limits)
    for (const recipient of recipients) {
      try {
        // Personalize message with recipient name
        const personalizedMessage = message.replace(/{name}/g, recipient.name || 'there')

        // Create HTML email
        const htmlEmail = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #2d5f3f; padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px;">Amrutha Bindu</h1>
              <p style="margin: 10px 0 0 0; color: #e0e0e0; font-size: 14px;">100% Hand-Made Traditional Products</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <div style="color: #666; font-size: 16px; line-height: 1.6; white-space: pre-wrap;">
${personalizedMessage}
              </div>

              <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #f9f9f9; border-radius: 6px; text-align: center;">
                    <p style="margin: 0; color: #666; font-size: 14px;">
                      📞 ${PHONE_DISPLAY} • 📧 ${CONTACT_EMAIL}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9f9f9; padding: 20px 30px; text-align: center; border-top: 1px solid #eee;">
              <p style="margin: 0; color: #999; font-size: 12px;">
                Amrutha Bindu • ${SHOP_ADDRESS_FULL}
              </p>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 12px;">
                © ${new Date().getFullYear()} Amrutha Bindu. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `

        const mailOptions = {
          from: {
            name: 'Amrutha Bindu',
            address: process.env.SMTP_USER || process.env.GMAIL_USER || 'moksh.dev0411@gmail.com'
          },
          to: recipient.email,
          subject: subject,
          html: htmlEmail
        }

        await transporter.sendMail(mailOptions)
        successCount++
        console.log(`✅ Sent to: ${recipient.email}`)

        // Small delay to avoid rate limits (Gmail allows ~100 emails/hour)
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        failedCount++
        errors.push({ email: recipient.email, error: error.message })
        console.error(`❌ Failed to send to ${recipient.email}:`, error.message)
      }
    }

    console.log(`📧 Bulk email complete: ${successCount} sent, ${failedCount} failed`)

    return res.status(200).json({
      success: true,
      successCount,
      failedCount,
      total: recipients.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('❌ Bulk email error:', error)
    return res.status(500).json({
      error: 'Failed to send bulk email',
      details: error.message
    })
  }
}

