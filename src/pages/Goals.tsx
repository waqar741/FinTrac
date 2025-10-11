// import { useState, useEffect } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// import { supabase } from '../lib/supabase'
// import { useForm } from 'react-hook-form'
// import { Plus, Target, X, CreditCard as Edit2, Trash2, TrendingUp } from 'lucide-react'
// import { format } from 'date-fns'

// interface Goal {
//   id: string
//   user_id: string
//   name: string
//   target_amount: number
//   current_amount: number
//   deadline: string | null
//   color: string
//   is_active: boolean
//   created_at: string
//   account_id: string | null
// }

// interface Account {
//   id: string
//   name: string
//   color: string
//   balance: number
// }

// interface GoalForm {
//   name: string
//   target_amount: number
//   deadline?: string
//   color: string
//   account_id?: string
// }

// export default function Goals() {
//   const { user } = useAuth()
//   const [goals, setGoals] = useState<Goal[]>([])
//   const [accounts, setAccounts] = useState<Account[]>([])
//   const [loading, setLoading] = useState(true)
//   const [showModal, setShowModal] = useState(false)
//   const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
//   const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
//   const [showAddMoneyModal, setShowAddMoneyModal] = useState(false)
//   const [addAmount, setAddAmount] = useState('')
//   const [selectedAccount, setSelectedAccount] = useState('')
//   const [isAdding, setIsAdding] = useState(false)

//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors, isSubmitting },
//     setError
//   } = useForm<GoalForm>()

//   useEffect(() => {
//     if (user) {
//       fetchData()
//     }
//   }, [user])

//   const fetchData = async () => {
//     try {
//       // Fetch accounts
//       const { data: accountsData } = await supabase
//         .from('accounts')
//         .select('id, name, color, balance')
//         .eq('user_id', user?.id)
//         .eq('is_active', true)

//       // Fetch goals
//       const { data: goalsData } = await supabase
//         .from('goals')
//         .select('*')
//         .eq('user_id', user?.id)
//         .eq('is_active', true)
//         .order('created_at', { ascending: false })

//       if (accountsData) {
//         setAccounts(accountsData)
//         if (accountsData.length > 0 && !selectedAccount) {
//           setSelectedAccount(accountsData[0].id)
//         }
//       }
//       if (goalsData) setGoals(goalsData)
//     } catch (error) {
//       console.error('Error fetching data:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const onSubmit = async (data: GoalForm) => {
//     try {
//       if (editingGoal) {
//         const { error } = await supabase
//           .from('goals')
//           .update({
//             name: data.name,
//             target_amount: data.target_amount,
//             deadline: data.deadline || null,
//             color: data.color,
//             account_id: data.account_id || null
//           })
//           .eq('id', editingGoal.id)

//         if (error) throw error
//       } else {
//         const { error } = await supabase
//           .from('goals')
//           .insert({
//             user_id: user?.id,
//             name: data.name,
//             target_amount: data.target_amount,
//             deadline: data.deadline || null,
//             color: data.color,
//             account_id: data.account_id || null,
//             current_amount: 0,
//             is_active: true
//           })

//         if (error) throw error
//       }

//       await fetchData()
//       handleCloseModal()
//     } catch (error: any) {
//       setError('root', { message: error.message })
//     }
//   }

//   const addMoneyToGoal = async () => {
//     if (!selectedGoal || !addAmount || !selectedAccount) return

//     setIsAdding(true)

//     try {
//       const amount = parseFloat(addAmount)

//       if (amount <= 0) {
//         alert('Amount must be greater than 0')
//         return
//       }

//       // Get selected account details
//       const account = accounts.find(acc => acc.id === selectedAccount)
//       if (!account) {
//         alert('Selected account not found')
//         return
//       }

//       // Check if account has sufficient balance
//       if (account.balance < amount) {
//         alert('Insufficient balance in selected account')
//         return
//       }

//       // **FIXED: Create transaction with goal_id FIRST**
//       const { data: transactionData, error: transactionError } = await supabase
//         .from('transactions')
//         .insert({
//           user_id: user?.id,
//           account_id: selectedAccount,
//           amount: amount,
//           type: 'expense',
//           description: `Goal: ${selectedGoal.name}`,
//           category: 'Savings',
//           is_recurring: false,
//           recurring_frequency: null,
//           goal_id: selectedGoal.id  // This links to the goal
//         })
//         .select()
//         .single()

