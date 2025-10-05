// import { useState } from 'react'
// import { useNavigate } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { useTheme } from '../contexts/ThemeContext'
// import { supabase } from '../lib/supabase'
// import { User, Moon, Sun, LogOut, Save, Mail, Settings as SettingsIcon } from 'lucide-react'

// export default function Settings() {
//   const { user, profile } = useAuth()
//   const { isDark, toggleTheme } = useTheme()
//   const navigate = useNavigate()
//   const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '')
//   const [isEditing, setIsEditing] = useState(false)
//   const [saving, setSaving] = useState(false)
//   const [error, setError] = useState('')
//   const [success, setSuccess] = useState('')

//   const handleSignOut = async () => {
//     try {
//       const { error } = await supabase.auth.signOut()
//       if (error) throw error
//       navigate('/login')
//     } catch (error) {
//       console.error('Error signing out:', error)
//     }
//   }

//   const handleSaveName = async () => {
//     // ✨ FIX: Prevent multiple clicks
//     if (saving) return
    
//     if (!fullName.trim()) {
//       setError('Name cannot be empty')
//       return
//     }

//     setSaving(true)
//     setError('')
//     setSuccess('')

//     try {
//       const { error: updateError } = await supabase
//         .from('profiles')
//         .update({ full_name: fullName })
//         .eq('id', user?.id)

//       if (updateError) throw updateError

//       setSuccess('Name updated successfully!')
//       setIsEditing(false)
//       setTimeout(() => setSuccess(''), 3000)
//     } catch (err: any) {
//       setError(err.message || 'Failed to update name')
//     } finally {
//       setSaving(false)
//     }
//   }

//   return (
//     <div className="p-6 space-y-6">
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
//         <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your account preferences and settings</p>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Profile Card */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <div className="flex items-center space-x-3 mb-6">
//             <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
//             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
//           </div>

//           <div className="space-y-6">
//             <div className="flex items-center justify-center">
//               <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center">
//                 <User className="w-12 h-12 text-white" />
//               </div>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                 Full Name
//               </label>
//               {isEditing ? (
//                 <div className="space-y-3">
//                   <input
//                     type="text"
//                     value={fullName}
//                     onChange={(e) => setFullName(e.target.value)}
//                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                     placeholder="Your name"
//                   />
//                   <div className="flex space-x-2">
//                     <button
//                       onClick={handleSaveName}
//                       disabled={saving}
//                       className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
//                     >
//                       <Save className="w-4 h-4 mr-2" />
//                       {saving ? 'Saving...' : 'Save'}
//                     </button>
//                     <button
//                       onClick={() => {
//                         // ✨ FIX: Prevent cancel while saving
//                         if (saving) return
//                         setIsEditing(false)
//                         setFullName(profile?.full_name || user?.user_metadata?.full_name || '')
//                         setError('')
//                       }}
//                       disabled={saving}
//                       className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                     >
//                       Cancel
//                     </button>
//                   </div>
//                 </div>
//               ) : (
//                 <div className="flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
//                   <span className="text-gray-900 dark:text-white">
//                     {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
//                   </span>
//                   <button
//                     onClick={() => setIsEditing(true)}
//                     className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
//                   >
//                     Edit
//                   </button>
//                 </div>
//               )}
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                 Email Address
//               </label>
//               <div className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
//                 <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
//                 <span className="text-gray-900 dark:text-white">{profile?.email || user?.email}</span>
//               </div>
//               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                 Email cannot be changed
//               </p>
//             </div>

//             {error && (
//               <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
//                 <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
//               </div>
//             )}

//             {success && (
//               <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
//                 <p className="text-green-700 dark:text-green-400 text-sm">{success}</p>
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Appearance & Security Card */}
//         <div className="space-y-6">
//           {/* Appearance */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//             <div className="flex items-center space-x-3 mb-6">
//               {isDark ? (
//                 <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
//               ) : (
//                 <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
//               )}
//               <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
//             </div>

//             <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
//               <div>
//                 <p className="font-medium text-gray-900 dark:text-white">Theme</p>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                   {isDark ? 'Dark mode' : 'Light mode'}
//                 </p>
//               </div>
//               <button
//                 onClick={toggleTheme}
//                 className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
//               >
//                 {isDark ? (
//                   <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
//                 ) : (
//                   <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
//                 )}
//               </button>
//             </div>
//           </div>

//           {/* Account Actions */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//             <div className="flex items-center space-x-3 mb-6">
//               <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
//               <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Actions</h2>
//             </div>

//             <button
//               onClick={handleSignOut}
//               className="w-full flex items-center justify-center px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
//             >
//               <LogOut className="w-5 h-5 mr-2" />
//               Sign Out
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }



