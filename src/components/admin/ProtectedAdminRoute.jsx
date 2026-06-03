import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAdmin } from '../../contexts/AdminContext'

function ProtectedAdminRoute({ children }) {
  const { isAdminAuthenticated, isLoading } = useAdmin()

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-800 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  // Render the protected component if authenticated
  return children
}

export default ProtectedAdminRoute

