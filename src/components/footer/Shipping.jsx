import React from 'react'
import { CONTACT_EMAIL } from '../../config/brand'

function Shipping() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Shipping Information</h1>
        <div className="space-y-4 text-gray-700">
          <p>We ship orders within 1-2 business days. Delivery typically takes 3-7 days across India.</p>
          <p>Express options are available at checkout. Tracking details will be sent via email/SMS.</p>
          <p>For shipping questions, reach out to {CONTACT_EMAIL}.</p>
        </div>
      </div>
    </div>
  )
}

export default Shipping
