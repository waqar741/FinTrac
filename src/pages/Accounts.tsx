import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useForm } from 'react-hook-form'
import { Plus, Wallet, CreditCard, Banknote, Smartphone, Users, X, CreditCard as Edit2, Trash2, ArrowRightLeft, Loader } from 'lucide-react'

interface Account {
  id: string
  name: string
  type: string
  balance: number
  currency: string
  color: string
  is_active: boolean
  created_at: string
}

interface AccountForm {
  name: string
  type: string
  balance: number
  color: string
}

interface TransferForm {
  from_account_id: string
  to_account_id: string
  amount: number
  description: string
}

export default function Accounts() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(null) // NEW: Track deleting state

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError
  } = useForm<AccountForm>()

  const {
    register: registerTransfer,
    handleSubmit: handleTransferSubmit,
    reset: resetTransfer,
    formState: { errors: transferErrors, isSubmitting: transferIsSubmitting },
    setError: setTransferError
  } = useForm<TransferForm>()

  useEffect(() => {
    if (user) {
      fetchAccounts()
    }
  }, [user])

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setAccounts(data)
    } catch (error) {
      console.error('Error fetching accounts:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: AccountForm) => {
    try {
      if (editingAccount) {
        const { error } = await supabase
          .from('accounts')
          .update({
            name: data.name,
            type: data.type,
            balance: data.balance,
            color: data.color
          })
          .eq('id', editingAccount.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('accounts')
          .insert({
            user_id: user?.id,
            name: data.name,
            type: data.type,
            balance: data.balance,
            color: data.color
          })

        if (error) throw error
      }

      await fetchAccounts()
      handleCloseModal()
    } catch (error: any) {
      setError('root', { message: error.message })
    }
  }

  const onTransferSubmit = async (data: TransferForm) => {
    try {
      if (data.from_account_id === data.to_account_id) {
        setTransferError('root', { message: 'From and To accounts must be different' })
        return
      }

      const fromAccount = accounts.find(a => a.id === data.from_account_id)
      if (fromAccount && fromAccount.balance < data.amount) {
        setTransferError('root', { message: 'Insufficient balance in from account' })
        return
      }

      const { error } = await supabase
        .from('transfers')
        .insert({
          user_id: user?.id,
          from_account_id: data.from_account_id,
          to_account_id: data.to_account_id,
          amount: data.amount,
          description: data.description
        })

      if (error) throw error

      // Update account balances
      const toAccount = accounts.find(a => a.id === data.to_account_id)

      if (fromAccount && toAccount) {
        await Promise.all([
          supabase
            .from('accounts')
            .update({ balance: fromAccount.balance - data.amount })
            .eq('id', data.from_account_id),
          supabase
            .from('accounts')
            .update({ balance: toAccount.balance + data.amount })
            .eq('id', data.to_account_id)
        ])
      }

      await fetchAccounts()
      setShowTransferModal(false)
      resetTransfer()
    } catch (error: any) {
      setTransferError('root', { message: error.message })
    }
  }

  const deleteAccount = async (id: string) => {
    // Prevent multiple clicks
    if (deletingAccountId === id) {
      return; // Already deleting this account
    }

    if (!confirm('Are you sure you want to delete this account? This will permanently delete the account and all associated transactions.')) return

    try {
      // Set deleting state to prevent multiple clicks
      setDeletingAccountId(id);

      // Hard delete
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchAccounts()
    } catch (error: any) {
      console.error('Error deleting account:', error)
      alert(`Error deleting account: ${error.message}`)
    } finally {
      // Always reset deleting state, whether success or error
      setDeletingAccountId(null);
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAccount(null)
    reset()
  }

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account)
    reset({
      name: account.name,
      type: account.type,
      balance: account.balance,
      color: account.color
    })
    setShowModal(true)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'bank': return Wallet
      case 'cash': return Banknote
      case 'wallet': return Smartphone
      case 'credit_card': return CreditCard
      case 'other': return Users
      default: return Wallet
    }
  }

  const accountTypes = [
    { value: 'bank', label: 'Bank Account' },
    { value: 'cash', label: 'Cash' },
    { value: 'wallet', label: 'Digital Wallet' },
    { value: 'credit_card', label: 'Credit Card' },
    { value: 'investment', label: 'Investment' },
    { value: 'savings', label: 'Savings' },
    { value: 'other', label: 'Other' }
  ]

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ]

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your money sources and balances</p>
        </div>
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowTransferModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Transfer
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Account
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 rounded-xl p-6 text-white">
        <h2 className="text-lg font-medium opacity-90">Total Balance</h2>
        <p className="text-3xl font-bold mt-2">{formatCurrency(totalBalance)}</p>
        <p className="text-sm opacity-75 mt-1">{accounts.length} active accounts</p>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No accounts created yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 text-green-600 hover:text-green-700 font-medium"
            >
              Create your first account
            </button>
          </div>
        ) : (
          accounts.map((account) => {
            const IconComponent = getAccountIcon(account.type)
            const isDeleting = deletingAccountId === account.id // NEW: Check if this account is being deleted
            
            return (
              <div key={account.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="p-3 rounded-full"
                      style={{ backgroundColor: account.color + '20' }}
                    >
                      <IconComponent 
                        className="w-6 h-6"
                        style={{ color: account.color }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{account.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {accountTypes.find(t => t.value === account.type)?.label || account.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditAccount(account)}
                      disabled={isDeleting} // NEW: Disable when deleting
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Edit account"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteAccount(account.id)}
                      disabled={isDeleting} // NEW: Disable when already deleting
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Delete account"
                    >
                      {isDeleting ? ( // NEW: Show loader when deleting
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className={`text-2xl font-bold ${
                    account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(account.balance)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {account.currency}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingAccount ? 'Edit Account' : 'Add Account'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Name
                </label>
                <input
                  {...register('name', { required: 'Account name is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Main Bank Account"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account Type
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  {accountTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Initial Balance (₹)
                </label>
                <input
                  {...register('balance', { 
                    required: 'Balance is required',
                    valueAsNumber: true
                  })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="10000"
                />
                {errors.balance && (
                  <p className="text-red-500 text-sm mt-1">{errors.balance.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <label key={color} className="cursor-pointer">
                      <input
                        {...register('color')}
                        type="radio"
                        value={color}
                        className="sr-only"
                      />
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                        style={{ backgroundColor: color }}
                      />
                    </label>
                  ))}
                </div>
              </div>

              {errors.root && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-700 dark:text-red-400 text-sm">{errors.root.message}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : (editingAccount ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Transfer Funds</h2>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit(onTransferSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Account
                </label>
                <select
                  {...registerTransfer('from_account_id', { required: 'From account is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
                {transferErrors.from_account_id && (
                  <p className="text-red-500 text-sm mt-1">{transferErrors.from_account_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  To Account
                </label>
                <select
                  {...registerTransfer('to_account_id', { required: 'To account is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
                {transferErrors.to_account_id && (
                  <p className="text-red-500 text-sm mt-1">{transferErrors.to_account_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (₹)
                </label>
                <input
                  {...registerTransfer('amount', { 
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' },
                    valueAsNumber: true
                  })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="1000"
                />
                {transferErrors.amount && (
                  <p className="text-red-500 text-sm mt-1">{transferErrors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <input
                  {...registerTransfer('description')}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Transfer reason"
                />
              </div>

              {transferErrors.root && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-700 dark:text-red-400 text-sm">{transferErrors.root.message}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={transferIsSubmitting}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {transferIsSubmitting ? 'Transferring...' : 'Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}