//       if (transactionError) {
//         console.error('Transaction error:', transactionError)
//         throw transactionError
//       }

//       console.log('Transaction created:', transactionData)

//       // **Then update goal current_amount**
//       const { data: goalData, error: goalError } = await supabase
//         .from('goals')
//         .update({
//           current_amount: selectedGoal.current_amount + amount
//         })
//         .eq('id', selectedGoal.id)
//         .select()
//         .single()

//       if (goalError) throw goalError

//       // **Finally update account balance**
//       const { error: accountError } = await supabase
//         .from('accounts')
//         .update({
//           balance: account.balance - amount
//         })
//         .eq('id', selectedAccount)

//       if (accountError) throw accountError

//       await fetchData()
//       setShowAddMoneyModal(false)
//       setAddAmount('')
//       setSelectedGoal(null)
      
//       // Show success message
//       alert(`₹${amount} added to ${selectedGoal.name} goal! Transaction recorded.`)
      
//     } catch (error: any) {
//       console.error('Error adding money to goal:', error)
//       alert(`Error: ${error.message}`)
//     } finally {
//       setIsAdding(false)
//     }
//   }

//   const deleteGoal = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this goal?')) return

//     try {
//       const { error } = await supabase
//         .from('goals')
//         .update({ is_active: false })
//         .eq('id', id)

//       if (error) throw error
//       await fetchData()
//     } catch (error) {
//       console.error('Error deleting goal:', error)
//     }
//   }

//   const handleCloseModal = () => {
//     setShowModal(false)
//     setEditingGoal(null)
//     reset()
//   }

//   const handleEditGoal = (goal: Goal) => {
//     setEditingGoal(goal)
//     reset({
//       name: goal.name,
//       target_amount: goal.target_amount,
//       deadline: goal.deadline ? format(new Date(goal.deadline), 'yyyy-MM-dd') : undefined,
//       color: goal.color,
//       account_id: goal.account_id || ''
//     })
//     setShowModal(true)
//   }

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//     }).format(amount)
//   }

//   const getProgressPercentage = (current: number, target: number) => {
//     return Math.min((current / target) * 100, 100)
//   }

//   const colorOptions = [
//     '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
//     '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'
//   ]

//   if (loading) {
//     return (
//       <div className="p-6">
//         <div className="animate-pulse space-y-6">
//           <div className="h-8 bg-gray-200 rounded w-48"></div>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {[1, 2, 3, 4, 5, 6].map((i) => (
//               <div key={i} className="h-48 bg-gray-200 rounded-xl"></div>
//             ))}
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="p-6 space-y-6">
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Goals</h1>
//           <p className="text-gray-600 dark:text-gray-300 mt-1">Set and track your financial goals</p>
//         </div>
//         <button
//           onClick={() => setShowModal(true)}
//           className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mt-4 sm:mt-0"
//         >
//           <Plus className="w-4 h-4 mr-2" />
//           Add Goal
//         </button>
//       </div>

//       {/* Goals Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {goals.length === 0 ? (
//           <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
//             <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
//             <p className="text-gray-500 dark:text-gray-400">No goals created yet</p>
//             <button
//               onClick={() => setShowModal(true)}
//               className="mt-2 text-green-600 hover:text-green-700 font-medium"
//             >
//               Create your first goal
//             </button>
//           </div>
//         ) : (
//           goals.map((goal) => {
//             const progress = getProgressPercentage(goal.current_amount, goal.target_amount)
//             const isCompleted = progress >= 100
            
