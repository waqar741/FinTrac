// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { supabase } from '../lib/supabase'
// import { PlusCircle, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react'
// import { 
//   format, 
//   startOfToday, 
//   startOfYesterday, 
//   startOfWeek, 
//   startOfMonth, 
//   startOfYear, 
//   endOfToday, 
//   endOfYesterday, 
//   endOfWeek, 
//   endOfMonth, 
//   endOfYear,
//   subDays,
//   subMonths,
//   subWeeks 
// } from 'date-fns'

// interface Goal {
//   id: string
//   name: string
//   target_amount: number
//   current_amount: number
//   color: string
// }

// interface Account {
//   id: string
//   name: string
//   type: string
//   balance: number
//   color: string
// }

// interface Transaction {
//   id: string
//   amount: number
//   type: string
//   description: string
//   category: string
//   created_at: string
//   accounts: {
//     name: string
//     color: string
//   }
// }

// interface DebtCredit {
//   id: string
//   amount: number
//   type: 'debt' | 'credit'
//   is_settled: boolean
// }

// interface CategorySpending {
//   category: string
//   amount: number
//   percentage: number
// }

// type TimeFilter = 'all' | 'today' | 'yesterday' | 'week' | 'last_week' | 'month' | 'last_month' | 'year' | 'last_7_days' | 'last_30_days'

// export default function Dashboard() {
//   const { user } = useAuth()
//   const [accounts, setAccounts] = useState<Account[]>([])
//   const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
//   const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
//   const [debtsCredits, setDebtsCredits] = useState<DebtCredit[]>([])
//   const [goals, setGoals] = useState<Goal[]>([])
//   const [loading, setLoading] = useState(true)
//   const [timeFilter, setTimeFilter] = useState<TimeFilter>('last_30_days')
//   const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([])
//   const [filteredStats, setFilteredStats] = useState({
//     totalIncome: 0,
//     totalExpenses: 0,
//   })
//   const [stats, setStats] = useState({
//     totalIncome: 0,
//     totalExpenses: 0,
//     totalAccounts: 0,
//     balance: 0,
//     totalDebt: 0,
//     totalCredit: 0
//   })
//   const [showFilterDropdown, setShowFilterDropdown] = useState(false)

//   useEffect(() => {
//     if (user) {
//       fetchDashboardData()
//     }
//   }, [user])

//   useEffect(() => {
//     if (allTransactions.length > 0) {
//       applyTimeFilter()
//     }
//   }, [timeFilter, allTransactions])

//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       const target = event.target as HTMLElement
//       if (showFilterDropdown && !target.closest('.filter-dropdown-container')) {
//         setShowFilterDropdown(false)
//       }
//     }

//     document.addEventListener('mousedown', handleClickOutside)
//     return () => document.removeEventListener('mousedown', handleClickOutside)
//   }, [showFilterDropdown])

//   const getDateRange = () => {
//     const now = new Date()
//     switch (timeFilter) {
//       case 'today':
//         return {
//           start: startOfToday(),
//           end: endOfToday()
//         }
//       case 'yesterday':
//         return {
//           start: startOfYesterday(),
//           end: endOfYesterday()
//         }
//       case 'week':
//         return {
//           start: startOfWeek(now),
//           end: endOfWeek(now)
//         }
//       case 'last_week':
//         return {
//           start: startOfWeek(subWeeks(now, 1)),
//           end: endOfWeek(subWeeks(now, 1))
//         }
//       case 'month':
//         return {
//           start: startOfMonth(now),
//           end: endOfMonth(now)
//         }
//       case 'last_month':
//         return {
//           start: startOfMonth(subMonths(now, 1)),
//           end: endOfMonth(subMonths(now, 1))
//         }
//       case 'year':
//         return {
//           start: startOfYear(now),
//           end: endOfYear(now)
//         }
//       case 'last_7_days':
//         return {
//           start: subDays(now, 7),
//           end: now
//         }
//       case 'last_30_days':
//         return {
//           start: subDays(now, 30),
//           end: now
//         }
//       case 'all':
//       default:
//         return {
//           start: new Date(0),
//           end: new Date()
//         }
//     }
//   }

