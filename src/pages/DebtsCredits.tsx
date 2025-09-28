import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useForm } from 'react-hook-form'
import { Plus, User, X, Calendar, DollarSign } from 'lucide-react'
import { format } from 'date-fns'

interface DebtCredit {
  id: string
  person_name: string
  amount: number
  type: 'debt' | 'credit' // debt = you owe them, credit = they owe you
  description: string
  due_date: string | null
  is_settled: boolean
  created_at: string
}

interface DebtCreditForm {
  person_name: string
  amount: number
  type: 'debt' | 'credit'
  description: string
  due_date: string
}

export default function DebtsCredits() {
  const { user } = useAuth()
  const [debtsCredits, setDebtsCredits] = useState<DebtCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DebtCredit | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError
  } = useForm<DebtCreditForm>()

  useEffect(() => {
    if (user) {
      fetchDebtsCredits()
    }
  }, [user])

  const fetchDebtsCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('debts_credits')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      if (data) setDebtsCredits(data)
    } catch (error) {
      console.error('Error fetching debts/credits:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: DebtCreditForm) => {
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('debts_credits')
          .update({
            person_name: data.person_name,
            amount: data.amount,
            type: data.type,
            description: data.description,
            due_date: data.due_date || null
          })
          .eq('id', editingItem.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('debts_credits')
          .insert({
            user_id: user?.id,
            person_name: data.person_name,
            amount: data.amount,
            type: data.type,
            description: data.description,
            due_date: data.due_date || null,
            is_settled: false
          })

        if (error) throw error
      }

      await fetchDebtsCredits()
      handleCloseModal()
    } catch (error: any) {
      setError('root', { message: error.message })
    }
  }

  const toggleSettled = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('debts_credits')
        .update({ is_settled: !currentStatus })
        .eq('id', id)

      if (error) throw error
      await fetchDebtsCredits()
    } catch (error) {
      console.error('Error updating settlement status:', error)
    }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return

    try {
      const { error } = await supabase
        .from('debts_credits')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchDebtsCredits()
    } catch (error) {
      console.error('Error deleting item:', error)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingItem(null)
    reset()
  }

  const handleEditItem = (item: DebtCredit) => {
    setEditingItem(item)
    reset({
      person_name: item.person_name,
      amount: item.amount,
      type: item.type,
      description: item.description,
      due_date: item.due_date ? format(new Date(item.due_date), 'yyyy-MM-dd') : ''
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

  const debts = debtsCredits.filter(item => item.type === 'debt' && !item.is_settled)
  const credits = debtsCredits.filter(item => item.type === 'credit' && !item.is_settled)
  const settled = debtsCredits.filter(item => item.is_settled)

  const totalDebt = debts.reduce((sum, item) => sum + item.amount, 0)
  const totalCredit = credits.reduce((sum, item) => sum + item.amount, 0)

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Debts & Credits</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Track who owes you and who you owe</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">You Owe</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(totalDebt)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{debts.length} people</p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-full">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Others Owe You</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(totalCredit)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{credits.length} people</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Net Balance</p>
              <p className={`text-2xl font-bold mt-1 ${
                totalCredit - totalDebt >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatCurrency(totalCredit - totalDebt)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {totalCredit >= totalDebt ? 'In your favor' : 'You owe more'}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* You Owe (Debts) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">You Owe</h2>
          <div className="space-y-3">
            {debts.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No outstanding debts</p>
            ) : (
              debts.map((debt) => (
                <div key={debt.id} className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{debt.person_name}</h3>
                    <span className="text-lg font-bold text-red-600">{formatCurrency(debt.amount)}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{debt.description}</p>
                  {debt.due_date && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Due: {format(new Date(debt.due_date), 'MMM d, yyyy')}
                    </p>
                  )}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleSettled(debt.id, debt.is_settled)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                    >
                      Mark as Paid
                    </button>
                    <button
                      onClick={() => handleEditItem(debt)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteItem(debt.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Others Owe You (Credits) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Others Owe You</h2>
          <div className="space-y-3">
            {credits.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No outstanding credits</p>
            ) : (
              credits.map((credit) => (
                <div key={credit.id} className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/10">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{credit.person_name}</h3>
                    <span className="text-lg font-bold text-green-600">{formatCurrency(credit.amount)}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{credit.description}</p>
                  {credit.due_date && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Due: {format(new Date(credit.due_date), 'MMM d, yyyy')}
                    </p>
                  )}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleSettled(credit.id, credit.is_settled)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 transition-colors"
                    >
                      Mark as Received
                    </button>
                    <button
                      onClick={() => handleEditItem(credit)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteItem(credit.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Settled Items */}
      {settled.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settled ({settled.length})</h2>
          <div className="space-y-3">
            {settled.map((item) => (
              <div key={item.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 opacity-75">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{item.person_name}</h3>
                  <span className="text-lg font-bold text-gray-600 dark:text-gray-300">{formatCurrency(item.amount)}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.description}</p>
                <div className="flex items-center justify-between">
                  <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                    ✓ Settled
                  </span>
                  <button
                    onClick={() => toggleSettled(item.id, item.is_settled)}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    Mark as Unsettled
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingItem ? 'Edit Entry' : 'Add Debt/Credit'}
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
                  Person Name
                </label>
                <input
                  {...register('person_name', { required: 'Person name is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="John Doe"
                />
                {errors.person_name && (
                  <p className="text-red-500 text-sm mt-1">{errors.person_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="debt">I owe them</option>
                  <option value="credit">They owe me</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (₹)
                </label>
                <input
                  {...register('amount', { 
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="1000"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  {...register('description', { required: 'Description is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Lunch money, loan, etc."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Due Date (Optional)
                </label>
                <input
                  {...register('due_date')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
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
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingItem ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}