//             return (
//               <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center space-x-3">
//                     <div
//                       className="p-3 rounded-full"
//                       style={{ backgroundColor: goal.color + '20' }}
//                     >
//                       <Target 
//                         className="w-6 h-6"
//                         style={{ color: goal.color }}
//                       />
//                     </div>
//                     <div>
//                       <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
//                       {goal.deadline && (
//                         <p className="text-sm text-gray-500 dark:text-gray-400">
//                           Due: {format(new Date(goal.deadline), 'MMM d, yyyy')}
//                         </p>
//                       )}
//                     </div>
//                   </div>
//                   <div className="flex items-center space-x-2">
//                     <button
//                       onClick={() => handleEditGoal(goal)}
//                       className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
//                     >
//                       <Edit2 className="w-4 h-4" />
//                     </button>
//                     <button
//                       onClick={() => deleteGoal(goal.id)}
//                       className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600"
//                     >
//                       <Trash2 className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>
                
//                 <div className="mb-4">
//                   <div className="flex items-center justify-between mb-2">
//                     <span className="text-sm text-gray-600 dark:text-gray-300">Progress</span>
//                     <span className="text-sm font-medium text-gray-900 dark:text-white">
//                       {progress.toFixed(1)}%
//                     </span>
//                   </div>
//                   <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
//                     <div
//                       className="h-2 rounded-full transition-all duration-300"
//                       style={{ 
//                         width: `${progress}%`,
//                         backgroundColor: isCompleted ? '#10B981' : goal.color
//                       }}
//                     />
//                   </div>
//                 </div>

//                 <div className="space-y-2 mb-4">
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm text-gray-600 dark:text-gray-300">Current</span>
//                     <span className="font-semibold text-gray-900 dark:text-white">
//                       {formatCurrency(goal.current_amount)}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm text-gray-600 dark:text-gray-300">Target</span>
//                     <span className="font-semibold text-gray-900 dark:text-white">
//                       {formatCurrency(goal.target_amount)}
//                     </span>
//                   </div>
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm text-gray-600 dark:text-gray-300">Remaining</span>
//                     <span className="font-semibold text-green-600">
//                       {formatCurrency(Math.max(0, goal.target_amount - goal.current_amount))}
//                     </span>
//                   </div>
//                 </div>

//                 {!isCompleted && (
//                   <button
//                     onClick={() => {
//                       setSelectedGoal(goal)
//                       setShowAddMoneyModal(true)
//                     }}
//                     className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//                   >
//                     <Plus className="w-4 h-4 mr-2" />
//                     Add Money
//                   </button>
//                 )}

//                 {isCompleted && (
//                   <div className="w-full flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 rounded-lg">
//                     <TrendingUp className="w-4 h-4 mr-2" />
//                     Goal Completed!
//                   </div>
//                 )}
//               </div>
//             )
//           })
//         )}
//       </div>

//       {/* Goal Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-bold text-gray-900 dark:text-white">
//                 {editingGoal ? 'Edit Goal' : 'Add Goal'}
//               </h2>
//               <button
//                 onClick={handleCloseModal}
//                 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Goal Name
//                 </label>
//                 <input
//                   {...register('name', { required: 'Goal name is required' })}
//                   type="text"
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                   placeholder="e.g., Emergency Fund"
//                 />
//                 {errors.name && (
//                   <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Target Amount (₹)
//                 </label>
//                 <input
//                   {...register('target_amount', { 
//                     required: 'Target amount is required',
//                     min: { value: 1, message: 'Amount must be greater than 0' }
//                   })}
//                   type="number"
//                   step="0.01"
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                   placeholder="100000"
//                 />
//                 {errors.target_amount && (
//                   <p className="text-red-500 text-sm mt-1">{errors.target_amount.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Default Account (Optional)
//                 </label>
//                 <select
//                   {...register('account_id')}
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                 >
//                   <option value="">No default account</option>
//                   {accounts.map(account => (
//                     <option key={account.id} value={account.id}>{account.name}</option>
//                   ))}
//                 </select>
//                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                   You can always choose an account when adding money to this goal
//                 </p>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Deadline (Optional)
//                 </label>
//                 <input
//                   {...register('deadline')}
//                   type="date"
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Color
//                 </label>
//                 <div className="grid grid-cols-4 gap-2">
//                   {colorOptions.map((color) => (
//                     <label key={color} className="cursor-pointer">
//                       <input
//                         {...register('color', { required: 'Color is required' })}
//                         type="radio"
//                         value={color}
//                         className="sr-only"
//                         defaultChecked={color === '#3B82F6'}
//                       />
//                       <div
//                         className="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
//                         style={{ backgroundColor: color }}
//                       />
//                     </label>
//                   ))}
//                 </div>
//                 {errors.color && (
//                   <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>
//                 )}
//               </div>

