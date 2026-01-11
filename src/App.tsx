import { Suspense } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter as Router, useRoutes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { NotificationProvider } from './contexts/NotificationContext'
import { routes } from './routes'
import ReportManager from './components/ReportManager'

function AppRoutes() {
  const element = useRoutes(routes)
  return element
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <HelmetProvider>
            <Router>
              <Suspense fallback={<div>Loading...</div>}>
                <AppRoutes />
                <ReportManager />
              </Suspense>
            </Router>
          </HelmetProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
