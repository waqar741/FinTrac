import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useForm } from 'react-hook-form'
import { Plus, CreditCard as Edit2, Trash2, X } from 'lucide-react'

interface Budget {
  id: string
  name: string
  type: 'master' | 'sub'
  parent_id: string | null
  allocated_amount: number
  current_balance: number
  color: string
}

interface BudgetForm {
  name: string
  type: 'master' | 'sub'
  parent_id: string
  allocated_amount: number
  color: string
}

export default function Budgets() {
  const { user } = useAuth()
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    setError
  } = useForm<BudgetForm>()

  const budgetType = watch('type', 'sub')

  useEffect(() => {
    if (user) {
      fetchBudgets()
    }
  }, [user])

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const budgetIds = data.map(b => b.id)
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select('budget_id, amount, type')
          .eq('user_id', user?.id)
          .in('budget_id', budgetIds)

        if (txError) throw txError

        const updatedBudgets = data.map(budget => {
          const expenses = transactions
            .filter(t => t.budget_id === budget.id && t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0)
          const currentBalance = Math.max(budget.allocated_amount - expenses, 0)
          return { ...budget, current_balance: currentBalance }
        })

        setBudgets(updatedBudgets)
      }
    } catch (error) {
      console.error('Error fetching budgets:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: BudgetForm) => {
    try {
      if (editingBudget) {
        const { error } = await supabase
          .from('budgets')
          .update({
            name: data.name,
            type: data.type,
            parent_id: data.type === 'sub' ? data.parent_id : null,
            allocated_amount: data.allocated_amount,
            color: data.color
          })
          .eq('id', editingBudget.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('budgets')
          .insert({
            user_id: user?.id,
            name: data.name,
            type: data.type,
            parent_id: data.type === 'sub' ? data.parent_id : null,
            allocated_amount: data.allocated_amount,
            current_balance: data.allocated_amount,
            color: data.color
          })

        if (error) throw error
      }

      await fetchBudgets()
      handleCloseModal()
    } catch (error: any) {
      setError('root', { message: error.message })
    }
  }

  const deleteBudget = async (id: string) => {
    if (!confirm('Are you sure you want to delete this budget?')) return

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchBudgets()
    } catch (error) {
      console.error('Error deleting budget:', error)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingBudget(null)
    reset()
  }

  const handleEditBudget = (budget: Budget) => {
    setEditingBudget(budget)
    reset({
      name: budget.name,
      type: budget.type,
      parent_id: budget.parent_id || '',
      allocated_amount: budget.allocated_amount,
      color: budget.color
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

  const masterBudgets = budgets.filter(b => b.type === 'master')
  const subBudgets = budgets.filter(b => b.type === 'sub')

  const colorOptions = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
    '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
  ]

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Budget Management</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Create and manage your budgets</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Budget
        </button>
      </div>

      {/* Master Budgets */}
      {masterBudgets.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Master Budgets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {masterBudgets.map((budget) => {
              const spent = Math.max(budget.allocated_amount - budget.current_balance, 0)
              return (
                <div key={budget.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: budget.color }}
                      />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{budget.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBudget(budget.id)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Available</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(budget.current_balance)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Added</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(budget.allocated_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Spent</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(spent)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Usage</span>
                      <span>
                        {budget.allocated_amount > 0 
                          ? Math.round((spent / budget.allocated_amount) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          backgroundColor: budget.color,
                          width: `${budget.allocated_amount > 0 
                            ? Math.min((spent / budget.allocated_amount) * 100, 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sub Budgets */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {masterBudgets.length > 0 ? 'Sub Budgets' : 'Budgets'}
        </h2>
        {subBudgets.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <p className="text-gray-500 dark:text-gray-400">No budgets created yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 text-green-600 hover:text-green-700 font-medium"
            >
              Create your first budget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subBudgets.map((budget) => {
              const spent = Math.max(budget.allocated_amount - budget.current_balance, 0)
              return (
                <div key={budget.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: budget.color }}
                      />
                      <h3 className="font-semibold text-gray-900 dark:text-white">{budget.name}</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditBudget(budget)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteBudget(budget.id)}
                        className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Available</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(budget.current_balance)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Added</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {formatCurrency(budget.allocated_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-300">Spent</span>
                      <span className="font-medium text-red-600">
                        {formatCurrency(spent)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Usage</span>
                      <span>
                        {budget.allocated_amount > 0 
                          ? Math.round((spent / budget.allocated_amount) * 100)
                          : 0}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          backgroundColor: budget.color,
                          width: `${budget.allocated_amount > 0 
                            ? Math.min((spent / budget.allocated_amount) * 100, 100)
                            : 0}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingBudget ? 'Edit Budget' : 'Create Budget'}
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
                  Budget Name
                </label>
                <input
                  {...register('name', { required: 'Budget name is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Groceries, Travel"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget Type
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="sub">Sub Budget</option>
                  <option value="master">Master Budget</option>
                </select>
              </div>

              {budgetType === 'sub' && masterBudgets.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Parent Budget (Optional)
                  </label>
                  <select
                    {...register('parent_id')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">No parent budget</option>
                    {masterBudgets.map((budget) => (
                      <option key={budget.id} value={budget.id}>
                        {budget.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Allocated Amount (₹)
                </label>
                <input
                  {...register('allocated_amount', { 
                    required: 'Amount is required',
                    min: { value: 1, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="10000"
                />
                {errors.allocated_amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.allocated_amount.message}</p>
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
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingBudget ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}