//   const getFilterLabel = (filter: TimeFilter) => {
//     const labels = {
//       all: 'All Time',
//       today: 'Today',
//       yesterday: 'Yesterday',
//       week: 'This Week',
//       last_week: 'Last Week',
//       month: 'This Month',
//       last_month: 'Last Month',
//       year: 'This Year',
//       last_7_days: 'Last 7 Days',
//       last_30_days: 'Last 30 Days'
//     }
//     return labels[filter]
//   }

//   const applyTimeFilter = () => {
//     const { start, end } = getDateRange()
    
//     const filtered = allTransactions.filter(transaction => {
//       const transactionDate = new Date(transaction.created_at)
//       return transactionDate >= start && transactionDate <= end
//     })

//     setFilteredTransactions(filtered.slice(0, 5))

//     // Calculate filtered stats for income and expenses
//     const totalIncome = filtered
//       .filter(t => t.type === 'income')
//       .reduce((sum, t) => sum + Number(t.amount), 0)
    
//     const totalExpenses = filtered
//       .filter(t => t.type === 'expense')
//       .reduce((sum, t) => sum + Number(t.amount), 0)

//     setFilteredStats({ totalIncome, totalExpenses })

//     // Calculate category spending
//     const expenseTransactions = filtered.filter(t => t.type === 'expense')
//     const totalExpenseAmount = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    
//     const categoryMap = new Map<string, number>()
    
//     expenseTransactions.forEach(transaction => {
//       const category = transaction.category || 'Uncategorized'
//       const amount = Number(transaction.amount)
//       categoryMap.set(category, (categoryMap.get(category) || 0) + amount)
//     })

//     const categoryData: CategorySpending[] = Array.from(categoryMap.entries())
//       .map(([category, amount]) => ({
//         category,
//         amount,
//         percentage: totalExpenseAmount > 0 ? (amount / totalExpenseAmount) * 100 : 0
//       }))
//       .sort((a, b) => b.amount - a.amount)

//     setCategorySpending(categoryData)
//   }

//   const fetchDashboardData = async () => {
//     try {
//       const userId = user?.id
//       if (!userId) return

//       const accountsPromise = supabase
//         .from('accounts')
//         .select('*')
//         .eq('user_id', userId)
//         .eq('is_active', true)

//       const allTransactionsPromise = supabase
//         .from('transactions')
//         .select('*, accounts(name, color)')
//         .eq('user_id', userId)
//         .order('created_at', { ascending: false })

//       const debtsCreditsPromise = supabase
//         .from('debts_credits')
//         .select('id, amount, type, is_settled')
//         .eq('user_id', userId)

//       const [
//         { data: accountsData, error: accountsError },
//         { data: transactionsData, error: transactionsError },
//         { data: debtsCreditsData, error: debtsCreditsError },
//       ] = await Promise.all([
//         accountsPromise,
//         allTransactionsPromise,
//         debtsCreditsPromise,
//       ])

//       const { data: goalsData } = await supabase
//         .from('goals')
//         .select('*')
//         .eq('user_id', userId)
//         .eq('is_active', true)
//         .limit(3)

//       if (accountsError) throw accountsError
//       if (transactionsError) throw transactionsError
//       if (debtsCreditsError) throw debtsCreditsError

//       const fetchedAccountsData = accountsData || []
//       const fetchedTransactionsData = transactionsData || []
//       setAccounts(fetchedAccountsData)
//       setAllTransactions(fetchedTransactionsData)
//       setDebtsCredits(debtsCreditsData || [])
//       setGoals(goalsData || [])

//       if (fetchedTransactionsData && debtsCreditsData) {
//         const totalIncome = fetchedTransactionsData
//           .filter((t) => t.type === 'income')
//           .reduce((sum, t) => sum + Number(t.amount), 0)
        
