import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
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
import Analytics from './pages/Analytics'
import Home from './pages/Home'
import Info from './pages/Info'
import ForgotPassword from './pages/ForgotPassword'
import UpdatePassword from './pages/UpdatePassword'

function AppContent() {
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/update-password" element={<UpdatePassword />} />
        <Route path="/info" element={<Info />} />

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
          <Route path="analytics" element={<Analytics />} />
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
        <NotificationProvider>
          <HelmetProvider>
            <Router>
              <AppContent />
            </Router>
          </HelmetProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
