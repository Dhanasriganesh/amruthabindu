import React, { useState, useEffect } from 'react'
import { Users, Search, Mail, Phone, Calendar, MapPin, Eye, X, UserPlus, ShoppingCart, CheckCircle, RefreshCw, Send, Gift, MessageSquare, UserCheck } from 'lucide-react'
import { getAllOrders } from '../../services/firebase-db'
import {
  getContactMessages,
  addToEmailMarketingList,
  isInEmailMarketingList,
} from '../../services/marketing-service'

function LeadsManager() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLead, setSelectedLead] = useState(null)
  const [showDetails, setShowDetails] = useState(false)
  const [filterType, setFilterType] = useState('all') // all, checkout, signup, contact

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    try {
      setLoading(true)
      
      const allLeads = []

      // 1. Get ALL orders (both paid and unpaid) - everyone who left their info
      console.log('🔍 Fetching orders from database...')
      let allOrders = []
      try {
        allOrders = await getAllOrders()
      } catch (ordersError) {
        console.error('❌ Error fetching orders:', ordersError)
      }

      console.log('📊 Orders fetched:', allOrders?.length || 0, 'orders')

      if (allOrders) {
        console.log('📦 Processing orders...')
        allOrders.forEach((order, index) => {
          console.log(`Order ${index + 1}:`, {
            id: order.id,
            order_id: order.order_id,
            payment_id: order.payment_id,
            has_shipping: !!order.shipping_address,
            email: order.shipping_address?.email
          })
          
          if (order.shipping_address) {
            // Determine if it's a customer (paid) or abandoned checkout
            // Check for null, undefined, or empty string
            const isPaid = order.payment_id && order.payment_id.trim() !== ''
            const isRegisteredUser = order.user_id !== null && order.user_id !== undefined
            
            // Determine source based on payment status and user registration
            let source = 'Checkout (Abandoned)'
            if (isPaid) {
              source = 'Customer (Purchased)'
            } else if (isRegisteredUser) {
              source = 'Registered User (Not Purchased)'
            }
            
            const lead = {
              id: `order_${order.id}`,
              name: `${order.shipping_address.firstName || ''} ${order.shipping_address.lastName || ''}`.trim() || 'Unknown',
              email: order.shipping_address.email || '',
              phone: order.shipping_address.phone || '',
              address: order.shipping_address.address || '',
              city: order.shipping_address.city || '',
              state: order.shipping_address.state || '',
              pincode: order.shipping_address.pincode || '',
              country: order.shipping_address.country || 'India',
              source: source,
              timestamp: order.created_at,
              cartValue: order.totals?.total || 0,
              items: order.items || [],
              userId: order.user_id,
              isPaid: isPaid,
              orderId: order.order_id,
              isRegistered: isRegisteredUser
            }
            
            console.log(`✅ Added lead: ${lead.name} (${lead.source})`)
            allLeads.push(lead)
          } else {
            console.log(`⚠️ Order ${order.order_id} has no shipping address - skipping`)
          }
        })
      }

      // 2. Get contact form submissions
      console.log('📧 Fetching contact form submissions...')
      let contacts = []
      try {
        contacts = await getContactMessages()
      } catch (contactsError) {
        console.error('❌ Error fetching contacts:', contactsError)
      }

      console.log('📬 Contact forms fetched:', contacts?.length || 0)

      if (contacts) {
        contacts.forEach(contact => {
          const lead = {
            id: `contact_${contact.id}`,
            name: contact.name || 'Unknown',
            email: contact.email || '',
            phone: contact.phone || '',
            subject: contact.subject || '',
            message: contact.message || '',
            source: 'Contact Form',
            timestamp: contact.created_at,
            cartValue: 0
          }
          console.log(`✅ Added contact lead: ${lead.name} (${lead.email})`)
          allLeads.push(lead)
        })
      }

      // 3. Get user signups - Note: We track signups through orders with user_id
      // Users who signed up will appear when they place their first order
      // For now, we identify them by having a user_id in their order
      console.log('👥 Processing signup leads from orders with user_id...')
      const signupLeads = allLeads.filter(lead => lead.userId && !lead.isPaid)
      console.log('📝 Found', signupLeads.length, 'registered users who haven\'t purchased yet')

      // Sort by timestamp (most recent first)
      allLeads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

      console.log('✅ Total leads loaded:', allLeads.length)
      console.log('📋 Leads breakdown:', {
        customers: allLeads.filter(l => l.source === 'Customer (Purchased)').length,
        registeredNotPurchased: allLeads.filter(l => l.source === 'Registered User (Not Purchased)').length,
        abandonedGuest: allLeads.filter(l => l.source === 'Checkout (Abandoned)').length,
        contacts: allLeads.filter(l => l.source === 'Contact Form').length
      })

      setLeads(allLeads)
    } catch (error) {
      console.error('Error fetching leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSourceColor = (source) => {
    switch (source) {
      case 'Customer (Purchased)':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Registered User (Not Purchased)':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'Checkout (Abandoned)':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'Contact Form':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSourceIcon = (source) => {
    switch (source) {
      case 'Customer (Purchased)':
        return <CheckCircle size={14} />
      case 'Registered User (Not Purchased)':
        return <UserPlus size={14} />
      case 'Checkout (Abandoned)':
        return <ShoppingCart size={14} />
      case 'Contact Form':
        return <Mail size={14} />
      default:
        return <Users size={14} />
    }
  }

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone?.includes(searchQuery)

    const matchesFilter = 
      filterType === 'all' ||
      (filterType === 'customers' && lead.source === 'Customer (Purchased)') ||
      (filterType === 'checkout' && lead.source === 'Checkout (Abandoned)') ||
      (filterType === 'contact' && lead.source === 'Contact Form') ||
      (filterType === 'signup' && lead.source === 'Registered User (Not Purchased)')

    return matchesSearch && matchesFilter
  })

  const LeadDetailsModal = ({ lead, onClose }) => {
    const [sendingEmailType, setSendingEmailType] = useState(null) // Track which specific email is being sent
    const [emailStatus, setEmailStatus] = useState(null)
    const [showCustomEmail, setShowCustomEmail] = useState(false)
    const [customMessage, setCustomMessage] = useState('')
    const [customSubject, setCustomSubject] = useState('')
    const [isInMarketingList, setIsInMarketingList] = useState(false)
    const [checkingMarketingList, setCheckingMarketingList] = useState(true)

    if (!lead) return null

    // Check if this lead is already in marketing list
    useEffect(() => {
      checkIfInMarketingList()
    }, [lead])

    const checkIfInMarketingList = async () => {
      try {
        setCheckingMarketingList(true)
        const inList = await isInEmailMarketingList(lead.email)
        setIsInMarketingList(inList)
      } catch (error) {
        setIsInMarketingList(false)
      } finally {
        setCheckingMarketingList(false)
      }
    }

    const addToMarketingList = async () => {
      if (!lead.email) {
        alert('No email address for this lead')
        return
      }

      try {
        try {
          await addToEmailMarketingList({
            email: lead.email,
            name: lead.name,
            source: lead.source,
          })
        } catch (error) {
          if (error.code === 'duplicate') {
            alert('This email is already in the marketing list')
            setIsInMarketingList(true)
          } else {
            throw error
          }
          return
        }

        console.log('✅ Added to marketing list:', lead.email)
        setEmailStatus({ type: 'success', message: 'Added to email marketing list!' })
        setIsInMarketingList(true)
        
        setTimeout(() => setEmailStatus(null), 3000)
      } catch (error) {
        console.error('❌ Failed to add to marketing list:', error)
        setEmailStatus({ type: 'error', message: 'Failed to add to marketing list' })
      }
    }

    const sendEmail = async (emailType) => {
      if (!lead.email) {
        alert('No email address for this lead')
        return
      }

      setSendingEmailType(emailType) // Set specific email type being sent
      setEmailStatus(null)

      try {
        console.log(`📧 Sending ${emailType} email to ${lead.email}...`)

        const response = await fetch('/api/send-lead-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            emailType,
            leadData: lead,
            customMessage: emailType === 'custom' ? customMessage : undefined,
            customSubject: emailType === 'custom' ? customSubject : undefined
          })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.details || 'Failed to send email')
        }

        const result = await response.json()
        console.log('✅ Email sent successfully:', result)
        
        setEmailStatus({ type: 'success', message: `Email sent successfully to ${lead.email}!` })
        
        // Reset custom email form
        if (emailType === 'custom') {
          setCustomMessage('')
          setCustomSubject('')
          setShowCustomEmail(false)
        }

        // Auto-close status message after 3 seconds
        setTimeout(() => setEmailStatus(null), 3000)

      } catch (error) {
        console.error('❌ Failed to send email:', error)
        setEmailStatus({ type: 'error', message: `Failed to send email: ${error.message}` })
      } finally {
        setSendingEmailType(null) // Clear sending state
      }
    }

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Lead Details</h3>
              <p className="text-sm text-gray-600 mt-1">{lead.name}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Source Badge */}
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getSourceColor(lead.source)}`}>
                {getSourceIcon(lead.source)}
                {lead.source}
              </span>
              <span className="text-xs text-gray-500">
                {new Date(lead.timestamp).toLocaleString()}
              </span>
            </div>

            {/* Contact Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Users size={16} />
                Contact Information
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-gray-500" />
                  <span className="text-gray-900 font-medium">{lead.name}</span>
                </div>
                {lead.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-gray-500" />
                    <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                      {lead.email}
                    </a>
                  </div>
                )}
                {lead.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-gray-500" />
                    <a href={`tel:${lead.phone}`} className="text-blue-600 hover:underline">
                      {lead.phone}
                    </a>
                  </div>
                )}
                {lead.userId && (
                  <div className="text-xs text-gray-600 mt-2">
                    User ID: {lead.userId}
                  </div>
                )}
              </div>
            </div>

            {/* Address (for checkout leads) */}
            {lead.address && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <MapPin size={16} />
                  Address
                </h4>
                <p className="text-sm text-gray-900">
                  {lead.address}<br />
                  {lead.city && `${lead.city}, `}{lead.state} {lead.pincode}<br />
                  {lead.country}
                </p>
              </div>
            )}

            {/* Order Value */}
            {lead.cartValue > 0 && (
              <div className={`${lead.isPaid ? 'bg-green-50 border-green-200' : 'bg-orange-50 border-orange-200'} border rounded-lg p-4`}>
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                  {lead.isPaid ? 'Order Value' : 'Abandoned Cart Value'}
                </h4>
                <p className={`text-2xl font-bold ${lead.isPaid ? 'text-green-600' : 'text-orange-600'}`}>
                  ₹{lead.cartValue}
                </p>
                {lead.isPaid && lead.orderId && (
                  <p className="text-xs text-gray-600 mt-1">Order ID: {lead.orderId}</p>
                )}
                {lead.items && lead.items.length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-xs text-gray-600 font-medium">
                      {lead.isPaid ? 'Items purchased:' : 'Items in cart:'}
                    </p>
                    {lead.items.map((item, index) => (
                      <div key={index} className="text-xs text-gray-700 flex justify-between">
                        <span>{item.name} ({item.size})</span>
                        <span>Qty: {item.quantity}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Subject & Message (for contact form leads) */}
            {lead.message && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">
                  Inquiry Details
                </h4>
                {lead.subject && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600">Subject</p>
                    <p className="text-sm font-medium text-gray-900">{lead.subject}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-gray-600 mb-1">Message</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{lead.message}</p>
                </div>
              </div>
            )}

            {/* Add to Marketing List */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Email Marketing List</h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {isInMarketingList 
                      ? '✅ Already in marketing list' 
                      : 'Add this person to receive bulk emails'}
                  </p>
                </div>
                {!isInMarketingList && (
                  <button
                    onClick={addToMarketingList}
                    disabled={checkingMarketingList}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    <UserCheck size={16} />
                    Add to List
                  </button>
                )}
                {isInMarketingList && (
                  <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                    <CheckCircle size={16} />
                    In Marketing List
                  </span>
                )}
              </div>
            </div>

            {/* Email Status */}
            {emailStatus && (
              <div className={`border rounded-lg p-4 ${
                emailStatus.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <p className="text-sm font-medium">{emailStatus.message}</p>
              </div>
            )}

            {/* Quick Email Actions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-3">📧 Quick Email Actions</h4>
              
              <div className="grid grid-cols-1 gap-2">
                {/* Abandoned Cart / Payment Issue */}
                {(lead.source === 'Checkout (Abandoned)' || lead.source === 'Registered User (Not Purchased)') && (
                  <>
                    <button
                      onClick={() => sendEmail('abandoned-cart')}
                      disabled={sendingEmailType !== null}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      <Mail size={16} className={sendingEmailType === 'abandoned-cart' ? 'animate-spin' : ''} />
                      {sendingEmailType === 'abandoned-cart' ? 'Sending...' : 'Send Cart Recovery Email'}
                    </button>

                    <button
                      onClick={() => sendEmail('payment-issue')}
                      disabled={sendingEmailType !== null}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                    >
                      <Send size={16} className={sendingEmailType === 'payment-issue' ? 'animate-spin' : ''} />
                      {sendingEmailType === 'payment-issue' ? 'Sending...' : 'Send "Payment Issue" Email'}
                    </button>
                  </>
                )}

                {/* Welcome Email */}
                {lead.source === 'Customer (Purchased)' && (
                  <button
                    onClick={() => sendEmail('welcome')}
                    disabled={sendingEmailType !== null}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    <Gift size={16} className={sendingEmailType === 'welcome' ? 'animate-spin' : ''} />
                    {sendingEmailType === 'welcome' ? 'Sending...' : 'Send Thank You Email'}
                  </button>
                )}

                {/* Follow-up for Registered Users */}
                {lead.source === 'Registered User (Not Purchased)' && (
                  <button
                    onClick={() => sendEmail('follow-up')}
                    disabled={sendingEmailType !== null}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    <Send size={16} className={sendingEmailType === 'follow-up' ? 'animate-spin' : ''} />
                    {sendingEmailType === 'follow-up' ? 'Sending...' : 'Send Follow-up Email'}
                  </button>
                )}

                {/* Contact Form Response */}
                {lead.source === 'Contact Form' && (
                  <button
                    onClick={() => sendEmail('custom')}
                    disabled={sendingEmailType !== null || !customMessage}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    <Mail size={16} className={sendingEmailType === 'custom' && lead.source === 'Contact Form' ? 'animate-spin' : ''} />
                    {sendingEmailType === 'custom' && lead.source === 'Contact Form' ? 'Sending...' : 'Send Response Email'}
                  </button>
                )}

                {/* Custom Email Toggle */}
                <button
                  onClick={() => setShowCustomEmail(!showCustomEmail)}
                  disabled={sendingEmailType !== null}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  <MessageSquare size={16} />
                  {showCustomEmail ? 'Cancel Custom Email' : 'Write Custom Email'}
                </button>
              </div>
            </div>

            {/* Custom Email Form */}
            {showCustomEmail && (
              <div className="bg-white border border-gray-300 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">✍️ Write Custom Email</h4>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Subject Line</label>
                    <input
                      type="text"
                      value={customSubject}
                      onChange={(e) => setCustomSubject(e.target.value)}
                      placeholder="Enter email subject..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Message</label>
                    <textarea
                      value={customMessage}
                      onChange={(e) => setCustomMessage(e.target.value)}
                      placeholder="Write your message here..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-400"
                    />
                  </div>

                  <button
                    onClick={() => sendEmail('custom')}
                    disabled={sendingEmailType !== null || !customMessage || !customSubject}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 text-sm font-medium"
                  >
                    <Send size={16} className={sendingEmailType === 'custom' ? 'animate-spin' : ''} />
                    {sendingEmailType === 'custom' ? 'Sending...' : 'Send Custom Email'}
                  </button>
                </div>
              </div>
            )}

            {/* Manual Actions Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 uppercase tracking-wide mb-2">💡 Tips</h4>
              <ul className="text-xs text-blue-800 space-y-1">
                {lead.source === 'Customer (Purchased)' && (
                  <>
                    <li>• Request product review after 7-10 days</li>
                    <li>• Add to VIP customer list for exclusive offers</li>
                  </>
                )}
                {(lead.source === 'Checkout (Abandoned)' || lead.source === 'Registered User (Not Purchased)') && (
                  <>
                    <li>• Offer discount code from Coupon Manager</li>
                    <li>• Call to address payment concerns if high value</li>
                    <li>• Follow up within 24-48 hours for best results</li>
                  </>
                )}
                {lead.source === 'Contact Form' && (
                  <>
                    <li>• Respond within 24 hours for best experience</li>
                    <li>• Provide product recommendations based on their inquiry</li>
                  </>
                )}
                <li>• Add to email marketing list</li>
                <li>• Track follow-up in CRM or notes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Calculate stats
  const abandonedCarts = leads.filter(l => 
    l.source === 'Checkout (Abandoned)' || l.source === 'Registered User (Not Purchased)'
  )
  const totalCartValue = abandonedCarts.reduce((sum, l) => sum + l.cartValue, 0)

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-gray-700" />
            </div>
          </div>
          <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Total Leads</h4>
          <p className="text-2xl font-semibold text-gray-900">{leads.length}</p>
          <p className="text-xs text-gray-500 mt-1">All sources</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <ShoppingCart size={20} className="text-gray-700" />
            </div>
          </div>
          <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Not Purchased</h4>
          <p className="text-2xl font-semibold text-gray-900">
            {abandonedCarts.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">Potential customers</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
              <Mail size={20} className="text-gray-700" />
            </div>
          </div>
          <h4 className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Potential Revenue</h4>
          <p className="text-2xl font-semibold text-gray-900">₹{totalCartValue}</p>
          <p className="text-xs text-gray-500 mt-1">From abandoned carts</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 text-sm"
            >
            <option value="all">All Sources</option>
            <option value="customers">Customers (Paid)</option>
            <option value="signup">Registered Users (Not Purchased)</option>
            <option value="checkout">Abandoned Checkout (Guest)</option>
            <option value="contact">Contact Form</option>
            </select>

            <button
              onClick={fetchLeads}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-50 text-sm"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600 text-sm">Loading leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 text-sm">No leads found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">Source</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">Value</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 text-sm">{lead.name}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs space-y-1">
                        {lead.email && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Mail size={12} />
                            <span>{lead.email}</span>
                          </div>
                        )}
                        {lead.phone && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Phone size={12} />
                            <span>{lead.phone}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${getSourceColor(lead.source)}`}>
                        {getSourceIcon(lead.source)}
                        {lead.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {new Date(lead.timestamp).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      {lead.cartValue > 0 ? (
                        <span className="font-semibold text-gray-900 text-sm">₹{lead.cartValue}</span>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelectedLead(lead)
                          setShowDetails(true)
                        }}
                        className="flex items-center gap-1 text-gray-700 hover:text-gray-900 transition-colors text-sm"
                      >
                        <Eye size={16} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && selectedLead && (
        <LeadDetailsModal
          lead={selectedLead}
          onClose={() => {
            setShowDetails(false)
            setSelectedLead(null)
          }}
        />
      )}
    </div>
  )
}

export default LeadsManager