//         const totalExpenses = fetchedTransactionsData
//           .filter((t) => t.type === 'expense')
//           .reduce((sum, t) => sum + Number(t.amount), 0)
        
//         const totalDebt = debtsCreditsData
//           .filter((d) => d.type === 'debt' && !d.is_settled)
//           .reduce((sum, d) => sum + Number(d.amount), 0)

//         const totalCredit = debtsCreditsData
//           .filter((d) => d.type === 'credit' && !d.is_settled)
//           .reduce((sum, d) => sum + Number(d.amount), 0)

//         const totalAccountBalance = fetchedAccountsData.reduce((sum, a) => sum + (a.balance || 0), 0)

//         setStats({
//           totalIncome,
//           totalExpenses,
//           totalAccounts: fetchedAccountsData.length,
//           balance: totalAccountBalance,
//           totalDebt,
//           totalCredit,
//         })
//       }

//     } catch (error) {
//       console.error('Error fetching dashboard data:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//     }).format(amount)
//   }

//   if (loading) {
//     return (
//       <div className="p-6">
//         <div className="animate-pulse space-y-6">
//           <div className="h-8 bg-gray-200 rounded w-48"></div>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
//       {/* Header */}
//       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
//           <p className="text-gray-600 dark:text-gray-300 mt-1">Your financial dashboard is ready.</p>
//           <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//             Last Updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
//           </p>
//         </div>
        
//         {/* Time Filter Dropdown */}
//         <div className="relative mt-4 sm:mt-0 filter-dropdown-container">
//           <button
//             onClick={() => setShowFilterDropdown(!showFilterDropdown)}
//             className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
//           >
//             <Calendar className="w-4 h-4 text-gray-500" />
//             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//               {getFilterLabel(timeFilter)}
//             </span>
//             <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//             </svg>
//           </button>

//           {showFilterDropdown && (
//             <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
//               <div className="p-2">
//                 <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
//                   Custom Range
//                 </div>
//                 {([
//                   'all',
//                   'today', 
//                   'yesterday',
//                   'last_7_days',
//                   'last_30_days',
//                   'week',
//                   'last_week',
//                   'month',
//                   'last_month',
//                   'year'
//                 ] as TimeFilter[]).map((filter) => (
//                   <button
//                     key={filter}
//                     onClick={() => {
//                       setTimeFilter(filter)
//                       setShowFilterDropdown(false)
//                     }}
//                     className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
//                       timeFilter === filter
//                         ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
//                         : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
//                     }`}
//                   >
//                     {getFilterLabel(filter)}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Stats Cards - Income and Expenses are now DYNAMIC */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         {/* Total Balance - STATIC */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 dark:text-gray-300 text-sm">Total Balance</p>
//               <p className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                 {formatCurrency(stats.balance)}
//               </p>
//             </div>
//             <div className={`p-3 rounded-full ${stats.balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
//               <Wallet className={`w-6 h-6 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
//             </div>
//           </div>
//         </div>

//         {/* Total Income - DYNAMIC */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 dark:text-gray-300 text-sm">Total Income</p>
//               <p className="text-2xl font-bold text-green-600 mt-1">
//                 {formatCurrency(filteredStats.totalIncome)}
//               </p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                 {getFilterLabel(timeFilter)}
//               </p>
//             </div>
//             <div className="p-3 bg-green-100 rounded-full">
//               <TrendingUp className="w-6 h-6 text-green-600" />
//             </div>
//           </div>
//         </div>

//         {/* Total Expenses - DYNAMIC */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 dark:text-gray-300 text-sm">Total Expenses</p>
//               <p className="text-2xl font-bold text-red-600 mt-1">
//                 {formatCurrency(filteredStats.totalExpenses)}
//               </p>
//               <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
//                 {getFilterLabel(timeFilter)}
//               </p>
//             </div>
//             <div className="p-3 bg-red-100 rounded-full">
//               <TrendingDown className="w-6 h-6 text-red-600" />
//             </div>
//           </div>
//         </div>

