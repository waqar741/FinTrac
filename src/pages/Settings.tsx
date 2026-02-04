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
  MessageCircle,
  Calendar,
  List,
} from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
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

const ReauthModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', type = 'generic', loading = false }: any) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-gray-600 dark:text-gray-300 mb-4">
            {message}
          </p>

          <form onSubmit={async (e) => {
            e.preventDefault()
            const form = e.currentTarget
            const formData = new FormData(form)
            const password = formData.get('password') as string
            onConfirm(password)
          }}>
            <div className="mb-4">
              <input
                name="password"
                type="password"
                placeholder="Enter your password"
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${type === 'danger' ? 'focus:ring-red-500 focus:border-red-500' : 'focus:ring-green-500 focus:border-green-500'}`}
                required
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-4 py-2 text-white rounded-lg font-medium flex items-center ${type === 'danger'
                  ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                  : 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'}`}
              >
                {loading ? 'Processing...' : confirmText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

const ChangePasswordModal = ({ isOpen, onClose, reauthenticate }: { isOpen: boolean; onClose: () => void; reauthenticate: (password: string) => Promise<void> }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [step, setStep] = useState(1) // 1: Verify, 2: Update

  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setError('')
      setSuccess('')
      setLoading(false)
    }
  }, [isOpen])

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
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {step === 1 ? 'Verify Password' : 'Change Password'}
              </h3>
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

              if (step === 1) {
                const password = formData.get('currentPassword') as string
                try {
                  setLoading(true)
                  setError('')
                  await reauthenticate(password)
                  setStep(2)
                } catch (err: any) {
                  setError('Incorrect password')
                } finally {
                  setLoading(false)
                }
              } else {
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
              }
            }}
            className="space-y-4"
          >
            {step === 1 ? (
              <div>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  Please enter your current password to verify your identity.
                </p>
                <input
                  name="currentPassword"
                  type="password"
                  placeholder="Current Password"
                  required
                  autoFocus
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                  Identity verified. Please enter your new password.
                </p>
                <div>
                  <input
                    name="password"
                    type="password"
                    placeholder="New Password"
                    required
                    autoFocus
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
              </>
            )}

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
                {loading ? 'Processing...' : step === 1 ? 'Verify' : 'Update Password'}
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
  const { user, profile, refreshProfile, deleteAccount, updateEmail, reauthenticate } = useAuth()
  const { theme, setTheme } = useTheme()
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

  // Debts/Credits Export State
  const [showDebtsExportModal, setShowDebtsExportModal] = useState(false)
  const [debtsExportFormat, setDebtsExportFormat] = useState<'excel' | 'pdf'>('pdf')
  const [debtsExportType, setDebtsExportType] = useState<'all' | 'debts' | 'credits'>('debts') // Default to debts
  const [allPeople, setAllPeople] = useState<string[]>([])
  const [selectedPeople, setSelectedPeople] = useState<string[]>([])
  const [peoplePhones, setPeoplePhones] = useState<Record<string, string>>({}) // phone numbers by person
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [exportingDebts, setExportingDebts] = useState(false)

  // Modals
  // Modals
  const [showAIModal, setShowAIModal] = useState(false)
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showDeletePassword, setShowDeletePassword] = useState(false)
  const [deletingAccount, setDeletingAccount] = useState(false)
  const [showExportConfirm, setShowExportConfirm] = useState(false)

  // Change Email State
  const [showChangeEmail, setShowChangeEmail] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [changingEmail, setChangingEmail] = useState(false)
  const [showReauthForEmail, setShowReauthForEmail] = useState(false)

  // Click protection states
  const [themeChanging, setThemeChanging] = useState(false)
  const [notificationUpdating, setNotificationUpdating] = useState(false)
  const [accountVisibilityUpdating, setAccountVisibilityUpdating] = useState<string | null>(null)
  const [archiveToggleUpdating, setArchiveToggleUpdating] = useState(false)
  const [transactionViewMode, setTransactionViewMode] = useState<'list' | 'calendar'>(() => {
    const saved = localStorage.getItem('transaction_view_mode')
    return (saved === 'calendar' ? 'calendar' : 'list') as 'list' | 'calendar'
  })
  const [viewModeUpdating, setViewModeUpdating] = useState(false)

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

      // Add column widths
      const wscols = [
        { wch: 15 }, // Date
        { wch: 30 }, // Description
        { wch: 15 }, // Amount
        { wch: 10 }, // Type
        { wch: 20 }, // Category
        { wch: 20 }, // Account
        { wch: 10 }, // Recurring
        { wch: 15 }, // Frequency
      ]
      ws['!cols'] = wscols

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

  // Open Debts/Credits export modal and fetch people list
  const openDebtsExportModal = async () => {
    setShowDebtsExportModal(true)
    setLoadingPeople(true)
    setSelectedPeople([])
    setPeoplePhones({})
    try {
      // Query person_name (and phone_number if column exists)
      // Note: phone_number column needs to be added via SQL: 
      // ALTER TABLE debts_credits ADD COLUMN phone_number TEXT DEFAULT NULL;
      const { data, error } = await supabase
        .from('debts_credits')
        .select('person_name')
        .eq('user_id', user?.id)

      if (error) throw error

      // Get unique person names
      const phoneMap: Record<string, string> = {}
      const uniquePeople = [...new Set(data?.map(d => d.person_name) || [])]

      setAllPeople(uniquePeople)
      setSelectedPeople(uniquePeople) // Select all by default
      setPeoplePhones(phoneMap) // Empty for now - will populate once phone_number column is added
    } catch (err: any) {
      console.error('Error loading people:', err)
      setError('Failed to load people list')
      setShowDebtsExportModal(false)
    } finally {
      setLoadingPeople(false)
    }
  }

  // Toggle person selection
  const togglePersonSelection = (personName: string) => {
    setSelectedPeople(prev =>
      prev.includes(personName)
        ? prev.filter(p => p !== personName)
        : [...prev, personName]
    )
  }

  // Select/Deselect all people
  const toggleSelectAll = () => {
    if (selectedPeople.length === allPeople.length) {
      setSelectedPeople([])
    } else {
      setSelectedPeople([...allPeople])
    }
  }

  // Export Debts/Credits data based on selection
  const handleExportDebtsCredits = async () => {
    if (exportingDebts || selectedPeople.length === 0) return

    setExportingDebts(true)
    setError('')
    try {
      // Fetch debts/credits for selected people
      let query = supabase
        .from('debts_credits')
        .select('*')
        .eq('user_id', user?.id)
        .in('person_name', selectedPeople)
        .order('created_at', { ascending: false })

      // Apply type filter
      if (debtsExportType === 'debts') {
        query = query.eq('type', 'debt')
      } else if (debtsExportType === 'credits') {
        query = query.eq('type', 'credit')
      }

      const { data: records, error } = await query

      if (error) throw error

      if (!records || records.length === 0) {
        setError('No records found to export')
        setExportingDebts(false)
        return
      }

      // Calculate totals
      const totalDebts = records.filter(r => r.type === 'debt').reduce((sum, r) => sum + r.amount, 0)
      const totalCredits = records.filter(r => r.type === 'credit').reduce((sum, r) => sum + r.amount, 0)
      const netBalance = totalCredits - totalDebts

      const exportData = records.map(r => ({
        'Person Name': r.person_name,
        'Amount': r.amount,
        'Type': r.type === 'debt' ? 'You Owe' : 'Owes You',
        'Description': r.description || '-',
        'Due Date': r.due_date ? formatDate(r.due_date) : '-',
        'Status': r.is_settled ? 'Settled' : 'Pending',
        'Created': formatDate(r.created_at)
      }))

      const typeLabel = debtsExportType === 'all' ? 'All' : debtsExportType === 'debts' ? 'Debts' : 'Credits'
      const peopleLabel = selectedPeople.length === allPeople.length ? 'All' : `${selectedPeople.length}People`

      if (debtsExportFormat === 'excel') {
        // Excel export
        const ws = XLSX.utils.json_to_sheet(exportData)
        const wscols = [
          { wch: 20 }, // Person Name
          { wch: 15 }, // Amount
          { wch: 12 }, // Type
          { wch: 30 }, // Description
          { wch: 15 }, // Due Date
          { wch: 10 }, // Status
          { wch: 15 }, // Created
        ]
        ws['!cols'] = wscols
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Debts Credits')
        XLSX.writeFile(wb, `Traxos-${typeLabel}-${peopleLabel}-${formatDate(new Date())}.xlsx`)
      } else {
        // PDF export - same styling as Transactions page
        const doc = new jsPDF()
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()

        // --- Branding & Header ---
        // Green Banner (same as Transactions)
        doc.setFillColor(34, 197, 94) // Tailwind Green-500 (#22c55e)
        doc.rect(0, 0, pageWidth, 40, 'F')

        // Logo / Title
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(24)
        doc.setFont('helvetica', 'bold')
        doc.text('TRAXOS', 20, 25)

        doc.setFontSize(10)
        doc.setFont('helvetica', 'normal')
        doc.text('Debts & Credits Report', 20, 32)

        // Date Info (Right side of Banner)
        doc.text(`Generated: ${formatDate(new Date())}`, pageWidth - 20, 25, { align: 'right' })
        doc.text(`Records: ${records.length}`, pageWidth - 20, 32, { align: 'right' })

        // --- Summary Section ---
        const colY = 55
        const margin = 20
        const gap = 10
        const availableWidth = pageWidth - (margin * 2)
        const cardWidth = (availableWidth - (gap * 2)) / 3

        // Helper to draw summary card (same as Transactions)
        const drawCard = (x: number, title: string, amount: number, color: [number, number, number]) => {
          // Card Background
          doc.setFillColor(249, 250, 251) // Gray-50
          doc.setDrawColor(229, 231, 235) // Gray-200
          doc.roundedRect(x, colY, cardWidth, 25, 3, 3, 'FD')

          // Title
          doc.setTextColor(107, 114, 128) // Gray-500
          doc.setFontSize(8)
          doc.setFont('helvetica', 'bold')
          doc.text(title.toUpperCase(), x + 5, colY + 8)

          // Amount
          doc.setTextColor(color[0], color[1], color[2])
          doc.setFontSize(12)
          doc.text(`${currency} ${amount.toFixed(2)}`, x + 5, colY + 18)
        }

        drawCard(margin, 'TOTAL DEBTS', totalDebts, [220, 38, 38]) // Red-600
        drawCard(margin + cardWidth + gap, 'TOTAL CREDITS', totalCredits, [22, 163, 74]) // Green-600
        drawCard(margin + (cardWidth + gap) * 2, 'NET BALANCE', netBalance, netBalance >= 0 ? [22, 163, 74] : [220, 38, 38])

        // --- Table ---
        const tableBody = exportData.map(r => [
          r['Created'],
          r['Person Name'],
          r['Description'],
          r['Type'],
          r['Status'],
          r['Amount'].toString()
        ])

        autoTable(doc, {
          startY: 90,
          head: [['Date', 'Person', 'Description', 'Type', 'Status', 'Amount']],
          body: tableBody,
          theme: 'grid',
          headStyles: {
            fillColor: [6, 78, 59], // Emerald-900 (Dark Green)
            textColor: [255, 255, 255],
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [240, 253, 244] // Green-50
          },
          styles: {
            font: 'helvetica',
            fontSize: 9,
            cellPadding: 3
          },
          columnStyles: {
            5: { halign: 'right' } // Amount aligned right
          },
          didDrawPage: () => {
            // Footer on each page
            const pageCount = doc.getNumberOfPages()
            doc.setFontSize(8)
            doc.setTextColor(156, 163, 175) // Gray-400
            doc.text(
              `Generated by Traxos Finance - Page ${pageCount}`,
              margin,
              pageHeight - 10
            )
          }
        })

        doc.save(`Traxos-${typeLabel}-${peopleLabel}-${formatDate(new Date())}.pdf`)
      }

      setSuccess('Debts/Credits exported successfully!')
      setShowDebtsExportModal(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err: any) {
      console.error('Error exporting debts/credits:', err)
      setError(err.message || 'Failed to export debts/credits')
    } finally {
      setExportingDebts(false)
    }
  }

  // Share via WhatsApp - generates file and opens WhatsApp
  const handleShareWhatsApp = async () => {
    if (selectedPeople.length !== 1) {
      setError('Please select exactly one person to share via WhatsApp')
      return
    }

    const personName = selectedPeople[0]
    const phoneNumber = peoplePhones[personName]

    if (!phoneNumber) {
      setError(`No phone number found for ${personName}. Please add their phone number in Debts & Credits page.`)
      return
    }

    // First export the file
    await handleExportDebtsCredits()

    // Calculate totals for message
    const { data: records } = await supabase
      .from('debts_credits')
      .select('*')
      .eq('user_id', user?.id)
      .eq('person_name', personName)
      .eq('is_settled', false)

    const debtsTotal = records?.filter(r => r.type === 'debt').reduce((sum, r) => sum + r.amount, 0) || 0
    const creditsTotal = records?.filter(r => r.type === 'credit').reduce((sum, r) => sum + r.amount, 0) || 0

    // Generate message based on export type
    let message = ''
    if (debtsExportType === 'debts') {
      message = `Hi ${personName}! 👋\n\nThis is a reminder about the amount I owe you.\n\n💰 Total Due: ${currency} ${debtsTotal.toFixed(2)}\n\nPlease find the attached statement from Traxos Finance.\n\nThank you! 🙏`
    } else if (debtsExportType === 'credits') {
      message = `Hi ${personName}! 👋\n\nThis is a friendly reminder about your pending payment.\n\n💳 Amount Due: ${currency} ${creditsTotal.toFixed(2)}\n\nPlease find the attached statement from Traxos Finance.\n\nKindly settle at your earliest convenience. Thank you! 🙏`
    } else {
      // All
      const net = creditsTotal - debtsTotal
      message = `Hi ${personName}! 👋\n\nHere's our financial summary:\n\n📊 You owe me: ${currency} ${creditsTotal.toFixed(2)}\n📊 I owe you: ${currency} ${debtsTotal.toFixed(2)}\n💰 Net Balance: ${currency} ${Math.abs(net).toFixed(2)} ${net >= 0 ? '(you owe me)' : '(I owe you)'}\n\nPlease find the attached statement from Traxos Finance.\n\nThank you! 🙏`
    }

    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = phoneNumber.replace(/[\s\-\(\)]/g, '').replace(/^\+/, '')

    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')

    setSuccess('PDF downloaded! Please attach it in WhatsApp.')
    setShowDebtsExportModal(false)
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

  // Theme change handler
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    if (themeChanging) return

    setThemeChanging(true)
    try {
      setTheme(newTheme)
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

  // Transaction view mode toggle handler (uses localStorage)
  const handleViewModeChange = (mode: 'list' | 'calendar') => {
    if (viewModeUpdating || transactionViewMode === mode) return

    setViewModeUpdating(true)
    setTransactionViewMode(mode)
    localStorage.setItem('transaction_view_mode', mode)
    // Dispatch event so Transactions page can react
    window.dispatchEvent(new Event('settings:viewModeChange'))
    setViewModeUpdating(false)
  }

  return (
    <div className="p-4 md:p-8 pb-24 space-y-8 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header>
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <PageGuide
            title="Settings & Privacy"
            description="Manage your profile, preferences, and data privacy."
            tips={[
              "Toggle Dark Mode for better nighttime visibility.",
              <span key="masking">Security: Online AI Model (Green) uses strict data masking. <a href="/docs/Traxos-Technical-Data-Processing-Guide.pdf" target="_blank" className="underline hover:text-green-600">Read our Data Processing Docs.</a></span>,
              "Rule Based AI (Blue) runs entirely on your device for maximum privacy."
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
                <div className="mt-6">
                  {!showChangeEmail ? (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 dark:text-white">{profile?.email || user?.email}</span>
                      <button
                        onClick={() => setShowChangeEmail(true)}
                        className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                      >
                        Change Email
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="Enter new email"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            if (!newEmail || !/^\S+@\S+$/.test(newEmail)) {
                              setError('Please enter a valid email')
                              return
                            }
                            setError('')
                            setShowReauthForEmail(true)
                          }}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          Update Email
                        </button>
                        <button
                          onClick={() => {
                            setShowChangeEmail(false)
                            setNewEmail('')
                            setError('')
                          }}
                          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-sm font-medium"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
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
              <SettingItem icon={Monitor} title="Theme" subtitle="Switch between light, dark, and system theme.">
                <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg w-full sm:w-[300px]">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${theme === 'light'
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    <Sun className="w-4 h-4" />
                    <span className="hidden xs:inline">Light</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${theme === 'dark'
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    <Moon className="w-4 h-4" />
                    <span className="hidden xs:inline">Dark</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange('system')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 ${theme === 'system'
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    <Monitor className="w-4 h-4" />
                    <span className="hidden xs:inline">System</span>
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

              <SettingItem icon={Calendar} title="Transaction View" subtitle="Choose how transactions are displayed on the Transactions page.">
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => handleViewModeChange('list')}
                    disabled={viewModeUpdating}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 flex-1 ${transactionViewMode === 'list'
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    <List className="w-4 h-4" />
                    <span>List</span>
                  </button>
                  <button
                    onClick={() => handleViewModeChange('calendar')}
                    disabled={viewModeUpdating}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 flex-1 ${transactionViewMode === 'calendar'
                      ? 'bg-white dark:bg-gray-600 shadow-sm text-green-600 dark:text-green-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                      }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Calendar</span>
                  </button>
                </div>
                {viewModeUpdating && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Updating view mode...</p>
                )}
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
              <SettingItem icon={Monitor} title="AI Model Switcher" subtitle="Enable to allow switching between AI and Rule Based models. Disabling this restricts Chat to Rule Based mode.">
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
          message={
            <span>
              By enabling AI features, your queries will be processed by external servers. Your personal data (Names, Accounts, Identities) is strictly masked and anonymized before sending to ensure your privacy.
              <br /><br />
              <a href="/docs/Traxos-Technical-Data-Processing-Guide.pdf" target="_blank" className="text-blue-600 hover:underline dark:text-blue-400">
                View Payload Processing Documentation
              </a>
            </span>
          }
          confirmText="Enable & Agree"
          type="warning"
        />
        <ChangePasswordModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          reauthenticate={reauthenticate}
        />

        <ReauthModal
          isOpen={showReauthForEmail}
          onClose={() => setShowReauthForEmail(false)}
          title="Verify Password"
          message="Please enter your password to confirm email change."
          confirmText="Confirm Change"
          loading={changingEmail}
          onConfirm={async (password: string) => {
            setChangingEmail(true)
            try {
              await reauthenticate(password)
              await updateEmail(newEmail)
              setSuccess('Confirmation link sent to both emails!')
              setShowReauthForEmail(false)
              setShowChangeEmail(false)
              setNewEmail('')
            } catch (err: any) {
              // Reauth error or Update error
              // If reauth failed, it throws 'Incorrect password' 
              // We need to show that in the modal if possible, or global error
              setError(err.message || 'Failed to update email')
              setShowReauthForEmail(false) // Close modal to show generic error? Or keep open?
              // Ideally keep open and show error INSIDE modal, but simplistic implementation here:
            } finally {
              setChangingEmail(false)
            }
          }}
        />

        <ConfirmModal
          isOpen={showExportConfirm}
          onClose={() => setShowExportConfirm(false)}
          onConfirm={() => {
            setShowExportConfirm(false)
            handleExportData()
          }}
          title="Export Data?"
          message="This will download all your financial data (Transactions, Debt & Credits) as an Excel file."
          confirmText="Yes, Export"
          type="info"
        />

        {/* Delete Account Confirmation Steps */}
        {/* Step 1: Initial Warning */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            setShowDeleteConfirm(false)
            setShowDeletePassword(true)
          }}
          title="Delete Account?"
          message="This action cannot be undone. This will permanently delete your account and remove your data from our servers."
          confirmText="Yes, delete my account"
          type="danger"
        />

        {/* Step 2: Password Verification */}
        {showDeletePassword && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Verify Password</h3>
                  <button
                    onClick={() => setShowDeletePassword(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Please enter your password to confirm account deletion.
                </p>

                <form onSubmit={async (e) => {
                  e.preventDefault()
                  const form = e.currentTarget
                  const formData = new FormData(form)
                  const password = formData.get('password') as string

                  if (!password) {
                    setError('Password is required')
                    return
                  }

                  setDeletingAccount(true)
                  try {
                    await deleteAccount(password)
                    // Navigation handled in AuthContext but failsafe here
                    navigate('/login')
                  } catch (err: any) {
                    setError(err.message || 'Failed to delete account')
                    setDeletingAccount(false)
                  }
                }}>
                  <div className="mb-4">
                    <input
                      name="password"
                      type="password"
                      placeholder="Enter your password"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(false)}
                      disabled={deletingAccount}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={deletingAccount}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-red-400 font-medium flex items-center"
                    >
                      {deletingAccount ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>
                </form>
              </div>
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

              <SettingItem icon={MessageCircle} title="AI Chat Bot" subtitle="Show or hide the AI assistant icon on your screen.">
                <div className="flex items-center justify-between">
                  <p className="text-gray-700 dark:text-gray-300">Show AI Chat Icon</p>
                  <button
                    onClick={() => {
                      const current = localStorage.getItem('show_ai_chat')
                      const newValue = current === null ? false : current !== 'true' // Default is true, so toggle removes it
                      localStorage.setItem('show_ai_chat', String(newValue))
                      window.dispatchEvent(new Event('settings:aiChatVisibility'))
                      // Force re-render of this button by updating state or just relying on React re-render from parent if triggered? 
                      // Actually, this simple local toggle won't re-render THIS component's state unless we force it.
                      // Let's us navigate to force refresh or use a local state.
                      // Using navigate to same page is a cheap way to refresh, consistent with other settings here.
                      navigate('.', { replace: true })
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${(localStorage.getItem('show_ai_chat') === null || localStorage.getItem('show_ai_chat') === 'true')
                      ? 'bg-green-600'
                      : 'bg-gray-300 dark:bg-gray-600'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${(localStorage.getItem('show_ai_chat') === null || localStorage.getItem('show_ai_chat') === 'true')
                        ? 'translate-x-6'
                        : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
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
                    onClick={() => setShowExportConfirm(true)}
                    disabled={exporting}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {exporting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span>{exporting ? 'Exporting...' : 'Export Transactions (Excel)'}</span>
                  </button>
                </div>
              </SettingItem>

              {/* Debts/Credits Export */}
              <SettingItem icon={Wallet} title="Export Debts & Credits" subtitle="Select people and download as Excel or PDF.">
                <button
                  onClick={openDebtsExportModal}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>Select & Export</span>
                </button>
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
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 transition-colors text-sm font-medium"
                  >
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

      {/* Debts/Credits Export Modal */}
      {showDebtsExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Export Debts & Credits</h3>
              <button
                onClick={() => setShowDebtsExportModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              {loadingPeople ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : allPeople.length === 0 ? (
                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No debts or credits found.</p>
              ) : (
                <div className="space-y-4">
                  {/* Select All */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select People</span>
                    <button
                      onClick={toggleSelectAll}
                      className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 font-medium"
                    >
                      {selectedPeople.length === allPeople.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  {/* People List */}
                  <div className="space-y-2">
                    {allPeople.map((person) => (
                      <label
                        key={person}
                        className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={selectedPeople.includes(person)}
                          onChange={() => togglePersonSelection(person)}
                          className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="text-gray-900 dark:text-white font-medium">{person}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Format Selection & Export Button */}
            {allPeople.length > 0 && !loadingPeople && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Record Type</label>
                  <div className="flex gap-2">
                    {(['all', 'debts', 'credits'] as const).map((type) => (
                      <button
                        key={type}
                        onClick={() => setDebtsExportType(type)}
                        className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${debtsExportType === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                          }`}
                      >
                        {type === 'all' ? 'All' : type === 'debts' ? 'Debts Only' : 'Credits Only'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Export Format</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDebtsExportFormat('excel')}
                      className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${debtsExportFormat === 'excel'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      <FileText className="w-4 h-4" />
                      <span>Excel</span>
                    </button>
                    <button
                      onClick={() => setDebtsExportFormat('pdf')}
                      className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 text-sm rounded-lg transition-colors ${debtsExportFormat === 'pdf'
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                    >
                      <Download className="w-4 h-4" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>

                {/* Export Button */}
                <button
                  onClick={handleExportDebtsCredits}
                  disabled={exportingDebts || selectedPeople.length === 0}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exportingDebts ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-5 h-5" />
                  )}
                  <span>
                    {exportingDebts
                      ? 'Exporting...'
                      : `Download ${selectedPeople.length} ${selectedPeople.length === 1 ? 'Person' : 'People'}`}
                  </span>
                </button>

                {/* WhatsApp Share Button */}
                <button
                  onClick={handleShareWhatsApp}
                  disabled={exportingDebts || selectedPeople.length !== 1 || !peoplePhones[selectedPeople[0]]}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>
                    {selectedPeople.length === 1 && peoplePhones[selectedPeople[0]]
                      ? `Share via WhatsApp to ${selectedPeople[0]}`
                      : selectedPeople.length === 1
                        ? 'No phone number for this person'
                        : 'Select 1 person for WhatsApp'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}