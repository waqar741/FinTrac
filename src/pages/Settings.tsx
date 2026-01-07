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
  Lock,
  X,
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
  Wallet,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import { useDateFormat } from '../hooks/useDateFormat'
import PageGuide from '../components/PageGuide'
import ConfirmModal from '../components/ConfirmModal'

interface Account {
  id: string
  name: string
  type: string
  balance: number
  is_active: boolean
  is_default: boolean
}

const ChangePasswordModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full">
                <Lock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Change Password</h3>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const form = e.currentTarget
              const formData = new FormData(form)
              const password = formData.get('password') as string
              const confirmPassword = formData.get('confirmPassword') as string

              if (password !== confirmPassword) {
                setError('Passwords do not match')
                return
              }
              if (password.length < 8) {
                setError('Password must be at least 8 characters')
                return
              }

              try {
                setLoading(true)
                setError('')
                setSuccess('')
                const { error } = await supabase.auth.updateUser({ password })
                if (error) throw error
                setSuccess('Password updated successfully!')
                setTimeout(() => {
                  setSuccess('')
                  onClose()
                }, 2000)
                form.reset()
              } catch (err: any) {
                setError(err.message || 'Failed to update password')
              } finally {
                setLoading(false)
              }
            }}
            className="space-y-4"
          >
            <div>
              <input
                name="password"
                type="password"
                placeholder="New Password"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Confirm New Password"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {(error || success) && (
              <div className={`p-3 rounded-lg text-sm ${error ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' : 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'}`}>
                {error || success}
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors flex items-center"
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
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
  const { user, profile, refreshProfile } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { formatDate } = useDateFormat()
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

  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled ?? true)

  const [accounts, setAccounts] = useState<Account[]>([])
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [showArchivedAccounts, setShowArchivedAccounts] = useState(profile?.show_archived_accounts ?? false)
  const [exporting, setExporting] = useState(false)

  // Modals
  const [showAIModal, setShowAIModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

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

  // Sync state with profile changes
  useEffect(() => {
    if (profile) {
      setCurrency(profile.currency || 'INR')
      setNotificationsEnabled(profile.notifications_enabled ?? true)
      setShowArchivedAccounts(profile.show_archived_accounts ?? false)
      if (!isEditing) {
        setFullName(profile.full_name || user?.user_metadata?.full_name || '')
      }
      if (!uploadingAvatar) {
        setAvatarUrl(profile.avatar_url || '')
      }
    }
  }, [profile, user, isEditing, uploadingAvatar])

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
    // Prevent hiding default accounts
    const account = accounts.find(acc => acc.id === accountId)
    if (account?.is_default && currentStatus) {
      setError('Default account cannot be hidden')
      setTimeout(() => setError(''), 3000)
      return
    }

    if (accountVisibilityUpdating) return

    setAccountVisibilityUpdating(accountId)
    try {
      const { error } = await supabase
        .from('accounts')
        .update({ is_active: !currentStatus })
        .eq('id', accountId)

      if (error) throw error

      setAccounts(accounts.map(acc =>
        acc.id === accountId ? { ...acc, is_active: !currentStatus } : acc
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
      // Attempt to sign out
      const { error } = await supabase.auth.signOut();

      // Check for any error that is NOT the expected session missing error
      if (error && error.name !== 'AuthSessionMissingError') {
        // If it's a different, unexpected error, log it
        console.error('Unexpected error signing out:', error);
      }

    } catch (error) {
      // This will catch any other critical errors during the sign-out process
      console.error('A critical error occurred during sign out:', error);
    } finally {
      // This block will always run, ensuring the user is redirected 
      // regardless of success or the ignored error.
      navigate('/login');
    }
  };

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

  const handleExportData = async () => {
    if (exporting) return

    setExporting(true)
    setError('')
    try {
      const { data: transactions, error } = await supabase
        .from('transactions')
        .select(`
          *,
          accounts (
            id,
            name
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const exportData = transactions?.map(t => ({
        Date: formatDate(t.created_at),
        Description: t.description,
        Amount: t.amount,
        Type: t.type,
        Category: t.category,
        Account: t.accounts?.name || 'Unknown',
        Recurring: t.is_recurring ? 'Yes' : 'No',
        Frequency: t.recurring_frequency || '-'
      })) || []

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Financial Data')
      XLSX.writeFile(wb, `Traxos-Export-${formatDate(new Date())}.xlsx`)

      setSuccess('Data exported successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error exporting data:', err)
      setError(err.message || 'Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const updatePreference = async (field: string, value: any) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          [field]: value,
        })
        .select()

      if (updateError) throw updateError

      setSuccess('Preference updated!')
      setTimeout(() => setSuccess(''), 2000)

      // Refresh global state
      await refreshProfile()
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

  // const dateFormats = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']

  const TabButton = ({ name, icon: Icon }: any) => (
    <button
      onClick={() => setActiveTab(name)}
      className={`flex items-center justify-center md:justify-start space-x-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium w-full md:w-auto ${activeTab === name
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
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <PageGuide
            title="Settings & Privacy"
            description="Manage your profile, preferences, and data privacy."
            tips={[
              "Toggle Dark Mode for better nighttime visibility.",
              "Privacy Alert: Switching to the Online AI Model sends data to external servers for training/processing.",
              "Use Offline mode for 100% privacy."
            ]}
          />
        </div>
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

              {/* Password Card */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                    <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Change Password</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Update your password to keep your account secure.</p>
                  </div>
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => setShowPasswordModal(true)}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Change Password
                  </button>
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
                    className={`px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors ${!isDark
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
                    className={`px-4 py-2 rounded-lg text-sm flex items-center space-x-2 transition-colors ${isDark
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

              {/* <SettingItem icon={FileText} title="Date Format" subtitle="Choose how dates are displayed across the app.">
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
              </SettingItem> */}
              <SettingItem icon={Monitor} title="AI Model Switcher" subtitle="Show button to switch between AI and Rule Based models.">
                <div className="flex items-center justify-between">
                  <p className="text-gray-700 dark:text-gray-300">Show Model Switcher</p>
                  <button
                    onClick={() => {
                      const current = localStorage.getItem('show_model_switcher') === 'true'
                      if (!current) {
                        // Turning ON -> Show Warning
                        setShowAIModal(true)
                      } else {
                        // Turning OFF -> Just do it
                        localStorage.setItem('show_model_switcher', 'false')
                        window.dispatchEvent(new Event('settings:modelSwitcher'))
                        navigate('.', { replace: true })
                      }
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${localStorage.getItem('show_model_switcher') === 'true' ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${localStorage.getItem('show_model_switcher') === 'true' ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </SettingItem>
            </div>
          </div>
        )}

        {/* Modals */}
        <ConfirmModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          onConfirm={() => {
            localStorage.setItem('show_model_switcher', 'true')
            window.dispatchEvent(new Event('settings:modelSwitcher'))
            navigate('.', { replace: true })
            setShowAIModal(false)
          }}
          title="Enable AI Features?"
          message="By enabling AI features, you acknowledge that your conversation data may be sent to external servers for processing and training purposes. Please review our privacy policy for more details."
          confirmText="Enable & Agree"
          type="warning"
        />
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
        />

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
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notificationsEnabled ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                      } ${notificationUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
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
                <div className="flex justify-between items-center mb-4">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Default account is always visible and cannot be hidden
                  </p>
                  <button
                    onClick={handleArchiveToggle}
                    disabled={archiveToggleUpdating}
                    className={`text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium ${archiveToggleUpdating ? 'opacity-50 cursor-not-allowed' : ''
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
                          <div className="flex items-center space-x-3">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                                <span>{account.name}</span>
                                {account.is_default && (
                                  <div className="relative group">
                                    <Shield className="w-4 h-4 text-blue-500" />
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                      Default Account
                                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                                    </div>
                                  </div>
                                )}
                              </p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">{formatCurrency(account.balance)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => toggleAccountVisibility(account.id, account.is_active)}
                            disabled={accountVisibilityUpdating === account.id || (account.is_default && account.is_active)}
                            className={`flex items-center space-x-1.5 px-3 py-1 text-xs rounded-full transition-colors ${account.is_active
                              ? account.is_default
                                ? 'bg-blue-100 text-blue-800 cursor-not-allowed'
                                : 'bg-green-100 text-green-800 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                              } ${(accountVisibilityUpdating === account.id || (account.is_default && account.is_active)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {accountVisibilityUpdating === account.id ? (
                              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : account.is_active ? (
                              <>
                                {account.is_default ? (
                                  <Shield className="w-3 h-3" />
                                ) : (
                                  <Eye className="w-3 h-3" />
                                )}
                              </>
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                            <span>
                              {accountVisibilityUpdating === account.id
                                ? 'Updating...'
                                : account.is_default && account.is_active
                                  ? 'Default'
                                  : account.is_active
                                    ? 'Visible'
                                    : 'Hidden'
                              }
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
                  <button
                    onClick={handleExportData}
                    disabled={exporting}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span>{exporting ? 'Exporting...' : 'Export as Excel'}</span>
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