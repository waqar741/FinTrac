// import { useState, useEffect } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// import { supabase } from '../lib/supabase'
// import { useForm } from 'react-hook-form'
// import { Plus, User, X, DollarSign, ToggleLeft, ToggleRight, Trash2, Wallet } from 'lucide-react'
// import { format } from 'date-fns'

// interface DebtCredit {
//   id: string
//   person_name: string
//   amount: number
//   type: 'debt' | 'credit' // debt = you owe them, credit = they owe you
//   description: string
//   due_date: string | null
//   is_settled: boolean
//   created_at: string
//   settlement_transaction_id: string | null
//   settlement_account_id: string | null
// }

// interface Account {
//   id: string
//   name: string
//   balance: number
//   is_active: boolean
// }

// interface DebtCreditForm {
//   person_name: string
//   amount: number
//   type: 'debt' | 'credit'
//   description: string
//   due_date?: string
// }

// export default function DebtsCredits() {
//   const { user } = useAuth()
//   const [debtsCredits, setDebtsCredits] = useState<DebtCredit[]>([])
//   const [accounts, setAccounts] = useState<Account[]>([])
//   const [loading, setLoading] = useState(true)
//   const [showModal, setShowModal] = useState(false)
//   const [editingItem, setEditingItem] = useState<DebtCredit | null>(null)
//   const [duplicateMessage, setDuplicateMessage] = useState('')
//   const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
//   const [showAccountSelection, setShowAccountSelection] = useState(false)
//   const [pendingSettlementItem, setPendingSettlementItem] = useState<DebtCredit | null>(null)
  
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   const {
//     register,
//     handleSubmit,
//     reset,
//     formState: { errors },
//     setError,
//     watch
//   } = useForm<DebtCreditForm>()

//   const watchType = watch('type', 'debt')

//   // Get today's date in YYYY-MM-DD format for the min attribute
//   const today = new Date().toISOString().split('T')[0]

//   useEffect(() => {
//     if (user) {
//       fetchDebtsCredits()
//       fetchAccounts()
//     }
//   }, [user])

//   const fetchDebtsCredits = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('debts_credits')
//         .select('*')
//         .eq('user_id', user?.id)
//         .order('created_at', { ascending: false })

//       if (error) throw error
//       if (data) setDebtsCredits(data)
//     } catch (error) {
//       console.error('Error fetching debts/credits:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const fetchAccounts = async () => {
//     try {
//       const { data, error } = await supabase
//         .from('accounts')
//         .select('*')
//         .eq('user_id', user?.id)
//         .eq('is_active', true)
//         .order('created_at', { ascending: true })

//       if (error) throw error
//       if (data) setAccounts(data)
//     } catch (error) {
//       console.error('Error fetching accounts:', error)
//     }
//   }

//   const onSubmit = async (data: DebtCreditForm) => {
//     setIsSubmitting(true)
    
//     try {
//       // Check for duplicates
//       const { data: existingDebt } = await supabase
//         .from('debts_credits')
//         .select('id')
//         .eq('user_id', user?.id)
//         .eq('person_name', data.person_name)
//         .eq('amount', data.amount)
//         .eq('type', data.type)
//         .eq('description', data.description)
//         .eq('is_settled', false)
//         .single()

//       if (existingDebt && !editingItem) {
//         setDuplicateMessage('This transaction already exists and has not been added again.')
//         setTimeout(() => setDuplicateMessage(''), 5000)
//         return
//       }

//       if (editingItem) {
//         const { error } = await supabase
//           .from('debts_credits')
//           .update({
//             person_name: data.person_name,
//             amount: data.amount,
//             type: data.type,
//             description: data.description,
//             due_date: data.due_date || null
//           })
//           .eq('id', editingItem.id)

//         if (error) throw error
//       } else {
//         const { error } = await supabase
//           .from('debts_credits')
//           .insert({
//             user_id: user?.id,
//             person_name: data.person_name,
//             amount: data.amount,
//             type: data.type,
//             description: data.description,
//             due_date: data.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
//             is_settled: false
//           })

//         if (error) throw error
//       }

//       await fetchDebtsCredits()
//       handleCloseModal()
//     } catch (error: any) {
//       setError('root', { message: error.message })
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   const initiateSettlement = async (id: string, currentStatus: boolean) => {
//     if (processingIds.has(id)) return

//     const item = debtsCredits.find(dc => dc.id === id)
//     if (!item) return

//     if (currentStatus) {
//       // If already settled, just toggle back without account selection
//       await toggleSettled(id, currentStatus, null)
//     } else {
//       // If not settled, check if we need account selection
//       if (accounts.length > 1) {
//         // Show account selection modal
//         setPendingSettlementItem(item)
//         setShowAccountSelection(true)
//       } else if (accounts.length === 1) {
//         // Only one account, use it directly
//         await toggleSettled(id, currentStatus, accounts[0].id)
//       } else {
//         alert('No active accounts found. Please create an account first.')
//       }
//     }
//   }

//   const toggleSettled = async (id: string, currentStatus: boolean, accountId: string | null) => {
//     if (processingIds.has(id)) return
//     setProcessingIds(prev => new Set(prev).add(id))

//     try {
//       const item = debtsCredits.find(dc => dc.id === id)
//       if (!item) {
//         setProcessingIds(prev => {
//           const next = new Set(prev)
//           next.delete(id)
//           return next
//         })
//         return
//       }

//       if (!currentStatus) {
//         // Marking as settled - create settlement transaction
//         let settlementAccount: Account | null = null

//         if (accountId) {
//           settlementAccount = accounts.find(acc => acc.id === accountId) || null
//         } else {
//           // Fallback to first account
//           settlementAccount = accounts[0] || null
//         }

//         if (!settlementAccount) {
//           alert('No account found. Please create an account first.')
//           return
//         }
        
//         const transactionType = item.type === 'credit' ? 'income' : 'expense'
//         const description = item.type === 'credit' 
//           ? `Received payment from ${item.person_name}: ${item.description}`
//           : `Paid ${item.person_name}: ${item.description}`

//         // Create settlement transaction - REMOVED date field
//         const { data: newTransaction, error: txError } = await supabase
//           .from('transactions')
//           .insert({
//             user_id: user?.id,
//             account_id: settlementAccount.id,
//             amount: item.amount,
//             type: transactionType,
//             description: description,
//             category: 'Debt/Credit Settlement'
//           })
//           .select()
//           .single()

//         if (txError) throw txError

//         // Update account balance
//         const balanceChange = item.type === 'credit' ? item.amount : -item.amount
//         const newBalance = settlementAccount.balance + balanceChange
        
//         const { error: balanceError } = await supabase
//           .from('accounts')
//           .update({ 
//             balance: newBalance
//           })
//           .eq('id', settlementAccount.id)

//         if (balanceError) throw balanceError

//         // Update debt/credit with settlement info
//         const { error: updateError } = await supabase
//           .from('debts_credits')
//           .update({ 
//             is_settled: true,
//             settlement_transaction_id: newTransaction.id,
//             settlement_account_id: settlementAccount.id
//           })
//           .eq('id', id)

//         if (updateError) throw updateError

//       } else {
//         // Marking as unsettled - remove settlement transaction
//         if (item.settlement_transaction_id) {
//           // Get the settlement account to reverse the balance
//           const settlementAccount = accounts.find(acc => acc.id === item.settlement_account_id)
          
//           if (settlementAccount) {
//             // Reverse the balance change
//             const balanceChange = item.type === 'credit' ? -item.amount : item.amount
//             const newBalance = settlementAccount.balance + balanceChange
            
//             const { error: balanceError } = await supabase
//               .from('accounts')
//               .update({ 
//                 balance: newBalance
//               })
//               .eq('id', settlementAccount.id)

//             if (balanceError) throw balanceError
//           }

//           // Delete the settlement transaction
//           const { error: deleteError } = await supabase
//             .from('transactions')
//             .delete()
//             .eq('id', item.settlement_transaction_id)

//           if (deleteError) throw deleteError
//         }
        
//         // Update debt/credit status
//         const { error: updateError } = await supabase
//           .from('debts_credits')
//           .update({ 
//             is_settled: false,
//             settlement_transaction_id: null,
//             settlement_account_id: null
//           })
//           .eq('id', id)

//         if (updateError) throw updateError
//       }

//       await fetchDebtsCredits()
//       await fetchAccounts() // Refresh accounts to get updated balances
//     } catch (error: any) {
//       console.error('Error updating settlement status:', error)
//       alert(`Error: ${error.message || 'Failed to update settlement status'}`)
//     } finally {
//       setProcessingIds(prev => {
//         const next = new Set(prev)
//         next.delete(id)
//         return next
//       })
//     }
//   }

//   const handleAccountSelection = async (accountId: string) => {
//     if (pendingSettlementItem) {
//       await toggleSettled(pendingSettlementItem.id, pendingSettlementItem.is_settled, accountId)
//     }
//     setShowAccountSelection(false)
//     setPendingSettlementItem(null)
//   }

//   const deleteItem = async (id: string) => {
//     if (processingIds.has(id)) return
//     if (!confirm('Are you sure you want to delete this item?')) return

//     setProcessingIds(prev => new Set(prev).add(id))

//     try {
//       const { error } = await supabase
//         .from('debts_credits')
//         .delete()
//         .eq('id', id)

//       if (error) throw error
//       await fetchDebtsCredits()
//     } catch (error) {
//       console.error('Error deleting item:', error)
//     } finally {
//       setProcessingIds(prev => {
//         const next = new Set(prev)
//         next.delete(id)
//         return next
//       })
//     }
//   }

//   const handleCloseModal = () => {
//     setShowModal(false)
//     setEditingItem(null)
//     reset()
//   }

//   const handleEditItem = (item: DebtCredit) => {
//     setEditingItem(item)
//     reset({
//       person_name: item.person_name,
//       amount: item.amount,
//       type: item.type,
//       description: item.description,
//       due_date: item.due_date ? format(new Date(item.due_date), 'yyyy-MM-dd') : undefined
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

//   // Function to validate date (not in the past)
//   const validateDate = (dateString: string | undefined) => {
//     if (!dateString) return true // Allow empty dates
    
//     const selectedDate = new Date(dateString)
//     const today = new Date()
//     today.setHours(0, 0, 0, 0) // Set to beginning of day for accurate comparison
    
//     return selectedDate >= today || 'Due date cannot be in the past'
//   }

//   const debts = debtsCredits.filter(item => item.type === 'debt' && !item.is_settled)
//   const credits = debtsCredits.filter(item => item.type === 'credit' && !item.is_settled)
//   const settled = debtsCredits.filter(item => item.is_settled)

//   const totalDebt = debts.reduce((sum, item) => sum + item.amount, 0)
//   const totalCredit = credits.reduce((sum, item) => sum + item.amount, 0)

//   if (loading) {
//     return (
//       <div className="p-6">
//         <div className="animate-pulse space-y-6">
//           <div className="h-8 bg-gray-200 rounded w-48"></div>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {[1, 2, 3, 4].map((i) => (
//               <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
//             ))}
//           </div>
//         </div>
//       </div>
//     )
//   }

//   return (
//     <div className="p-6 space-y-6">
//   {/* Header - Updated for mobile */}
//   <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//     <div className="flex items-center justify-between w-full sm:w-auto">
//       <div>
//         <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Debts & Credits</h1>
//         {/* <p className="text-gray-600 dark:text-gray-300 mt-1">Track who owes you and who you owe</p> */}
//       </div>
//       <button
//         onClick={() => setShowModal(true)}
//         className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors sm:hidden ml-4"
//       >
//         <Plus className="w-4 h-4 mr-2" />
//         Add Entry
//       </button>
//     </div>
//     <button
//       onClick={() => setShowModal(true)}
//       className="hidden sm:flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
//     >
//       <Plus className="w-4 h-4 mr-2" />
//       Add Entry
//     </button>
//   </div>

//   {/* Summary Cards - Updated for single line layout */}
//   <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//     <div className="grid grid-cols-3 gap-4 sm:gap-6">
//       {/* You Owe */}
//       <div className="text-center">
//         <div className="flex flex-col items-center">
//           <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">You Owe</p>
//           <p className="text-xl sm:text-2xl font-bold text-red-600 mt-2">
//             {formatCurrency(totalDebt)}
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{debts.length} people</p>
//         </div>
//       </div>

//       {/* Others Owe You */}
//       <div className="text-center">
//         <div className="flex flex-col items-center">
//           <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Others Owe You</p>
//           <p className="text-xl sm:text-2xl font-bold text-green-600 mt-2">
//             {formatCurrency(totalCredit)}
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{credits.length} people</p>
//         </div>
//       </div>

//       {/* Net Balance */}
//       <div className="text-center">
//         <div className="flex flex-col items-center">
//           <p className="text-gray-600 dark:text-gray-300 text-sm font-medium">Net Balance</p>
//           <p className={`text-xl sm:text-2xl font-bold mt-2 ${
//             totalCredit - totalDebt >= 0 ? 'text-green-600' : 'text-red-600'
//           }`}>
//             {formatCurrency(totalCredit - totalDebt)}
//           </p>
//           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//             {totalCredit >= totalDebt ? 'In your favor' : 'You owe more'}
//           </p>
//         </div>
//       </div>
//     </div>
//   </div>

//   {/* Rest of your existing code remains the same... */}
//   <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//     {/* You Owe (Debts) */}
//     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">You Owe</h2>
//       <div className="space-y-3">
//         {debts.length === 0 ? (
//           <p className="text-gray-500 dark:text-gray-400 text-center py-8">No outstanding debts</p>
//         ) : (
//           debts.map((debt) => (
//             <div key={debt.id} className="p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/10">
//               <div className="flex items-center justify-between mb-2">
//                 <h3 className="font-medium text-gray-900 dark:text-white">{debt.person_name}</h3>
//                 <span className="text-lg font-bold text-red-600">{formatCurrency(debt.amount)}</span>
//               </div>
//               <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{debt.description}</p>
//               {debt.due_date && (
//                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
//                   Due: {format(new Date(debt.due_date), 'MMM d, yyyy')}
//                 </p>
//               )}
//               <div className="flex items-center space-x-2">
//                 <button
//                   onClick={() => initiateSettlement(debt.id, debt.is_settled)}
//                   disabled={processingIds.has(debt.id)}
//                   className="flex items-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   {debt.is_settled ? (
//                     <>
//                       <ToggleRight className="w-3 h-3 mr-1" />
//                       Settled
//                     </>
//                   ) : (
//                     <>
//                       <ToggleLeft className="w-3 h-3 mr-1" />
//                       {processingIds.has(debt.id) ? 'Processing...' : 'Mark Paid'}
//                     </>
//                   )}
//                 </button>
//                 <button
//                   onClick={() => handleEditItem(debt)}
//                   disabled={processingIds.has(debt.id)}
//                   className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => deleteItem(debt.id)}
//                   disabled={processingIds.has(debt.id)}
//                   className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>

//     {/* Others Owe You (Credits) */}
//     <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//       <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Others Owe You</h2>
//       <div className="space-y-3">
//         {credits.length === 0 ? (
//           <p className="text-gray-500 dark:text-gray-400 text-center py-8">No outstanding credits</p>
//         ) : (
//           credits.map((credit) => (
//             <div key={credit.id} className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/10">
//               <div className="flex items-center justify-between mb-2">
//                 <h3 className="font-medium text-gray-900 dark:text-white">{credit.person_name}</h3>
//                 <span className="text-lg font-bold text-green-600">{formatCurrency(credit.amount)}</span>
//               </div>
//               <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{credit.description}</p>
//               {credit.due_date && (
//                 <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
//                   Due: {format(new Date(credit.due_date), 'MMM d, yyyy')}
//                 </p>
//               )}
//               <div className="flex items-center space-x-2">
//                 <button
//                   onClick={() => initiateSettlement(credit.id, credit.is_settled)}
//                   disabled={processingIds.has(credit.id)}
//                   className="flex items-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   {credit.is_settled ? (
//                     <>
//                       <ToggleRight className="w-3 h-3 mr-1" />
//                       Settled
//                     </>
//                   ) : (
//                     <>
//                       <ToggleLeft className="w-3 h-3 mr-1" />
//                       {processingIds.has(credit.id) ? 'Processing...' : 'Mark Received'}
//                     </>
//                   )}
//                 </button>
//                 <button
//                   onClick={() => handleEditItem(credit)}
//                   disabled={processingIds.has(credit.id)}
//                   className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   Edit
//                 </button>
//                 <button
//                   onClick={() => deleteItem(credit.id)}
//                   disabled={processingIds.has(credit.id)}
//                   className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                 >
//                   Delete
//                 </button>
//               </div>
//             </div>
//           ))
//         )}
//       </div>
//     </div>
 

//         {/* Others Owe You (Credits) */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Others Owe You</h2>
//           <div className="space-y-3">
//             {credits.length === 0 ? (
//               <p className="text-gray-500 dark:text-gray-400 text-center py-8">No outstanding credits</p>
//             ) : (
//               credits.map((credit) => (
//                 <div key={credit.id} className="p-4 border border-green-200 dark:border-green-800 rounded-lg bg-green-50 dark:bg-green-900/10">
//                   <div className="flex items-center justify-between mb-2">
//                     <h3 className="font-medium text-gray-900 dark:text-white">{credit.person_name}</h3>
//                     <span className="text-lg font-bold text-green-600">{formatCurrency(credit.amount)}</span>
//                   </div>
//                   <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{credit.description}</p>
//                   {credit.due_date && (
//                     <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
//                       Due: {format(new Date(credit.due_date), 'MMM d, yyyy')}
//                     </p>
//                   )}
//                   <div className="flex items-center space-x-2">
//                     <button
//                       onClick={() => initiateSettlement(credit.id, credit.is_settled)}
//                       disabled={processingIds.has(credit.id)}
//                       className="flex items-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                     >
//                       {credit.is_settled ? (
//                         <>
//                           <ToggleRight className="w-3 h-3 mr-1" />
//                           Settled
//                         </>
//                       ) : (
//                         <>
//                           <ToggleLeft className="w-3 h-3 mr-1" />
//                           {processingIds.has(credit.id) ? 'Processing...' : 'Mark Received'}
//                         </>
//                       )}
//                     </button>
//                     <button
//                       onClick={() => handleEditItem(credit)}
//                       disabled={processingIds.has(credit.id)}
//                       className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                     >
//                       Edit
//                     </button>
//                     <button
//                       onClick={() => deleteItem(credit.id)}
//                       disabled={processingIds.has(credit.id)}
//                       className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                     >
//                       Delete
//                     </button>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Settled Items */}
//       {settled.length > 0 && (
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Settled ({settled.length})</h2>
//           <div className="space-y-3">
//             {settled.map((item) => {
//               const settlementAccount = accounts.find(acc => acc.id === item.settlement_account_id)
//               return (
//                 <div key={item.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 opacity-75">
//                   <div className="flex items-center justify-between mb-2">
//                     <h3 className="font-medium text-gray-900 dark:text-white">{item.person_name}</h3>
//                     <span className="text-lg font-bold text-gray-600 dark:text-gray-300">{formatCurrency(item.amount)}</span>
//                   </div>
//                   <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.description}</p>
//                   {settlementAccount && (
//                     <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
//                       Settled via: {settlementAccount.name}
//                     </p>
//                   )}
//                   <div className="flex items-center justify-between">
//                     <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
//                       ✓ Settled
//                     </span>
//                     <div className="flex space-x-2">
//                       <button
//                         onClick={() => deleteItem(item.id)}
//                         disabled={processingIds.has(item.id)}
//                         className="flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
//                       >
//                         <Trash2 className="w-3 h-3 mr-1" />
//                         {processingIds.has(item.id) ? 'Removing...' : 'Remove'}
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         </div>
//       )}

//       {/* Account Selection Modal */}
//       {showAccountSelection && pendingSettlementItem && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-bold text-gray-900 dark:text-white">
//                 Select Account
//               </h2>
//               <button
//                 onClick={() => {
//                   setShowAccountSelection(false)
//                   setPendingSettlementItem(null)
//                   setProcessingIds(prev => {
//                     const next = new Set(prev)
//                     next.delete(pendingSettlementItem.id)
//                     return next
//                   })
//                 }}
//                 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="space-y-4">
//               <p className="text-gray-600 dark:text-gray-300">
//                 {pendingSettlementItem.type === 'credit' 
//                   ? `Select the account where you received payment from ${pendingSettlementItem.person_name}:`
//                   : `Select the account from which you paid ${pendingSettlementItem.person_name}:`}
//               </p>
              
//               <div className="space-y-3 max-h-96 overflow-y-auto">
//                 {accounts.map((account) => (
//                   <button
//                     key={account.id}
//                     onClick={() => handleAccountSelection(account.id)}
//                     className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
//                   >
//                     <div className="flex items-center justify-between">
//                       <div className="flex items-center space-x-3">
//                         <Wallet className="w-5 h-5 text-gray-400" />
//                         <div>
//                           <h3 className="font-medium text-gray-900 dark:text-white">{account.name}</h3>
//                           <p className="text-sm text-gray-500 dark:text-gray-400">
//                             Balance: {formatCurrency(account.balance)}
//                           </p>
//                         </div>
//                       </div>
//                     </div>
//                   </button>
//                 ))}
//               </div>

//               {accounts.length === 0 && (
//                 <p className="text-center text-gray-500 dark:text-gray-400 py-4">
//                   No active accounts found. Please create an account first.
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Add/Edit Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-bold text-gray-900 dark:text-white">
//                 {editingItem ? 'Edit Entry' : 'Add Debt/Credit'}
//               </h2>
//               <button
//                 onClick={handleCloseModal}
//                 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//               {duplicateMessage && (
//                 <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
//                   <p className="text-yellow-700 dark:text-yellow-400 text-sm">{duplicateMessage}</p>
//                 </div>
//               )}
              
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Person Name
//                 </label>
//                 <input
//                   {...register('person_name', { required: 'Person name is required' })}
//                   type="text"
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                   placeholder="John Doe"
//                 />
//                 {errors.person_name && (
//                   <p className="text-red-500 text-sm mt-1">{errors.person_name.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Type
//                 </label>
//                 <select
//                   {...register('type')}
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                 >
//                   <option value="debt">I owe them</option>
//                   <option value="credit">They owe me</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Amount (₹)
//                 </label>
//                 <input
//                   {...register('amount', { 
//                     required: 'Amount is required',
//                     min: { value: 0.01, message: 'Amount must be greater than 0' }
//                   })}
//                   type="number"
//                   step="0.01"
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                   placeholder="1000"
//                 />
//                 {errors.amount && (
//                   <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Description
//                 </label>
//                 <input
//                   {...register('description', { required: 'Description is required' })}
//                   type="text"
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                   placeholder="Lunch money, loan, etc."
//                 />
//                 {errors.description && (
//                   <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Due Date
//                 </label>
//                 <input
//                   {...register('due_date', {
//                     validate: validateDate
//                   })}
//                   type="date"
//                   min={today}
//                   defaultValue={format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                 />
//                 {errors.due_date && (
//                   <p className="text-red-500 text-sm mt-1">{errors.due_date.message}</p>
//                 )}
//                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
//                   Default: 7 days from today
//                 </p>
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
//                   {isSubmitting 
//                     ? (editingItem ? 'Updating...' : 'Adding...')
//                     : (editingItem ? 'Update' : 'Add')}
//                 </button>
//               </div>
//             </form>
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
import { Plus, User, X, DollarSign, ToggleLeft, ToggleRight, Trash2, Wallet } from 'lucide-react'
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
  settlement_transaction_id: string | null
  settlement_account_id: string | null
}

interface Account {
  id: string
  name: string
  balance: number
  is_active: boolean
}

interface DebtCreditForm {
  person_name: string
  amount: number
  type: 'debt' | 'credit'
  description: string
  due_date?: string
}

export default function DebtsCredits() {
  const { user } = useAuth()
  const [debtsCredits, setDebtsCredits] = useState<DebtCredit[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<DebtCredit | null>(null)
  const [duplicateMessage, setDuplicateMessage] = useState('')
  const [processingIds, setProcessingIds] = useState<Set<string>>(new Set())
  const [showAccountSelection, setShowAccountSelection] = useState(false)
  const [pendingSettlementItem, setPendingSettlementItem] = useState<DebtCredit | null>(null)
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setError,
    watch
  } = useForm<DebtCreditForm>()

  const watchType = watch('type', 'debt')

  // Get today's date in YYYY-MM-DD format for the min attribute
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (user) {
      fetchDebtsCredits()
      fetchAccounts()
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

  const fetchAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (error) throw error
      if (data) setAccounts(data)
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const onSubmit = async (data: DebtCreditForm) => {
    setIsSubmitting(true)
    
    try {
      // Check for duplicates
      const { data: existingDebt } = await supabase
        .from('debts_credits')
        .select('id')
        .eq('user_id', user?.id)
        .eq('person_name', data.person_name)
        .eq('amount', data.amount)
        .eq('type', data.type)
        .eq('description', data.description)
        .eq('is_settled', false)
        .single()

      if (existingDebt && !editingItem) {
        setDuplicateMessage('This transaction already exists and has not been added again.')
        setTimeout(() => setDuplicateMessage(''), 5000)
        return
      }

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
            due_date: data.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            is_settled: false
          })

        if (error) throw error
      }

      await fetchDebtsCredits()
      handleCloseModal()
    } catch (error: any) {
      setError('root', { message: error.message })
    } finally {
      setIsSubmitting(false)
    }
  }

  const initiateSettlement = async (id: string, currentStatus: boolean) => {
    if (processingIds.has(id)) return

    const item = debtsCredits.find(dc => dc.id === id)
    if (!item) return

    if (currentStatus) {
      // If already settled, just toggle back without account selection
      await toggleSettled(id, currentStatus, null)
    } else {
      // If not settled, check if we need account selection
      if (accounts.length > 1) {
        // Show account selection modal
        setPendingSettlementItem(item)
        setShowAccountSelection(true)
      } else if (accounts.length === 1) {
        // Only one account, use it directly
        await toggleSettled(id, currentStatus, accounts[0].id)
      } else {
        alert('No active accounts found. Please create an account first.')
      }
    }
  }

  const toggleSettled = async (id: string, currentStatus: boolean, accountId: string | null) => {
    if (processingIds.has(id)) return
    setProcessingIds(prev => new Set(prev).add(id))

    try {
      const item = debtsCredits.find(dc => dc.id === id)
      if (!item) {
        setProcessingIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
        return
      }

      if (!currentStatus) {
        // Marking as settled - create settlement transaction
        let settlementAccount: Account | null = null

        if (accountId) {
          settlementAccount = accounts.find(acc => acc.id === accountId) || null
        } else {
          // Fallback to first account
          settlementAccount = accounts[0] || null
        }

        if (!settlementAccount) {
          alert('No account found. Please create an account first.')
          return
        }
        
        const transactionType = item.type === 'credit' ? 'income' : 'expense'
        const description = item.type === 'credit' 
          ? `Received payment from ${item.person_name}: ${item.description}`
          : `Paid ${item.person_name}: ${item.description}`

        // Create settlement transaction - REMOVED date field
        const { data: newTransaction, error: txError } = await supabase
          .from('transactions')
          .insert({
            user_id: user?.id,
            account_id: settlementAccount.id,
            amount: item.amount,
            type: transactionType,
            description: description,
            category: 'Debt/Credit Settlement'
          })
          .select()
          .single()

        if (txError) throw txError

        // Update account balance
        const balanceChange = item.type === 'credit' ? item.amount : -item.amount
        const newBalance = settlementAccount.balance + balanceChange
        
        const { error: balanceError } = await supabase
          .from('accounts')
          .update({ 
            balance: newBalance
          })
          .eq('id', settlementAccount.id)

        if (balanceError) throw balanceError

        // Update debt/credit with settlement info
        const { error: updateError } = await supabase
          .from('debts_credits')
          .update({ 
            is_settled: true,
            settlement_transaction_id: newTransaction.id,
            settlement_account_id: settlementAccount.id
          })
          .eq('id', id)

        if (updateError) throw updateError

      } else {
        // Marking as unsettled - remove settlement transaction
        if (item.settlement_transaction_id) {
          // Get the settlement account to reverse the balance
          const settlementAccount = accounts.find(acc => acc.id === item.settlement_account_id)
          
          if (settlementAccount) {
            // Reverse the balance change
            const balanceChange = item.type === 'credit' ? -item.amount : item.amount
            const newBalance = settlementAccount.balance + balanceChange
            
            const { error: balanceError } = await supabase
              .from('accounts')
              .update({ 
                balance: newBalance
              })
              .eq('id', settlementAccount.id)

            if (balanceError) throw balanceError
          }

          // Delete the settlement transaction
          const { error: deleteError } = await supabase
            .from('transactions')
            .delete()
            .eq('id', item.settlement_transaction_id)

          if (deleteError) throw deleteError
        }
        
        // Update debt/credit status
        const { error: updateError } = await supabase
          .from('debts_credits')
          .update({ 
            is_settled: false,
            settlement_transaction_id: null,
            settlement_account_id: null
          })
          .eq('id', id)

        if (updateError) throw updateError
      }

      await fetchDebtsCredits()
      await fetchAccounts() // Refresh accounts to get updated balances
    } catch (error: any) {
      console.error('Error updating settlement status:', error)
      alert(`Error: ${error.message || 'Failed to update settlement status'}`)
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleAccountSelection = async (accountId: string) => {
    if (pendingSettlementItem) {
      await toggleSettled(pendingSettlementItem.id, pendingSettlementItem.is_settled, accountId)
    }
    setShowAccountSelection(false)
    setPendingSettlementItem(null)
  }

  const deleteItem = async (id: string) => {
    if (processingIds.has(id)) return
    if (!confirm('Are you sure you want to delete this item?')) return

    setProcessingIds(prev => new Set(prev).add(id))

    try {
      const { error } = await supabase
        .from('debts_credits')
        .delete()
        .eq('id', id)

      if (error) throw error
      await fetchDebtsCredits()
    } catch (error) {
      console.error('Error deleting item:', error)
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
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
      due_date: item.due_date ? format(new Date(item.due_date), 'yyyy-MM-dd') : undefined
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

  // Function to validate date (not in the past)
  const validateDate = (dateString: string | undefined) => {
    if (!dateString) return true // Allow empty dates
    
    const selectedDate = new Date(dateString)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Set to beginning of day for accurate comparison
    
    return selectedDate >= today || 'Due date cannot be in the past'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Debts & Credits</h1>
          {/* <p className="text-gray-600 dark:text-gray-300 mt-1">Track who owes you and who you owe</p> */}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Entry
        </button>
      </div>

      {/* Desktop View - Colored Cards */}
      <div className="hidden sm:grid grid-cols-1 md:grid-cols-3 gap-6">
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

      {/* --- START: Edited Mobile-Optimized Code --- */}

{/* Mobile View - Light Colored Cards Layout */}
<div className="sm:hidden">
  <div className="grid grid-cols-3 gap-3">
    
    {/* You Owe Card (Light Red) */}
    <div className="bg-red-50 dark:bg-red-900/30 rounded-xl p-3 text-center shadow-sm border border-red-100 dark:border-red-800">
      <div className="flex flex-col items-center">
        <p className="font-medium text-sm text-red-700 dark:text-red-300">You Owe</p>
        <p className="text-xl font-bold text-red-600 dark:text-red-400 mt-2">
          {formatCurrency(totalDebt)}
        </p>
        <p className="text-xs text-red-500 dark:text-red-400 mt-1">{debts.length} people</p>
      </div>
    </div>

    {/* Others Owe You Card (Light Green) */}
    <div className="bg-green-50 dark:bg-green-900/30 rounded-xl p-3 text-center shadow-sm border border-green-100 dark:border-green-800">
      <div className="flex flex-col items-center">
        <p className="font-medium text-sm text-green-700 dark:text-green-300">Others Owe</p>
        <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-2">
          {formatCurrency(totalCredit)}
        </p>
        <p className="text-xs text-green-500 dark:text-green-400 mt-1">{credits.length} people</p>
      </div>
    </div>

    {/* Net Balance Card (Light Blue) */}
    <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl p-3 text-center shadow-sm border border-blue-100 dark:border-blue-800">
      <div className="flex flex-col items-center">
        <p className="font-medium text-sm text-blue-700 dark:text-blue-300">Net Balance</p>
        <p className={`text-xl font-bold mt-2 ${
            totalCredit - totalDebt >= 0 
            ? 'text-blue-600 dark:text-blue-400' 
            : 'text-red-600 dark:text-red-400'
        }`}>
          {formatCurrency(totalCredit - totalDebt)}
        </p>
        <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
          {totalCredit >= totalDebt ? 'In favor' : 'You owe'}
        </p>
      </div>
    </div>
    
  </div>
</div>

{/* --- END: Edited Mobile-Optimized Code --- */}

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
                      onClick={() => initiateSettlement(debt.id, debt.is_settled)}
                      disabled={processingIds.has(debt.id)}
                      className="flex items-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {debt.is_settled ? (
                        <>
                          <ToggleRight className="w-3 h-3 mr-1" />
                          Settled
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3 h-3 mr-1" />
                          {processingIds.has(debt.id) ? 'Processing...' : 'Mark Paid'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleEditItem(debt)}
                      disabled={processingIds.has(debt.id)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteItem(debt.id)}
                      disabled={processingIds.has(debt.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      onClick={() => initiateSettlement(credit.id, credit.is_settled)}
                      disabled={processingIds.has(credit.id)}
                      className="flex items-center px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {credit.is_settled ? (
                        <>
                          <ToggleRight className="w-3 h-3 mr-1" />
                          Settled
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-3 h-3 mr-1" />
                          {processingIds.has(credit.id) ? 'Processing...' : 'Mark Received'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleEditItem(credit)}
                      disabled={processingIds.has(credit.id)}
                      className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteItem(credit.id)}
                      disabled={processingIds.has(credit.id)}
                      className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            {settled.map((item) => {
              const settlementAccount = accounts.find(acc => acc.id === item.settlement_account_id)
              return (
                <div key={item.id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50 opacity-75">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{item.person_name}</h3>
                    <span className="text-lg font-bold text-gray-600 dark:text-gray-300">{formatCurrency(item.amount)}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{item.description}</p>
                  {settlementAccount && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Settled via: {settlementAccount.name}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      ✓ Settled
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => deleteItem(item.id)}
                        disabled={processingIds.has(item.id)}
                        className="flex items-center px-3 py-1 text-xs bg-red-100 text-red-700 rounded-full hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        {processingIds.has(item.id) ? 'Removing...' : 'Remove'}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Account Selection Modal */}
      {showAccountSelection && pendingSettlementItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Select Account
              </h2>
              <button
                onClick={() => {
                  setShowAccountSelection(false)
                  setPendingSettlementItem(null)
                  setProcessingIds(prev => {
                    const next = new Set(prev)
                    next.delete(pendingSettlementItem.id)
                    return next
                  })
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                {pendingSettlementItem.type === 'credit' 
                  ? `Select the account where you received payment from ${pendingSettlementItem.person_name}:`
                  : `Select the account from which you paid ${pendingSettlementItem.person_name}:`}
              </p>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {accounts.map((account) => (
                  <button
                    key={account.id}
                    onClick={() => handleAccountSelection(account.id)}
                    className="w-full p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Wallet className="w-5 h-5 text-gray-400" />
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{account.name}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Balance: {formatCurrency(account.balance)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {accounts.length === 0 && (
                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                  No active accounts found. Please create an account first.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
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
              {duplicateMessage && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-yellow-700 dark:text-yellow-400 text-sm">{duplicateMessage}</p>
                </div>
              )}
              
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
                  Due Date
                </label>
                <input
                  {...register('due_date', {
                    validate: validateDate
                  })}
                  type="date"
                  min={today}
                  defaultValue={format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                {errors.due_date && (
                  <p className="text-red-500 text-sm mt-1">{errors.due_date.message}</p>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Default: 7 days from today
                </p>
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
                  {isSubmitting 
                    ? (editingItem ? 'Updating...' : 'Adding...')
                    : (editingItem ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}