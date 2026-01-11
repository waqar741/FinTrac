import { Navigate, RouteObject } from 'react-router-dom'
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
import LandingPage from './pages/LandingPage'

export const routes: RouteObject[] = [
    {
        path: '/',
        element: <Home />
    },
    {
        path: '/login',
        element: <Login />
    },
    {
        path: '/signup',
        element: <SignUp />
    },
    {
        path: '/forgot-password',
        element: <ForgotPassword />
    },
    {
        path: '/update-password',
        element: <UpdatePassword />
    },
    {
        path: '/info',
        element: <Info />
    },
    {
        path: '/:slug',
        element: <LandingPage />
    },
    {
        path: '/app',
        element: (
            <ProtectedRoute>
                <Layout />
                <AIChat />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Navigate to="/app/dashboard" replace />
            },
            {
                path: 'dashboard',
                element: <Dashboard />
            },
            {
                path: 'accounts',
                element: <Accounts />
            },
            {
                path: 'transactions',
                element: <Transactions />
            },
            {
                path: 'group-expenses',
                element: <GroupExpenses />
            },
            {
                path: 'debts-credits',
                element: <DebtsCredits />
            },
            {
                path: 'goals',
                element: <Goals />
            },
            {
                path: 'settings',
                element: <Settings />
            },
            {
                path: 'analytics',
                element: <Analytics />
            }
        ]
    },
    {
        path: '*',
        element: <Navigate to="/" replace />
    }
]