//         {/* Active Accounts - STATIC */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 dark:text-gray-300 text-sm">Active Accounts</p>
//               <p className="text-2xl font-bold text-blue-600 mt-1">
//                 {stats.totalAccounts}
//               </p>
//             </div>
//             <div className="p-3 bg-blue-100 rounded-full">
//               <PlusCircle className="w-6 h-6 text-blue-600" />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Rest of your components remain the same */}
//       {/* Rest of your components... */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Debts & Credits Overview - STATIC */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Debts & Credits</h2>
//             <Link to="/app/debts-credits" className="text-green-600 hover:text-green-700 text-sm font-medium">
//               View All
//             </Link>
//           </div>
//           <div className="space-y-4">
//             <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
//               <div>
//                 <p className="font-medium text-gray-900 dark:text-white">You Owe</p>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                   {debtsCredits.filter(d => d.type === 'debt').length} {debtsCredits.filter(d => d.type === 'debt').length === 1 ? 'person' : 'people'}
//                 </p>
//               </div>
//               <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalDebt)}</p>
//             </div>
//             <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
//               <div>
//                 <p className="font-medium text-gray-900 dark:text-white">Others Owe You</p>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                   {debtsCredits.filter(d => d.type === 'credit').length} {debtsCredits.filter(d => d.type === 'credit').length === 1 ? 'person' : 'people'}
//                 </p>
//               </div>
//               <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalCredit)}</p>
//             </div>
//           </div>
//         </div>

//         {/* Recent Transactions - DYNAMIC */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <div className="flex items-center justify-between mb-4 sm:mb-6">
//             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
//             <Link to="/app/transactions" className="text-green-600 hover:text-green-700 text-sm font-medium">
//               View All
//             </Link>
//           </div>
//           <div className="space-y-3 sm:space-y-4">
//             {filteredTransactions.length === 0 ? (
//               <p className="text-gray-500 dark:text-gray-400 text-center py-6 sm:py-8">No transactions for this period</p>
//             ) : (
//               filteredTransactions.map((transaction) => (
//                 <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
//                   <div className="flex items-center space-x-3 flex-1 min-w-0">
//                     <div className={`flex-shrink-0 p-2 rounded-full ${
//                       transaction.type === 'income' ? 'bg-green-100 dark:bg-green-500/10' : 'bg-red-100 dark:bg-red-500/10'
//                     }`}>
//                       {transaction.type === 'income' ? (
//                         <ArrowUpRight className="w-4 h-4 text-green-600" />
//                       ) : (
//                         <ArrowDownRight className="w-4 h-4 text-red-600" />
//                       )}
//                     </div>
//                     <div className="min-w-0 flex-1">
//                       <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
//                         {transaction.description}
//                       </p>
//                       <div className="flex items-center space-x-2 mt-1">
//                         <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
//                           {transaction.accounts?.name}
//                         </p>
//                         <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
//                         <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:block">
//                           {format(new Date(transaction.created_at), 'MMM d, yyyy')}
//                         </p>
//                         <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap sm:hidden">
//                           {format(new Date(transaction.created_at), 'MMM d')}
//                         </p>
//                       </div>
//                       <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
//                         {transaction.category}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="text-right ml-3 flex-shrink-0">
//                     <p className={`font-semibold text-sm sm:text-base ${
//                       transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
//                     }`}>
//                       {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
//                     </p>
//                     <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
//                       {transaction.category}
//                     </p>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>
         

//      {/* Account Cards - STATIC */}
//       <div className="space-y-6">
//         <div className="flex items-center justify-between">
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Overview</h2>
//           <Link
//             to="/app/accounts"
//             className="text-green-600 hover:text-green-700 text-sm font-medium"
//           >
//             Manage
//           </Link>
//         </div>
      
