// import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
// import { AuthProvider } from './contexts/AuthContext'
// import { ThemeProvider } from './contexts/ThemeContext'
// import Layout from './components/Layout'
// import ProtectedRoute from './components/ProtectedRoute'
// import AIChat from './components/AIChat'
// import Login from './pages/Login'
// import SignUp from './pages/SignUp'
// import Dashboard from './pages/Dashboard'
// import Accounts from './pages/Accounts'
// import Transactions from './pages/Transactions'
// import GroupExpenses from './pages/GroupExpenses'
// import DebtsCredits from './pages/DebtsCredits'
// import Goals from './pages/Goals'
// import Settings from './pages/Settings'
// import HomePage from './pages/HomePage'

// function App() {
//   return (
//     <ThemeProvider>
//       <AuthProvider>
//         <Router>
//           <Routes>
//             {/* Public Routes */}
//             <Route path="/" element={<HomePage />} />
//             <Route path="/login" element={<Login />} />
//             <Route path="/signup" element={<SignUp />} />
            
//             {/* Protected App Routes */}
//             <Route path="/app" element={
//               <ProtectedRoute>
//                 <Layout />
//                 <AIChat />
//               </ProtectedRoute>
//             }>
//               <Route index element={<Navigate to="/app/dashboard" replace />} />
//               <Route path="dashboard" element={<Dashboard />} />
//               <Route path="accounts" element={<Accounts />} />
//               <Route path="transactions" element={<Transactions />} />
//               <Route path="group-expenses" element={<GroupExpenses />} />
//               <Route path="debts-credits" element={<DebtsCredits />} />
//               <Route path="goals" element={<Goals />} />
//               <Route path="settings" element={<Settings />} />
//             </Route>
            
//             {/* Fallback route */}
//             <Route path="*" element={<Navigate to="/" replace />} />
//           </Routes>
//         </Router>
//       </AuthProvider>
//     </ThemeProvider>
//   )
// }

// export default App

import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import AIChat from './components/AIChat'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Dashboard from './pages/Dashboard'
import Accounts from './pages/Accounts'
import Transactions from './pages/Transactions'
import GroupExpenses from './pages/GroupExpenses'
import DebtsCredits from './pages/DebtsCredits'
import Goals from './pages/Goals'
import Settings from './pages/Settings'
import HomePage from './pages/HomePage'
import { supabase } from './lib/supabase'

// Component to handle global session recovery
function SessionRecoveryHandler() {
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const handleGlobalAuthError = async () => {
      // This can catch any global auth errors that might occur
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) {
          console.error('Global auth error detected:', error)
          await supabase.auth.signOut()
          if (window.location.pathname !== '/login') {
            navigate('/login', { replace: true })
          }
        }
      } catch (error) {
        console.error('Global session check failed:', error)
      }
    }

    // Check session periodically (every 10 minutes)
    const interval = setInterval(handleGlobalAuthError, 10 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [user, navigate])

  return null
}

function AppContent() {
  return (
    <>
      <SessionRecoveryHandler />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        
        {/* Protected App Routes */}
        <Route path="/app" element={
          <ProtectedRoute>
            <Layout />
            <AIChat />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="group-expenses" element={<GroupExpenses />} />
          <Route path="debts-credits" element={<DebtsCredits />} />
          <Route path="goals" element={<Goals />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App