import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { supabase } from '../lib/supabase'
import {
  User,
  Moon,
  Sun,
  LogOut,
  Save,
  Mail,
  Settings as SettingsIcon,
  Camera,
  Bell,
  Globe,
  Eye,
  EyeOff,
  Wallet
} from 'lucide-react'

interface Account {
  id: string
  name: string
  type: string
  balance: number
  is_active: boolean
}

export default function Settings() {
  const { user, profile } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [currency, setCurrency] = useState(profile?.currency || 'INR')
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled ?? true)
  const [showArchivedAccounts, setShowArchivedAccounts] = useState(profile?.show_archived_accounts ?? false)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  useEffect(() => {
    if (user) {
      fetchAccounts()
    }
  }, [user])

  const fetchAccounts = async () => {
    setLoadingAccounts(true)
    try {
      const { data } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (data) setAccounts(data)
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoadingAccounts(false)
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      navigate('/login')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const handleSaveName = async () => {
    if (saving) return

    if (!fullName.trim()) {
      setError('Name cannot be empty')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', user?.id)

      if (updateError) throw updateError

      setSuccess('Name updated successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to update name')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setError('Image must be less than 2MB')
      return
    }

    setUploadingAvatar(true)
    setError('')

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      setSuccess('Profile picture updated!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to upload image')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const updatePreference = async (field: string, value: any) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ [field]: value })
        .eq('id', user?.id)

      if (updateError) throw updateError

      setSuccess('Preference updated!')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to update preference')
    }
  }

  const toggleAccountVisibility = async (accountId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: !currentStatus })
        .eq('id', accountId)

      if (error) throw error
      await fetchAccounts()
    } catch (err: any) {
      setError(err.message || 'Failed to update account')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const currencies = [
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'USD', name: 'US Dollar' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' },
  ]

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your account preferences and settings</p>
      </div>

      {/* Notifications */}
      {(error || success) && (
        <div className="space-y-2">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <p className="text-green-700 dark:text-green-400 text-sm">{success}</p>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-6">
            <SettingsIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Information</h2>
          </div>

          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="relative group">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    className="w-24 h-24 rounded-full object-cover border-4 border-green-600"
                  />
                ) : (
                  <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center border-4 border-green-600">
                    <User className="w-12 h-12 text-white" />
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute bottom-0 right-0 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-lg disabled:bg-gray-400"
                >
                  <Camera className="w-4 h-4" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              {uploadingAvatar && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Uploading...</p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Max 2MB</p>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Your name"
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveName}
                      disabled={saving}
                      className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={() => {
                        if (saving) return
                        setIsEditing(false)
                        setFullName(profile?.full_name || user?.user_metadata?.full_name || '')
                        setError('')
                      }}
                      disabled={saving}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <span className="text-gray-900 dark:text-white">
                    {profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
                  </span>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <div className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <Mail className="w-4 h-4 text-gray-500 dark:text-gray-400 mr-2" />
                <span className="text-gray-900 dark:text-white">{profile?.email || user?.email}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Email cannot be changed
              </p>
            </div>
          </div>
        </div>

        {/* Preferences Column */}
        <div className="space-y-6">
          {/* Appearance */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              {isDark ? (
                <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Appearance</h2>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Theme</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isDark ? 'Dark mode' : 'Light mode'}
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                {isDark ? (
                  <Sun className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* Currency Preference */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Currency</h2>
            </div>

            <select
              value={currency}
              onChange={(e) => {
                setCurrency(e.target.value)
                updatePreference('currency', e.target.value)
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} - {curr.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-4">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notifications</h2>
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Enable Notifications</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Receive updates about your finances
                </p>
              </div>
              <button
                onClick={() => {
                  const newValue = !notificationsEnabled
                  setNotificationsEnabled(newValue)
                  updatePreference('notifications_enabled', newValue)
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notificationsEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Account Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <LogOut className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Actions</h2>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Account Visibility Management */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Wallet className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Visibility</h2>
          </div>
          <button
            onClick={() => {
              const newValue = !showArchivedAccounts
              setShowArchivedAccounts(newValue)
              updatePreference('show_archived_accounts', newValue)
            }}
            className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
          >
            {showArchivedAccounts ? 'Hide Archived' : 'Show Archived'}
          </button>
        </div>

        {loadingAccounts ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">Loading accounts...</p>
        ) : accounts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-4">No accounts found</p>
        ) : (
          <div className="space-y-3">
            {accounts
              .filter(acc => showArchivedAccounts || acc.is_active)
              .map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">{account.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{account.type}</p>
                      <span className="text-gray-400">•</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(account.balance)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAccountVisibility(account.id, account.is_active)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      account.is_active
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {account.is_active ? (
                      <>
                        <Eye className="w-4 h-4" />
                        <span className="text-sm">Visible</span>
                      </>
                    ) : (
                      <>
                        <EyeOff className="w-4 h-4" />
                        <span className="text-sm">Hidden</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}
