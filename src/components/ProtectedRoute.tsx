import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return null
  }

  if (!user) {
    // Preserve attempted route so user can be redirected back after login
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}