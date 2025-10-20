import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const checkSessionValidity = async () => {
      if (!user) return

      try {
        // 🔑 Double-check session validity
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error || !session) {
          console.log('Session invalid, redirecting to login')
          await supabase.auth.signOut()
          navigate('/login', { 
            replace: true, 
            state: { from: location } 
          })
          return
        }

        // 🔑 Check if token is expired
        const isExpired = session.expires_at 
          ? new Date(session.expires_at * 1000) < new Date()
          : true

        if (isExpired) {
          console.log('Token expired, attempting refresh...')
          const { error: refreshError } = await supabase.auth.refreshSession()
          
          if (refreshError) {
            console.log('Token refresh failed, redirecting to login')
            await supabase.auth.signOut()
            navigate('/login', { 
              replace: true, 
              state: { from: location } 
            })
          }
        }
      } catch (error) {
        console.error('Session validation error:', error)
        await supabase.auth.signOut()
        navigate('/login', { 
          replace: true, 
          state: { from: location } 
        })
      }
    }

    // Check session when component mounts
    checkSessionValidity()

    // 🔑 Also check when user returns to the tab after being away
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionValidity()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [user, navigate, location])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 space-y-4">
  <div className="w-12 h-12 border-4 border-green-200 rounded-full border-t-green-600 animate-spin"></div>
  <p className="text-green-600 font-medium">Loading transactions...</p>
</div>
    )
  }

  if (!user) {
    // Preserve attempted route so user can be redirected back after login
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}