import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import sendOrderEmailHandler from '../api/send-order-email.js'
import sendFailedPaymentEmailHandler from '../api/send-failed-payment-email.js'
import sendLeadEmailHandler from '../api/send-lead-email.js'
import sendBulkEmailHandler from '../api/send-bulk-email.js'
import createRazorpayOrderHandler from '../api/razorpay/create-order.js'
import verifyRazorpayPaymentHandler from '../api/razorpay/verify-payment.js'
import pushOrderToNimbuspostHandler from '../api/push-order-to-nimbuspost.js'
import getOrderCouriersHandler from '../api/get-order-couriers.js'
import updateOrderStatusHandler from '../api/update-order-status.js'
import checkNimbuspostTrackingHandler from '../api/check-nimbuspost-tracking.js'
import getShippingRateHandler from '../api/get-shipping-rate.js'
import { isNimbuspostConfigured } from '../lib/server/nimbuspost.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json({ limit: '2mb' }))
app.use(express.urlencoded({ extended: true, limit: '2mb' }))

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

const registerRazorpayOrderRoute = (path) => {
  app.post(path, async (req, res) => {
    console.log(`🌐 SERVER: Received request to ${path}`)
    try {
      await createRazorpayOrderHandler(req, res)
    } catch (error) {
      console.error('🌐 SERVER ERROR:', error)
      res.status(500).json({ error: error.message || 'Internal server error' })
    }
  })
}

registerRazorpayOrderRoute('/api/razorpay/create-order')

app.post('/api/razorpay/verify-payment', async (req, res) => {
  console.log('🌐 SERVER: Received request to /api/razorpay/verify-payment')
  try {
    await verifyRazorpayPaymentHandler(req, res)
  } catch (error) {
    console.error('🌐 SERVER ERROR:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

app.post('/api/push-order-to-nimbuspost', async (req, res) => {
  console.log('🌐 SERVER: Received request to /api/push-order-to-nimbuspost')
  console.log('🌐 SERVER: Order ID:', req.body.orderId, 'Mode:', req.body.mode || 'create')
  try {
    await pushOrderToNimbuspostHandler(req, res)
  } catch (error) {
    console.error('🌐 SERVER ERROR:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

app.post('/api/get-order-couriers', async (req, res) => {
  console.log('🌐 SERVER: Received request to /api/get-order-couriers')
  try {
    await getOrderCouriersHandler(req, res)
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

app.post('/api/get-shipping-rate', async (req, res) => {
  console.log('🌐 SERVER: Received request to /api/get-shipping-rate')
  try {
    await getShippingRateHandler(req, res)
  } catch (error) {
    console.error('🌐 SERVER ERROR:', error)
    res.status(500).json({ error: error.message || 'Internal server error' })
  }
})

app.post('/api/check-nimbuspost-tracking', async (req, res) => {
  console.log('🌐 SERVER: Received request to /api/check-nimbuspost-tracking')
  try {
    await checkNimbuspostTrackingHandler(req, res)
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
  console.log(`\n📦 Nimbuspost Configuration:`)
  console.log(`   NIMBUSPOST_API_EMAIL: ${process.env.NIMBUSPOST_API_EMAIL || 'NOT SET'}`)
  console.log(`   NIMBUSPOST_API_PASSWORD: ${process.env.NIMBUSPOST_API_PASSWORD ? '***SET***' : 'NOT SET'}`)
  console.log(`   NIMBUSPOST_PICKUP_PINCODE: ${process.env.NIMBUSPOST_PICKUP_PINCODE || 'NOT SET'}`)
  console.log(`   NIMBUSPOST_PICKUP_ADDRESS: ${process.env.NIMBUSPOST_PICKUP_ADDRESS ? 'SET' : 'NOT SET'}`)
  console.log(`   NIMBUSPOST_PICKUP_ADDRESS_ID: ${process.env.NIMBUSPOST_PICKUP_ADDRESS_ID || '(optional)'}`)
  console.log(`   NIMBUSPOST_ENABLED: ${process.env.NIMBUSPOST_ENABLED ?? 'true'}`)
  console.log(`   Nimbuspost ready: ${isNimbuspostConfigured() ? 'YES — orders will sync on checkout' : 'NO — disabled or credentials missing'}`)
})

