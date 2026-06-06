import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sendOrderEmailHandler from '../api/send-order-email.js'
import sendFailedPaymentEmailHandler from '../api/send-failed-payment-email.js'
import sendLeadEmailHandler from '../api/send-lead-email.js'
import sendBulkEmailHandler from '../api/send-bulk-email.js'
import createRazorpayOrderHandler from '../api/razorpay/create-order.js'
import pushOrderToShiprocketHandler from '../api/push-order-to-shiprocket.js'
import updateOrderStatusHandler from '../api/update-order-status.js'
import checkShiprocketTrackingHandler from '../api/check-shiprocket-tracking.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// API Routes
app.post('/api/send-order-email', async (req, res) => {
  console.log('🌐 SERVER: Received request to /api/send-order-email')
  console.log('🌐 SERVER: Request body keys:', Object.keys(req.body))
  try {
    // Simulate serverless function environment
    await sendOrderEmailHandler(req, res)
  } catch (error) {
    console.error('🌐 SERVER ERROR:', error)
    console.error('🌐 SERVER ERROR Message:', error.message)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

app.post('/api/send-failed-payment-email', async (req, res) => {
  console.log('🌐 SERVER: Received request to /api/send-failed-payment-email')
  console.log('🌐 SERVER: Request body keys:', Object.keys(req.body))
  try {
    // Simulate serverless function environment
    await sendFailedPaymentEmailHandler(req, res)
  } catch (error) {
    console.error('🌐 SERVER ERROR:', error)
    console.error('🌐 SERVER ERROR Message:', error.message)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

app.post('/api/send-lead-email', async (req, res) => {
  console.log('🌐 SERVER: Received request to /api/send-lead-email')
  console.log('🌐 SERVER: Email type:', req.body.emailType)
  console.log('🌐 SERVER: Recipient:', req.body.leadData?.email)
  try {
    await sendLeadEmailHandler(req, res)
  } catch (error) {
    console.error('🌐 SERVER ERROR:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

app.post('/api/send-bulk-email', async (req, res) => {
  console.log('🌐 SERVER: Received request to /api/send-bulk-email')
  console.log('🌐 SERVER: Recipients count:', req.body.recipients?.length || 0)
  try {
    await sendBulkEmailHandler(req, res)
  } catch (error) {
    console.error('🌐 SERVER ERROR:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

app.post('/api/razorpay/create-order', async (req, res) => {
  console.log('🌐 SERVER: Received request to /api/razorpay/create-order')
  try {
    await createRazorpayOrderHandler(req, res)
  } catch (error) {
    console.error('🌐 SERVER ERROR:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

app.post('/api/push-order-to-shiprocket', async (req, res) => {
  console.log('🌐 SERVER: Received request to /api/push-order-to-shiprocket')
  console.log('🌐 SERVER: Order ID:', req.body.orderId)
  try {
    await pushOrderToShiprocketHandler(req, res)
  } catch (error) {
    console.error('🌐 SERVER ERROR:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

app.post('/api/update-order-status', async (req, res) => {
  console.log('🌐 SERVER: Received request to /api/update-order-status')
  console.log('🌐 SERVER: Order ID:', req.body.orderId, 'Status:', req.body.status)
  try {
    await updateOrderStatusHandler(req, res)
  } catch (error) {
    console.error('🌐 SERVER ERROR:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

app.post('/api/check-shiprocket-tracking', async (req, res) => {
  console.log('🌐 SERVER: Received request to /api/check-shiprocket-tracking')
  try {
    await checkShiprocketTrackingHandler(req, res)
  } catch (error) {
    console.error('🌐 SERVER ERROR:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

app.listen(PORT, () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`)
  console.log(`📧 Email endpoint: http://localhost:${PORT}/api/send-order-email`)
  console.log(`\n📧 Email Configuration:`)
  console.log(`   SMTP_USER: ${process.env.SMTP_USER || 'NOT SET'}`)
  console.log(`   GMAIL_USER: ${process.env.GMAIL_USER || 'NOT SET'}`)
  console.log(`   SMTP_PASS: ${process.env.SMTP_PASS ? '***SET***' : 'NOT SET'}`)
  console.log(`   GMAIL_APP_PASSWORD: ${process.env.GMAIL_APP_PASSWORD ? '***SET***' : 'NOT SET'}`)
  console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL || 'NOT SET'}`)
})