//               {errors.root && (
//                 <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
//                   <p className="text-red-700 dark:text-red-400 text-sm">{errors.root.message}</p>
//                 </div>
//               )}

//               <div className="flex space-x-3 pt-4">
//                 <button
//                   type="button"
//                   onClick={handleCloseModal}
//                   className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
//                 >
//                   {isSubmitting ? 'Saving...' : (editingGoal ? 'Update' : 'Create')}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Add Money Modal */}
//       {showAddMoneyModal && selectedGoal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-bold text-gray-900 dark:text-white">
//                 Add Money to {selectedGoal.name}
//               </h2>
//               <button
//                 onClick={() => setShowAddMoneyModal(false)}
//                 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Amount (₹)
//                 </label>
//                 <input
//                   type="number"
//                   step="0.01"
//                   value={addAmount}
//                   onChange={(e) => setAddAmount(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                   placeholder="1000"
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   From Account *
//                 </label>
//                 <select
//                   value={selectedAccount}
//                   onChange={(e) => setSelectedAccount(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                   required
//                 >
//                   <option value="">Select an account</option>
//                   {accounts.map(account => (
//                     <option key={account.id} value={account.id}>
//                       {account.name} - {formatCurrency(account.balance)}
//                     </option>
//                   ))}
//                 </select>
//                 <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                   The amount will be deducted from this account and recorded as a transaction
//                 </p>
//               </div>

//               <div className="flex space-x-3 pt-4">
//                 <button
//                   onClick={() => setShowAddMoneyModal(false)}
//                   className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   onClick={addMoneyToGoal}
//                   disabled={!addAmount || parseFloat(addAmount) <= 0 || !selectedAccount || isAdding}
//                   className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
//                 >
//                   {isAdding ? 'Adding...' : 'Add Contribution'}
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }





import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useForm } from 'react-hook-form'
import { Plus, Target, X, CreditCard as Edit2, Trash2, TrendingUp, Loader } from 'lucide-react'
import { format } from 'date-fns'

interface Goal {
  id: string
  user_id: string
  name: string
  target_amount: number
  current_amount: number
  deadline: string | null
  color: string
  is_active: boolean
  created_at: string
  account_id: string | null
}

interface Account {
  id: string
  name: string
  color: string
  balance: number
}

interface GoalForm {
  name: string
  target_amount: number
  deadline?: string
  color: string
  account_id?: string
}

