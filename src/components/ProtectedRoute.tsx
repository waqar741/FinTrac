// import { useAuth } from '../contexts/AuthContext'
// import { Navigate } from 'react-router-dom'

// interface ProtectedRouteProps {
//   children: React.ReactNode
// }

// export default function ProtectedRoute({ children }: ProtectedRouteProps) {
//   const { user, loading } = useAuth()

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
//       </div>
//     )
//   }

//   if (!user) {
//     return <Navigate to="/login" replace />
//   }

//   return <>{children}</>
// }


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
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  if (!user) {
    // Preserve attempted route so user can be redirected back after login
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
