import React, { useState, useEffect } from 'react'
import { Mail, UserPlus, Trash2, Send, Users, X, Plus, CheckCircle } from 'lucide-react'
import {
  getEmailMarketingList,
  addToEmailMarketingList,
  removeFromEmailMarketingList,
} from '../../services/marketing-service'

function EmailMarketingManager() {
  const [emailList, setEmailList] = useState([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [newName, setNewName] = useState('')
  const [subject, setSubject] = useState('')
  const [emailBody, setEmailBody] = useState('')
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState(null)

  useEffect(() => {
    fetchEmailList()
  }, [])

  const fetchEmailList = async () => {
    try {
      setLoading(true)
      const data = await getEmailMarketingList()
      setEmailList(data || [])
      console.log('✅ Email marketing list loaded:', data?.length || 0, 'subscribers')
    } catch (error) {
      console.error('Error fetching email list:', error)
    } finally {
      setLoading(false)
    }
  }

  const addEmail = async () => {
    if (!newEmail || !newEmail.includes('@')) {
      alert('Please enter a valid email address')
      return
    }

    try {
      const exists = emailList.some(item => item.email.toLowerCase() === newEmail.toLowerCase())
      if (exists) {
        alert('This email is already in the marketing list')
        return
      }

      const data = await addToEmailMarketingList({
        email: newEmail,
        name: newName || newEmail.split('@')[0],
        source: 'Manual',
      })

      console.log('✅ Email added to marketing list:', newEmail)
      setEmailList([data, ...emailList])
      setNewEmail('')
      setNewName('')
    } catch (error) {
      console.error('Error adding email:', error)
      alert('Failed to add email to list')
    }
  }

  const removeEmail = async (id, email) => {
    if (!confirm(`Remove ${email} from marketing list?`)) return

    try {
      await removeFromEmailMarketingList(id)
      console.log('✅ Email removed from marketing list:', email)
      setEmailList(emailList.filter(item => item.id !== id))
    } catch (error) {
      console.error('Error removing email:', error)
      alert('Failed to remove email')
    }
  }

  const sendBulkEmail = async () => {
    if (!subject || !emailBody) {
      alert('Please enter both subject and message')
      return
    }

    if (emailList.length === 0) {
      alert('No emails in the marketing list')
      return
    }

    if (!confirm(`Send email to ${emailList.length} subscribers?`)) return

    setSending(true)
    setSendStatus(null)

    try {
      const apiUrl = import.meta.env.DEV
        ? '/api/send-bulk-email'
        : 'http://localhost:3001/api/send-bulk-email'

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients: emailList.map(item => ({
            email: item.email,
            name: item.name,
          })),
          subject,
          message: emailBody,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        setSendStatus({ type: 'success', message: result.message || 'Emails sent successfully!' })
        setSubject('')
        setEmailBody('')
      } else {
        setSendStatus({ type: 'error', message: result.error || 'Failed to send emails' })
      }
    } catch (error) {
      console.error('Error sending bulk email:', error)
      setSendStatus({ type: 'error', message: 'Failed to send emails. Please try again.' })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Email Marketing</h2>
          <p className="text-gray-600">Manage subscribers and send bulk emails</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users size={16} />
          <span>{emailList.length} subscribers</span>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <UserPlus size={20} />
          Add Subscriber
        </h3>
        <div className="flex flex-wrap gap-3">
          <input
            type="email"
            placeholder="Email address"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="Name (optional)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 min-w-[150px] px-4 py-2 border rounded-lg"
          />
          <button
            onClick={addEmail}
            className="px-4 py-2 bg-green-800 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Send size={20} />
          Send Bulk Email
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <textarea
            placeholder="Email message (HTML supported)"
            value={emailBody}
            onChange={(e) => setEmailBody(e.target.value)}
            rows={8}
            className="w-full px-4 py-2 border rounded-lg"
          />
          {sendStatus && (
            <div className={`p-3 rounded-lg ${sendStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
              {sendStatus.message}
            </div>
          )}
          <button
            onClick={sendBulkEmail}
            disabled={sending}
            className="px-6 py-2 bg-green-800 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
          >
            {sending ? 'Sending...' : (
              <>
                <Mail size={16} />
                Send to {emailList.length} Subscribers
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold">Subscriber List</h3>
        </div>
        <div className="divide-y max-h-96 overflow-y-auto">
          {emailList.length === 0 ? (
            <p className="p-6 text-gray-500 text-center">No subscribers yet</p>
          ) : (
            emailList.map((item) => (
              <div key={item.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
                <div>
                  <p className="font-medium">{item.name || item.email}</p>
                  <p className="text-sm text-gray-600">{item.email}</p>
                  <p className="text-xs text-gray-400">Source: {item.source} • Added: {new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => removeEmail(item.id, item.email)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default EmailMarketingManager