export default function Goals() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<Goal[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false)
  const [addAmount, setAddAmount] = useState('')
  const [selectedAccount, setSelectedAccount] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null) // NEW: Track deleting state

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError
  } = useForm<GoalForm>()

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      // Fetch accounts
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('id, name, color, balance')
        .eq('user_id', user?.id)
        .eq('is_active', true)

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (accountsData) {
        setAccounts(accountsData)
        if (accountsData.length > 0 && !selectedAccount) {
          setSelectedAccount(accountsData[0].id)
        }
      }
      if (goalsData) setGoals(goalsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: GoalForm) => {
    try {
      if (editingGoal) {
        const { error } = await supabase
          .from('goals')
          .update({
            name: data.name,
            target_amount: data.target_amount,
            deadline: data.deadline || null,
            color: data.color,
            account_id: data.account_id || null
          })
          .eq('id', editingGoal.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('goals')
          .insert({
            user_id: user?.id,
            name: data.name,
            target_amount: data.target_amount,
            deadline: data.deadline || null,
            color: data.color,
            account_id: data.account_id || null,
            current_amount: 0,
            is_active: true
          })

        if (error) throw error
      }

      await fetchData()
      handleCloseModal()
    } catch (error: any) {
      setError('root', { message: error.message })
    }
  }

  const addMoneyToGoal = async () => {
    if (!selectedGoal || !addAmount || !selectedAccount) return

    setIsAdding(true)

    try {
      const amount = parseFloat(addAmount)

      if (amount <= 0) {
        alert('Amount must be greater than 0')
        return
      }

      // Get selected account details
      const account = accounts.find(acc => acc.id === selectedAccount)
      if (!account) {
        alert('Selected account not found')
        return
      }

      // Check if account has sufficient balance
      if (account.balance < amount) {
        alert('Insufficient balance in selected account')
        return
      }

      // **FIXED: Create transaction with goal_id FIRST**
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user?.id,
          account_id: selectedAccount,
          amount: amount,
          type: 'expense',
          description: `Goal: ${selectedGoal.name}`,
          category: 'Savings',
          is_recurring: false,
          recurring_frequency: null,
          goal_id: selectedGoal.id  // This links to the goal
        })
        .select()
        .single()

      if (transactionError) {
        console.error('Transaction error:', transactionError)
        throw transactionError
      }

      console.log('Transaction created:', transactionData)

      // **Then update goal current_amount**
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .update({
          current_amount: selectedGoal.current_amount + amount
        })
        .eq('id', selectedGoal.id)
        .select()
        .single()

      if (goalError) throw goalError

      // **Finally update account balance**
      const { error: accountError } = await supabase
        .from('accounts')
        .update({
          balance: account.balance - amount
        })
        .eq('id', selectedAccount)

      if (accountError) throw accountError

      await fetchData()
      setShowAddMoneyModal(false)
      setAddAmount('')
      setSelectedGoal(null)
      
      // Show success message
      alert(`₹${amount} added to ${selectedGoal.name} goal! Transaction recorded.`)
      
    } catch (error: any) {
      console.error('Error adding money to goal:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsAdding(false)
    }
  }

  const deleteGoal = async (goal: Goal) => {
    // Prevent multiple clicks
    if (deletingGoalId === goal.id) {
      return; // Already deleting this goal
    }

    // Check if goal can be deleted
    const progress = getProgressPercentage(goal.current_amount, goal.target_amount)
    const isCompleted = progress >= 100

    // NEW: Restrict deletion based on conditions
    if (goal.current_amount > 0 && !isCompleted) {
      alert('Cannot delete goal that has money contributed and is not completed. Please withdraw the money first or complete the goal.')
      return
    }

    if (!confirm(`Are you sure you want to delete the goal "${goal.name}"? ${goal.current_amount > 0 ? 'This will also remove all associated contributions.' : ''}`)) return

    try {
      // Set deleting state to prevent multiple clicks
      setDeletingGoalId(goal.id);

      // If goal has money and is completed, we need to handle the money first
      if (goal.current_amount > 0 && isCompleted) {
        // For completed goals with money, we can delete since the goal is achieved
        // The money remains in the transactions as historical record
        console.log(`Deleting completed goal "${goal.name}" with ${goal.current_amount} contributed`)
      }

      // Soft delete the goal
      const { error } = await supabase
        .from('goals')
        .update({ is_active: false })
        .eq('id', goal.id)

      if (error) throw error
      
      await fetchData()
      alert(`Goal "${goal.name}" deleted successfully.`)
      
    } catch (error: any) {
      console.error('Error deleting goal:', error)
      alert(`Error deleting goal: ${error.message}`)
    } finally {
      // Always reset deleting state, whether success or error
      setDeletingGoalId(null);
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingGoal(null)
    reset()
  }

  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal)
    reset({
      name: goal.name,
      target_amount: goal.target_amount,
      deadline: goal.deadline ? format(new Date(goal.deadline), 'yyyy-MM-dd') : undefined,
      color: goal.color,
      account_id: goal.account_id || ''
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

  const getProgressPercentage = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  const canDeleteGoal = (goal: Goal) => {
    const progress = getProgressPercentage(goal.current_amount, goal.target_amount)
    const isCompleted = progress >= 100
    
    // Can delete if:
    // 1. Goal has no money contributed (current_amount = 0), OR
    // 2. Goal is completed (100% progress)
    return goal.current_amount === 0 || isCompleted
  }

  const getDeleteTooltip = (goal: Goal) => {
    const progress = getProgressPercentage(goal.current_amount, goal.target_amount)
    const isCompleted = progress >= 100

    if (goal.current_amount > 0 && !isCompleted) {
      return "Cannot delete goal with money contributed that is not completed"
    }
    if (goal.current_amount > 0 && isCompleted) {
      return "Delete completed goal"
    }
    return "Delete goal"
  }

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Goals</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Set and track your financial goals</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Goal
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No goals created yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 text-green-600 hover:text-green-700 font-medium"
            >
              Create your first goal
            </button>
          </div>
        ) : (
          goals.map((goal) => {
            const progress = getProgressPercentage(goal.current_amount, goal.target_amount)
            const isCompleted = progress >= 100
            const isDeleting = deletingGoalId === goal.id // NEW: Check if this goal is being deleted
            const canDelete = canDeleteGoal(goal) // NEW: Check if goal can be deleted
            
            return (
              <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div
                      className="p-3 rounded-full"
                      style={{ backgroundColor: goal.color + '20' }}
                    >
                      <Target 
                        className="w-6 h-6"
                        style={{ color: goal.color }}
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{goal.name}</h3>
                      {goal.deadline && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Due: {format(new Date(goal.deadline), 'MMM d, yyyy')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditGoal(goal)}
                      disabled={isDeleting} // NEW: Disable when deleting
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Edit goal"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal)}
                      disabled={isDeleting || !canDelete} // NEW: Disable when deleting or not allowed
                      className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title={getDeleteTooltip(goal)} // NEW: Dynamic tooltip
                    >
                      {isDeleting ? ( // NEW: Show loader when deleting
                        <Loader className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Progress</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: isCompleted ? '#10B981' : goal.color
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Current</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(goal.current_amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Target</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {formatCurrency(goal.target_amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-300">Remaining</span>
                    <span className="font-semibold text-green-600">
                      {formatCurrency(Math.max(0, goal.target_amount - goal.current_amount))}
                    </span>
                  </div>
                </div>

                {!isCompleted && (
                  <button
                    onClick={() => {
                      setSelectedGoal(goal)
                      setShowAddMoneyModal(true)
                    }}
                    disabled={isDeleting} // NEW: Disable when deleting
                    className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Money
                  </button>
                )}

                {isCompleted && (
                  <div className="w-full flex items-center justify-center px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Goal Completed!
                  </div>
                )}

                {/* NEW: Show warning if goal cannot be deleted */}
                {!canDelete && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-xs text-yellow-700 text-center">
                      Complete this goal or Edit this current Percentage
                    </p>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Goal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingGoal ? 'Edit Goal' : 'Add Goal'}
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
                  Goal Name
                </label>
                <input
                  {...register('name', { required: 'Goal name is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Emergency Fund"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Target Amount (₹)
                </label>
                <input
                  {...register('target_amount', { 
                    required: 'Target amount is required',
                    min: { value: 1, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="100000"
                />
                {errors.target_amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.target_amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Account (Optional)
                </label>
                <select
                  {...register('account_id')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">No default account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  You can always choose an account when adding money to this goal
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deadline (Optional)
                </label>
                <input
                  {...register('deadline')}
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Color
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {colorOptions.map((color) => (
                    <label key={color} className="cursor-pointer">
                      <input
                        {...register('color', { required: 'Color is required' })}
                        type="radio"
                        value={color}
                        className="sr-only"
                        defaultChecked={color === '#3B82F6'}
                      />
                      <div
                        className="w-10 h-10 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
                        style={{ backgroundColor: color }}
                      />
                    </label>
                  ))}
                </div>
                {errors.color && (
                  <p className="text-red-500 text-sm mt-1">{errors.color.message}</p>
                )}
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
                  {isSubmitting ? 'Saving...' : (editingGoal ? 'Update' : 'Create')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Money Modal */}
      {showAddMoneyModal && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Add Money to {selectedGoal.name}
              </h2>
              <button
                onClick={() => setShowAddMoneyModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="1000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  From Account *
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Select an account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} - {formatCurrency(account.balance)}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  The amount will be deducted from this account and recorded as a transaction
                </p>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => setShowAddMoneyModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addMoneyToGoal}
                  disabled={!addAmount || parseFloat(addAmount) <= 0 || !selectedAccount || isAdding}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {isAdding ? 'Adding...' : 'Add Contribution'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}