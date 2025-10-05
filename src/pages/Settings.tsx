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
  FileText,
  Trash2,
  Download,
  FileCog,
  Monitor,
  Shield,
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

const SettingItem = ({ icon: Icon, title, subtitle, children }: any) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
    <div className="flex items-start space-x-4">
      <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
        <Icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
      </div>
    </div>
    <div className="mt-6">
      {children}
    </div>
  </div>
)

export default function Settings() {
  const { user, profile } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState('Profile')

  const [fullName, setFullName] = useState(profile?.full_name || user?.user_metadata?.full_name || '')
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [currency, setCurrency] = useState(profile?.currency || 'INR')
  const [dateFormat, setDateFormat] = useState(profile?.date_format || 'DD/MM/YYYY')
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled ?? true)
  
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [showArchivedAccounts, setShowArchivedAccounts] = useState(profile?.show_archived_accounts ?? false)

  // Click protection states
  const [themeChanging, setThemeChanging] = useState(false)
  const [notificationUpdating, setNotificationUpdating] = useState(false)
  const [accountVisibilityUpdating, setAccountVisibilityUpdating] = useState<string | null>(null)
  const [archiveToggleUpdating, setArchiveToggleUpdating] = useState(false)

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
      setError('Could not fetch accounts.')
    } finally {
      setLoadingAccounts(false)
    }
  }

  const toggleAccountVisibility = async (accountId: string, currentStatus: boolean) => {
    if (accountVisibilityUpdating) return
    
    setAccountVisibilityUpdating(accountId)
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: !currentStatus })
        .eq('id', accountId)

      if (error) throw error
      
      setAccounts(accounts.map(acc => 
        acc.id === accountId ? {...acc, is_active: !currentStatus} : acc
      ))
      setSuccess('Account status updated.')
      setTimeout(() => setSuccess(''), 2000)
    } catch (err: any) {
      setError(err.message || 'Failed to update account')
    } finally {
      setAccountVisibilityUpdating(null)
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
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
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

  const dateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']

  const TabButton = ({ name, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`flex items-center justify-center md:justify-start space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium w-full md:w-auto ${
        activeTab === name
          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
          : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span className="hidden md:inline">{name}</span>
    </button>
  )

  // Theme change handler with protection
  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    if (themeChanging) return
    
    setThemeChanging(true)
    try {
      if (newTheme === 'light' && isDark) {
        toggleTheme()
      } else if (newTheme === 'dark' && !isDark) {
        toggleTheme()
      }
    } finally {
      setTimeout(() => setThemeChanging(false), 300)
    }
  }

  // Notification toggle handler with protection
  const handleNotificationToggle = async () => {
    if (notificationUpdating) return
    
    setNotificationUpdating(true)
    try {
      const newValue = !notificationsEnabled
      setNotificationsEnabled(newValue)
      await updatePreference('notifications_enabled', newValue)
    } finally {
      setNotificationUpdating(false)
    }
  }

  // Archive toggle handler with protection
  const handleArchiveToggle = async () => {
    if (archiveToggleUpdating) return
    
    setArchiveToggleUpdating(true)
    try {
      const newValue = !showArchivedAccounts
      setShowArchivedAccounts(newValue)
      await updatePreference('show_archived_accounts', newValue)
    } finally {
      setArchiveToggleUpdating(false)
    }
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your account and application preferences</p>
      </header>

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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-2">
          <TabButton name="Profile" icon={User} />
          <TabButton name="Preferences" icon={SettingsIcon} />
          <TabButton name="Notifications" icon={Bell} />
          <TabButton name="Security" icon={Shield} />
          <TabButton name="Data" icon={FileCog} />
        </nav>
      </div>

      <main>
        {/* Profile Tab */}
        {activeTab === 'Profile' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile Information</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Photo Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <Camera className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profile Picture</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload a new photo. Max 2MB.</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center space-x-4">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-16 h-16 rounded-full object-cover" />
                  ) : (
                    <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-white" />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Name Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your Name</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">This will be displayed on your profile.</p>
                  </div>
                </div>
                <div className="mt-6">
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
                    <div className="flex items-center justify-between">
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
              </div>

              {/* Email Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <Mail className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Email Address</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your email is used for login and notifications.</p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-gray-900 dark:text-white">{profile?.email || user?.email}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Cannot be changed</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'Preferences' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Application Preferences</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SettingItem icon={Monitor} title="Theme" subtitle="Switch between light and dark mode.">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleThemeChange('light')}
                    disabled={themeChanging}
                    className={`px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors ${
                      !isDark 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } ${themeChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Sun className="w-4 h-4" />
                    <span>Light</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    disabled={themeChanging}
                    className={`px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors ${
                      isDark 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } ${themeChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <Moon className="w-4 h-4" />
                    <span>Dark</span>
                  </button>
                </div>
                {themeChanging && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Changing theme...</p>
                )}
              </SettingItem>

              <SettingItem icon={Globe} title="Default Currency" subtitle="Select your primary currency for tracking.">
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
                      {curr.name} ({curr.code})
                    </option>
                  ))}
                </select>
              </SettingItem>

              <SettingItem icon={FileText} title="Date Format" subtitle="Choose how dates are displayed across the app.">
                <select
                  value={dateFormat}
                  onChange={(e) => {
                    setDateFormat(e.target.value)
                    updatePreference('date_format', e.target.value)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {dateFormats.map((format) => (
                    <option key={format} value={format}>
                      {format}
                    </option>
                  ))}
                </select>
              </SettingItem>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'Notifications' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Notification Settings</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SettingItem icon={Bell} title="Push Notifications" subtitle="Receive important updates on your device.">
                <div className="flex items-center justify-between">
                  <p className="text-gray-700 dark:text-gray-300">Enable Notifications</p>
                  <button
                    onClick={handleNotificationToggle}
                    disabled={notificationUpdating}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationsEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                    } ${notificationUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                {notificationUpdating && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Updating...</p>
                )}
              </SettingItem>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'Security' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Security Settings</h2>
            <div className="grid grid-cols-1 gap-6">
              <SettingItem icon={Wallet} title="Account Visibility" subtitle="Show or hide specific accounts from your dashboard.">
                <div className="flex justify-end mb-4">
                  <button
                    onClick={handleArchiveToggle}
                    disabled={archiveToggleUpdating}
                    className={`text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium ${
                      archiveToggleUpdating ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {showArchivedAccounts ? 'Hide Archived Accounts' : 'Show Archived Accounts'}
                    {archiveToggleUpdating && '...'}
                  </button>
                </div>

                {loadingAccounts ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">Loading accounts...</p>
                ) : (
                  <div className="space-y-3">
                    {accounts
                      .filter(acc => showArchivedAccounts || acc.is_active)
                      .map((account) => (
                        <div
                          key={account.id}
                          className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{account.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(account.balance)}</p>
                          </div>
                          <button
                            onClick={() => toggleAccountVisibility(account.id, account.is_active)}
                            disabled={accountVisibilityUpdating === account.id}
                            className={`flex items-center space-x-1.5 px-3 py-1 text-xs rounded-full transition-colors ${
                              account.is_active
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                            } ${accountVisibilityUpdating === account.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {accountVisibilityUpdating === account.id ? (
                              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : account.is_active ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                            <span>
                              {accountVisibilityUpdating === account.id ? 'Updating...' : account.is_active ? 'Visible' : 'Hidden'}
                            </span>
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </SettingItem>
            </div>
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'Data' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Data Management</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SettingItem icon={Download} title="Export Data" subtitle="Download your financial data in various formats.">
                <div className="flex flex-wrap gap-3">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                    <FileText className="w-4 h-4" />
                    <span>Export as Excel</span>
                  </button>
                </div>
              </SettingItem>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 shadow-sm">
               <div className="flex items-start space-x-4">
                  <div className="bg-red-100 dark:bg-red-800 p-3 rounded-lg">
                    <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-800 dark:text-red-300">Danger Zone</h3>
                    <p className="text-red-600 dark:text-red-400 mt-1">Permanently delete all data. This cannot be undone.</p>
                  </div>
                </div>
                <div className="mt-6">
                  <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors text-sm font-medium">
                    <Trash2 className="w-4 h-4" />
                    <span>Delete All Data</span>
                  </button>
                </div>
             </div>
            
            <SettingItem icon={LogOut} title="Account Actions" subtitle="Sign out from your current session.">
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-500 text-sm font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </SettingItem>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}