//         {accounts.length === 0 ? (
//           <p className="text-gray-500 dark:text-gray-400 text-center py-8">
//             No accounts created yet
//           </p>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {accounts.slice(0, 6).map((account) => (
//               <div
//                 key={account.id}
//                 className="relative bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
//               >
//                 <div 
//                   className="absolute left w-7 h-7 rounded-full mt-5 m2-5"
//                   style={{ backgroundColor: account.color }}
//                 ></div>
      
//                 <div className="mt-2 ml-10">
//                   <p className="text-gray-900 dark:text-white text-lg font-bold">{account.name}</p>
//                   <p className="text-gray-500 dark:text-gray-400 text-sm capitalize">
//                     {account.type.replace('_', ' ')} Account
//                   </p>
//                 </div>
      
//                 <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
      
//                 <div className="flex items-center justify-between">
//                   <p className="text-gray-500 dark:text-gray-400 text-sm">Available Balance</p>
//                   <p
//                     className={`text-2xl font-bold ${
//                       account.balance >= 0 ? 'text-green-600' : 'text-red-600'
//                     }`}
//                   >
//                     {formatCurrency(account.balance)}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Spending by Category Table - DYNAMIC */}
//       <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//         <div className="flex items-center justify-between mb-6">
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Spending by Category</h2>
//           <span className="text-sm text-gray-500 dark:text-gray-400">
//             {getFilterLabel(timeFilter)}
//           </span>
//         </div>
        
//         {categorySpending.length === 0 ? (
//           <p className="text-gray-500 dark:text-gray-400 text-center py-8">
//             No spending recorded for this period
//           </p>
//         ) : (
//           <div className="space-y-4">
//             {categorySpending.map((item, index) => (
//               <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
//                 <div className="flex-1 min-w-0">
//                   <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
//                     {item.category}
//                   </p>
//                 </div>
                
//                 <div className="flex items-center space-x-4">
//                   <p className="text-sm font-semibold text-red-600 whitespace-nowrap">
//                     {formatCurrency(item.amount)}
//                   </p>
                  
//                   <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
//                     <div
//                       className="h-2 rounded-full bg-red-500 transition-all duration-300"
//                       style={{ width: `${Math.min(item.percentage, 100)}%` }}
//                     />
//                   </div>
                  
//                   <p className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
//                     {item.percentage.toFixed(1)}%
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>




//       {/* Goals Overview - STATIC */}
//       {goals.length > 0 && (
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Goals Progress</h2>
//             <Link to="/app/goals" className="text-green-600 hover:text-green-700 text-sm font-medium">
//               View All
//             </Link>
//           </div>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {goals.map((goal) => {
//               const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
//               return (
//                 <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//                   <div className="flex items-center justify-between mb-4">
//                     <h3 className="font-medium text-gray-900 dark:text-white">{goal.name}</h3>
//                     <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
//                       {progress.toFixed(1)}%
//                     </span>
//                   </div>
//                   <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
//                     <div
//                       className="h-2 rounded-full transition-all duration-300"
//                       style={{ 
//                         width: `${progress}%`,
//                         backgroundColor: progress >= 100 ? '#10B981' : goal.color
//                       }}
//                     />
//                   </div>
//                   <div className="flex items-center justify-between text-sm">
//                     <span className="text-gray-600 dark:text-gray-300">
//                       {formatCurrency(goal.current_amount)}
//                     </span>
//                     <span className="text-gray-600 dark:text-gray-300">
//                       {formatCurrency(goal.target_amount)}
//                     </span>
//                   </div>
//                 </div>
//               )
//             })}
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }







import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { PlusCircle, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react'
import { 
  format, 
  startOfToday, 
  startOfYesterday, 
  startOfWeek, 
  startOfMonth, 
  startOfYear, 
  endOfToday, 
  endOfYesterday, 
  endOfWeek, 
  endOfMonth, 
  endOfYear,
  subDays,
  subMonths,
  subWeeks 
} from 'date-fns'

interface Goal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  color: string
}

