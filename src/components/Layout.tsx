// import { useState } from 'react'
// import { NavLink, Outlet, useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { useTheme } from '../contexts/ThemeContext'
// import { 
//   Home,
//   Wallet,
//   Users as GroupIcon,
//   List,
//   Users,
//   Target,
//   LogOut,
//   Menu,
//   X,
//   Moon,
//   Sun,
//   ChevronDown,
//   User,
//   Settings
// } from 'lucide-react'

// export default function Layout() {
//   const [sidebarOpen, setSidebarOpen] = useState(false)
//   const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
//   const { user, signOut, profile } = useAuth()
//   const { isDark, toggleTheme } = useTheme()
//   const navigate = useNavigate()

//   const handleSignOut = async () => {
//     try {
//       await signOut()
//       navigate('/login')
//     } catch (error) {
//       console.error('Error signing out:', error)
//     }
//   }

//   const navItems = [
//     { to: '/dashboard', icon: Home, label: 'Dashboard' },
//     { to: '/accounts', icon: Wallet, label: 'Accounts' },
//     { to: '/transactions', icon: List, label: 'Transactions' },
//     { to: '/goals', icon: Target, label: 'Saving Goals' },
//     { to: '/debts-credits', icon: Users, label: 'Debts & Credits' },
//   ]

//   return (
//     <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
//       {/* Mobile backdrop */}
//       {sidebarOpen && (
//         <div 
//           className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
//           onClick={() => setSidebarOpen(false)}
//         />
//       )}

//       {/* Sidebar */}
//       <aside className={`
//         fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out
//         ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
//         lg:translate-x-0 lg:static lg:inset-0
//       `}>



//         <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
//           <div className="flex items-center space-x-2">
//             {/* New SVG for a wallet icon */}
//             <svg
//               className="w-8 h-8 text-teal-600" // Changed color
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="1.5"
//               viewBox="0 0 24 24"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
//               />
//             </svg>
//             {/* The name is back */}
//             <span className="text-xl font-bold text-gray-900 dark:text-white">Fintrac</span>
//           </div>
//           <button
//             onClick={() => setSidebarOpen(false)}
//             className="p-2 rounded-md lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
//           >
//             <X className="w-5 h-5" />
//           </button>
//         </div>



        
//         <nav className="flex-1 px-4 py-6 space-y-2">
//           {navItems.map((item) => (
//             <NavLink
//               key={item.to}
//               to={item.to}
//               onClick={() => setSidebarOpen(false)}
//               className={({ isActive }) => `
//                 flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
//                 ${isActive 
//                   ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-r-2 border-green-600' 
//                   : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
//                 }
//               `}
//             >
//               <item.icon className="w-5 h-5 mr-3" />
//               {item.label}
//             </NavLink>
//           ))}
//         </nav>

//         <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
//           <NavLink
//             to="/settings"
//             onClick={() => setSidebarOpen(false)}
//             className={({ isActive }) => `
//               w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
//               ${ isActive
//                 ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-r-2 border-green-600'
//                 : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
//               }
//             `}
//           >
//             <Settings className="w-5 h-5 mr-3" />
//             Settings
//           </NavLink>
//           <div className="px-4 py-3">
//             <div className="flex items-center space-x-3">
//               <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
//                 <User className="w-4 h-4 text-white" />
//               </div>
//               <div>
//                 <p className="text-sm font-medium text-gray-900 dark:text-white">
//                   {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
//                 </p>
//                 <p className="text-xs text-gray-500 dark:text-gray-400">{profile?.email || user?.email}</p>
//               </div>
//             </div>
//           </div>
//         </div>
//       </aside>

//       {/* Main content */}
//       <div className="flex-1 flex flex-col overflow-hidden">
//         {/* Header */}
//         <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
//           <div className="flex items-center justify-between h-16 px-4 lg:px-6">
//             <button
//               onClick={() => setSidebarOpen(true)}
//               className="p-2 rounded-md lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
//             >
//               <Menu className="w-5 h-5" />
//             </button>
            
//             <div className="flex-1 lg:flex-none lg:ml-auto">
//               <div className="flex items-center justify-end space-x-4">
//                 <button
//                   onClick={toggleTheme}
//                   className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
//                 >
//                   {isDark ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
//                 </button>
                
//                 <div className="relative">
//                   <button
//                     onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
//                     className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
//                   >
//                     <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
//                       <User className="w-4 h-4 text-white" />
//                     </div>
//                     <span className="text-sm font-medium text-gray-900 dark:text-white hidden sm:block" title={profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}>
//                       {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
//                     </span>
//                     <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
//                   </button>
                  
//                   {profileDropdownOpen && (
//                     <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
//                       <div className="p-3 border-b border-gray-200 dark:border-gray-700">
//                         <p className="font-medium text-gray-900 dark:text-white">
//                           {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
//                         </p>
//                         <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email || user?.email}</p>
//                       </div>
//                       <div className="p-1">
//                         <button
//                           onClick={handleSignOut}
//                           className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
//                         >
//                           <LogOut className="w-4 h-4 mr-2" />
//                           Sign Out
//                         </button>
//                       </div>
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//           </div>
//         </header>

//         {/* Page content */}
//         <main className="flex-1 overflow-auto">
//           <Outlet />
//         </main>
//       </div>
//     </div>
//   )
// }


import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { 
  Home,
  Wallet,
  List,
  Users,
  Target,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
  ChevronDown,
  User,
  Settings
} from 'lucide-react'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false)
  const { user, signOut, profile } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const navItems = [
    { to: '/dashboard', icon: Home, label: 'Dashboard' },
    { to: '/accounts', icon: Wallet, label: 'Accounts' },
    { to: '/transactions', icon: List, label: 'Transactions' },
    { to: '/goals', icon: Target, label: 'Saving Goals' },
    { to: '/debts-credits', icon: Users, label: 'Debts & Credits' },
  ]

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>



        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {/* New SVG for a wallet icon */}
            <svg
              className="w-8 h-8 text-teal-600" // Changed color
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
              />
            </svg>
            {/* The name is back */}
            <span className="text-xl font-bold text-gray-900 dark:text-white">Fintrac</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-md lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>



        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
                ${isActive 
                  ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-r-2 border-green-600' 
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
          <div className="px-4 py-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{profile?.email || user?.email}</p>
              </div>
            </div>
          </div>
          <NavLink
            to="/settings"
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }) => `
              w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors
              ${ isActive
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border-r-2 border-green-600'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }
            `}
          >
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-md lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex-1 lg:flex-none lg:ml-auto">
              <div className="flex items-center justify-end space-x-4">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  {isDark ? <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" /> : <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />}
                </button>
                
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white hidden sm:block" title={profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}>
                      {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                  
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{profile?.email || user?.email}</p>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}