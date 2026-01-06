import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 space-y-4">
        <div className="w-12 h-12 border-4 border-green-200 rounded-full border-t-green-600 animate-spin"></div>
        <p className="text-green-600 font-medium">Loading...</p>
      </div>
    )
  }

  if (!user) {
    // Preserve attempted route so user can be redirected back after login
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}