interface Account {
  id: string
  name: string
  type: string
  balance: number
  color: string
  is_default: boolean
  created_at: string
}

interface Transaction {
  id: string
  amount: number
  type: string
  description: string
  category: string
  created_at: string
  accounts: {
    name: string
    color: string
  }
}

interface DebtCredit {
  id: string
  amount: number
  type: 'debt' | 'credit'
  is_settled: boolean
}

interface CategorySpending {
  category: string
  amount: number
  percentage: number
}

type TimeFilter = 'all' | 'today' | 'yesterday' | 'week' | 'last_week' | 'month' | 'last_month' | 'year' | 'last_7_days' | 'last_30_days'

export default function Dashboard() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [debtsCredits, setDebtsCredits] = useState<DebtCredit[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('last_30_days')
  const [categorySpending, setCategorySpending] = useState<CategorySpending[]>([])
  const [filteredStats, setFilteredStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
  })
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalAccounts: 0,
    balance: 0,
    totalDebt: 0,
    totalCredit: 0
  })
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  useEffect(() => {
    if (allTransactions.length > 0) {
      applyTimeFilter()
    }
  }, [timeFilter, allTransactions])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (showFilterDropdown && !target.closest('.filter-dropdown-container')) {
        setShowFilterDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFilterDropdown])

  const getDateRange = () => {
    const now = new Date()
    switch (timeFilter) {
      case 'today':
        return {
          start: startOfToday(),
          end: endOfToday()
        }
      case 'yesterday':
        return {
          start: startOfYesterday(),
          end: endOfYesterday()
        }
      case 'week':
        return {
          start: startOfWeek(now),
          end: endOfWeek(now)
        }
      case 'last_week':
        return {
          start: startOfWeek(subWeeks(now, 1)),
          end: endOfWeek(subWeeks(now, 1))
        }
      case 'month':
        return {
          start: startOfMonth(now),
          end: endOfMonth(now)
        }
      case 'last_month':
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1))
        }
      case 'year':
        return {
          start: startOfYear(now),
          end: endOfYear(now)
        }
      case 'last_7_days':
        return {
          start: subDays(now, 7),
          end: now
        }
      case 'last_30_days':
        return {
          start: subDays(now, 30),
          end: now
        }
      case 'all':
      default:
        return {
          start: new Date(0),
          end: new Date()
        }
    }
  }

  const getFilterLabel = (filter: TimeFilter) => {
    const labels = {
      all: 'All Time',
      today: 'Today',
      yesterday: 'Yesterday',
      week: 'This Week',
      last_week: 'Last Week',
      month: 'This Month',
      last_month: 'Last Month',
      year: 'This Year',
      last_7_days: 'Last 7 Days',
      last_30_days: 'Last 30 Days'
    }
    return labels[filter]
  }

  const applyTimeFilter = () => {
    const { start, end } = getDateRange()
    
    const filtered = allTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.created_at)
      return transactionDate >= start && transactionDate <= end
    })

    setFilteredTransactions(filtered.slice(0, 5))

    // Calculate filtered stats for income and expenses
    const totalIncome = filtered
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
    
    const totalExpenses = filtered
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)

    setFilteredStats({ totalIncome, totalExpenses })

    // Calculate category spending
    const expenseTransactions = filtered.filter(t => t.type === 'expense')
    const totalExpenseAmount = expenseTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
    
    const categoryMap = new Map<string, number>()
    
    expenseTransactions.forEach(transaction => {
      const category = transaction.category || 'Uncategorized'
      const amount = Number(transaction.amount)
      categoryMap.set(category, (categoryMap.get(category) || 0) + amount)
    })

    const categoryData: CategorySpending[] = Array.from(categoryMap.entries())
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: totalExpenseAmount > 0 ? (amount / totalExpenseAmount) * 100 : 0
      }))
      .sort((a, b) => b.amount - a.amount)

    setCategorySpending(categoryData)
  }

  const fetchDashboardData = async () => {
    try {
      const userId = user?.id
      if (!userId) return

      const accountsPromise = supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('is_default', { ascending: false }) // Default accounts first
        .order('created_at', { ascending: false }) // Then newest first

      const allTransactionsPromise = supabase
        .from('transactions')
        .select('*, accounts(name, color)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      const debtsCreditsPromise = supabase
        .from('debts_credits')
        .select('id, amount, type, is_settled')
        .eq('user_id', userId)

      const [
        { data: accountsData, error: accountsError },
        { data: transactionsData, error: transactionsError },
        { data: debtsCreditsData, error: debtsCreditsError },
      ] = await Promise.all([
        accountsPromise,
        allTransactionsPromise,
        debtsCreditsPromise,
      ])

      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(3)

      if (accountsError) throw accountsError
      if (transactionsError) throw transactionsError
      if (debtsCreditsError) throw debtsCreditsError

      const fetchedAccountsData = accountsData || []
      const fetchedTransactionsData = transactionsData || []
      
      // Client-side sorting as fallback
      const sortedAccounts = [...fetchedAccountsData].sort((a, b) => {
        if (a.is_default && !b.is_default) return -1
        if (!a.is_default && b.is_default) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })

      setAccounts(sortedAccounts)
      setAllTransactions(fetchedTransactionsData)
      setDebtsCredits(debtsCreditsData || [])
      setGoals(goalsData || [])

      if (fetchedTransactionsData && debtsCreditsData) {
        const totalIncome = fetchedTransactionsData
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0)
        
        const totalExpenses = fetchedTransactionsData
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)
        
        const totalDebt = debtsCreditsData
          .filter((d) => d.type === 'debt' && !d.is_settled)
          .reduce((sum, d) => sum + Number(d.amount), 0)

        const totalCredit = debtsCreditsData
          .filter((d) => d.type === 'credit' && !d.is_settled)
          .reduce((sum, d) => sum + Number(d.amount), 0)

        const totalAccountBalance = fetchedAccountsData.reduce((sum, a) => sum + (a.balance || 0), 0)

        setStats({
          totalIncome,
          totalExpenses,
          totalAccounts: fetchedAccountsData.length,
          balance: totalAccountBalance,
          totalDebt,
          totalCredit,
        })
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Your financial dashboard is ready.</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Last Updated: {format(new Date(), 'MMM d, yyyy h:mm a')}
          </p>
        </div>
        
        {/* Time Filter Dropdown */}
        <div className="relative mt-4 sm:mt-0 filter-dropdown-container">
          <button
            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
            className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Calendar className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {getFilterLabel(timeFilter)}
            </span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showFilterDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
              <div className="p-2">
                <div className="px-3 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Custom Range
                </div>
                {([
                  'all',
                  'today', 
                  'yesterday',
                  'last_7_days',
                  'last_30_days',
                  'week',
                  'last_week',
                  'month',
                  'last_month',
                  'year'
                ] as TimeFilter[]).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => {
                      setTimeFilter(filter)
                      setShowFilterDropdown(false)
                    }}
                    className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                      timeFilter === filter
                        ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {getFilterLabel(filter)}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards - Income and Expenses are now DYNAMIC */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Balance - STATIC */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Total Balance</p>
              <p className={`text-2xl font-bold mt-1 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(stats.balance)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${stats.balance >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <Wallet className={`w-6 h-6 ${stats.balance >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
          </div>
        </div>

        {/* Total Income - DYNAMIC */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Total Income</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(filteredStats.totalIncome)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {getFilterLabel(timeFilter)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Expenses - DYNAMIC */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(filteredStats.totalExpenses)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {getFilterLabel(timeFilter)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

        {/* Active Accounts - STATIC */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Active Accounts</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.totalAccounts}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <PlusCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Rest of your components remain the same */}
      {/* Rest of your components... */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debts & Credits Overview - STATIC */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Debts & Credits</h2>
            <Link to="/app/debts-credits" className="text-green-600 hover:text-green-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">You Owe</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {debtsCredits.filter(d => d.type === 'debt').length} {debtsCredits.filter(d => d.type === 'debt').length === 1 ? 'person' : 'people'}
                </p>
              </div>
              <p className="text-lg font-bold text-red-600">{formatCurrency(stats.totalDebt)}</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Others Owe You</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {debtsCredits.filter(d => d.type === 'credit').length} {debtsCredits.filter(d => d.type === 'credit').length === 1 ? 'person' : 'people'}
                </p>
              </div>
              <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalCredit)}</p>
            </div>
          </div>
        </div>

        {/* Recent Transactions - DYNAMIC */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
            <Link to="/app/transactions" className="text-green-600 hover:text-green-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-3 sm:space-y-4">
            {filteredTransactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6 sm:py-8">No transactions for this period</p>
            ) : (
              filteredTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <div className={`flex-shrink-0 p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-100 dark:bg-green-500/10' : 'bg-red-100 dark:bg-red-500/10'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 dark:text-white text-sm sm:text-base truncate">
                        {transaction.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {transaction.accounts?.name}
                        </p>
                        <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap hidden sm:block">
                          {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap sm:hidden">
                          {format(new Date(transaction.created_at), 'MMM d')}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {transaction.category}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-3 flex-shrink-0">
                    <p className={`font-semibold text-sm sm:text-base ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 hidden sm:block">
                      {transaction.category}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
         

     {/* Account Cards - SORTED: Default first, then newest first */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Overview</h2>
          <Link
            to="/app/accounts"
            className="text-green-600 hover:text-green-700 text-sm font-medium"
          >
            Manage
          </Link>
        </div>
      
        {accounts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No accounts created yet
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.slice(0, 6).map((account) => (
              <div
                key={account.id}
                className={`relative bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm hover:shadow-md transition-all ${
                  account.is_default 
                    ? 'border-blue-300 dark:border-blue-700' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {account.is_default && (
                  <div className="absolute -top-2 -left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Default
                  </div>
                )}
                
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex-shrink-0"
                    style={{ backgroundColor: account.color }}
                  ></div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-white text-lg font-bold truncate">
                      {account.name}
                    </p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm capitalize">
                      {account.type.replace('_', ' ')} Account
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>

                <div className="flex items-center justify-between">
                  <p className="text-gray-500 dark:text-gray-400 text-sm">Available Balance</p>
                  <p
                    className={`text-2xl font-bold ${
                      account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {formatCurrency(account.balance)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spending by Category Table - DYNAMIC */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Spending by Category</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {getFilterLabel(timeFilter)}
          </span>
        </div>
        
        {categorySpending.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No spending recorded for this period
          </p>
        ) : (
          <div className="space-y-4">
            {categorySpending.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {item.category}
                  </p>
                </div>
                
                <div className="flex items-center space-x-4">
                  <p className="text-sm font-semibold text-red-600 whitespace-nowrap">
                    {formatCurrency(item.amount)}
                  </p>
                  
                  <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-red-500 transition-all duration-300"
                      style={{ width: `${Math.min(item.percentage, 100)}%` }}
                    />
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400 w-12 text-right">
                    {item.percentage.toFixed(1)}%
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Goals Overview - STATIC */}
      {goals.length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Goals Progress</h2>
            <Link to="/app/goals" className="text-green-600 hover:text-green-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map((goal) => {
              const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100)
              return (
                <div key={goal.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-900 dark:text-white">{goal.name}</h3>
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                      {progress.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-3">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${progress}%`,
                        backgroundColor: progress >= 100 ? '#10B981' : goal.color
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-300">
                      {formatCurrency(goal.current_amount)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      {formatCurrency(goal.target_amount)}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}