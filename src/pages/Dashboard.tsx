// import { useState, useEffect } from 'react'
// import { Link } from 'react-router-dom'
// import { useAuth } from '../contexts/AuthContext'
// import { supabase } from '../lib/supabase'
// import { PlusCircle, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
// import { format } from 'date-fns'

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

// export default function Dashboard() {
//   const { user } = useAuth()
//   const [accounts, setAccounts] = useState<Account[]>([])
//   const [transactions, setTransactions] = useState<Transaction[]>([])
//   const [debtsCredits, setDebtsCredits] = useState<DebtCredit[]>([])
//   const [goals, setGoals] = useState<Goal[]>([])
//   const [loading, setLoading] = useState(true)
//   const [stats, setStats] = useState({
//     totalIncome: 0,
//     totalExpenses: 0,
//     totalAccounts: 0,
//     balance: 0,
//     totalDebt: 0,
//     totalCredit: 0
//   })

//   useEffect(() => {
//     if (user) {
//       fetchDashboardData()
//     }
//   }, [user])

//   const fetchDashboardData = async () => {
//     try {
//       const userId = user?.id
//       if (!userId) return

//       // Define all the promises for parallel fetching
//       const accountsPromise = supabase
//         .from('accounts')
//         .select('*')
//         .eq('user_id', userId)
//         .eq('is_active', true)

//       const recentTransactionsPromise = supabase
//         .from('transactions')
//         .select('*, accounts(name, color)')
//         .eq('user_id', userId)
//         .order('created_at', { ascending: false })
//         .limit(5)

//       const debtsCreditsPromise = supabase
//         .from('debts_credits')
//         .select('id, amount, type, is_settled')
//         .eq('user_id', userId)

//       const allTransactionsPromise = supabase
//         .from('transactions')
//         .select('amount, type')
//         .eq('user_id', userId)

//       // Await all promises to run in parallel
//       const [
//         { data: accountsData, error: accountsError },
//         { data: recentTransactionsData, error: transactionsError },
//         { data: debtsCreditsData, error: debtsCreditsError },
//         { data: allTransactions, error: allTransactionsError },
//       ] = await Promise.all([
//         accountsPromise,
//         recentTransactionsPromise,
//         debtsCreditsPromise,
//         allTransactionsPromise,
//       ])

//       // Fetch goals
//       const { data: goalsData } = await supabase
//         .from('goals')
//         .select('*')
//         .eq('user_id', userId)
//         .eq('is_active', true)
//         .limit(3)

//       // Handle potential errors from any query
//       if (accountsError) throw accountsError
//       if (transactionsError) throw transactionsError
//       if (debtsCreditsError) throw debtsCreditsError
//       if (allTransactionsError) throw allTransactionsError

//       // Set state with the fetched data
//       const fetchedAccountsData = accountsData || []
//       setAccounts(fetchedAccountsData)
//       setTransactions(recentTransactionsData || [])
//       setDebtsCredits(debtsCreditsData || [])
//       setGoals(goalsData || [])

//       // Perform calculations
//       if (allTransactions && debtsCreditsData) {
//         const totalIncome = allTransactions
//           .filter((t) => t.type === 'income')
//           .reduce((sum, t) => sum + Number(t.amount), 0)
        
//         const totalExpenses = allTransactions
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
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 dark:text-gray-300 text-sm">Total Income</p>
//               <p className="text-2xl font-bold text-green-600 mt-1">
//                 {formatCurrency(stats.totalIncome)}
//               </p>
//             </div>
//             <div className="p-3 bg-green-100 rounded-full">
//               <TrendingUp className="w-6 h-6 text-green-600" />
//             </div>
//           </div>
//         </div>

//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <div className="flex items-center justify-between">
//             <div>
//               <p className="text-gray-600 dark:text-gray-300 text-sm">Total Expenses</p>
//               <p className="text-2xl font-bold text-red-600 mt-1">
//                 {formatCurrency(stats.totalExpenses)}
//               </p>
//             </div>
//             <div className="p-3 bg-red-100 rounded-full">
//               <TrendingDown className="w-6 h-6 text-red-600" />
//             </div>
//           </div>
//         </div>

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

//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Debts & Credits Overview */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Debts & Credits</h2>
//             <Link to="/debts-credits" className="text-green-600 hover:text-green-700 text-sm font-medium">
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

//         {/* Recent Transactions */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <div className="flex items-center justify-between mb-6">
//             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
//             <Link to="/transactions" className="text-green-600 hover:text-green-700 text-sm font-medium">
//               View All
//             </Link>
//           </div>
//           <div className="space-y-4">
//             {transactions.length === 0 ? (
//               <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions yet</p>
//             ) : (
//               transactions.map((transaction) => (
//                 <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
//                   <div className="flex items-center space-x-3">
//                     <div className={`p-2 rounded-full ${
//                       transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
//                     }`}>
//                       {transaction.type === 'income' ? (
//                         <ArrowUpRight className="w-4 h-4 text-green-600" />
//                       ) : (
//                         <ArrowDownRight className="w-4 h-4 text-red-600" />
//                       )}
//                     </div>
//                     <div>
//                       <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
//                       <p className="text-sm text-gray-500 dark:text-gray-400">
//                         {transaction.accounts?.name} • {format(new Date(transaction.created_at), 'MMM d, yyyy')}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <p className={`font-semibold ${
//                       transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
//                     }`}>
//                       {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
//                     </p>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category}</p>
//                   </div>
//                 </div>
//               ))
//             )}
//           </div>
//         </div>
//       </div>

//       {/* Goals Overview */}
//       {goals.length > 0 && (
//         <div className="space-y-6">
//           <div className="flex items-center justify-between">
//             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Goals Progress</h2>
//             <Link to="/goals" className="text-green-600 hover:text-green-700 text-sm font-medium">
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

//       {/* Account Cards */}
//       <div className="space-y-6">
//         <div className="flex items-center justify-between">
//           <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Account Overview</h2>
//           <Link to="/accounts" className="text-green-600 hover:text-green-700 text-sm font-medium">
//             Manage
//           </Link>
//         </div>
//         {accounts.length === 0 ? (
//           <p className="text-gray-500 dark:text-gray-400 text-center py-8">No accounts created yet</p>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {accounts.slice(0, 6).map((account) => (
//               <div key={account.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="flex items-center space-x-3">
//                     <div 
//                       className="w-4 h-4 rounded-full"
//                       style={{ backgroundColor: account.color }}
//                     />
//                     <span className="font-medium text-gray-900 dark:text-white">{account.name}</span>
//                   </div>
//                 </div>
//                 <div className="text-right">
//                   <p className={`text-2xl font-bold ${
//                     account.balance >= 0 ? 'text-green-600' : 'text-red-600'
//                   }`}>
//                     {formatCurrency(account.balance)}
//                   </p>
//                   <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 capitalize">
//                     {account.type.replace('_', ' ')}
//                   </p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { PlusCircle, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { format } from 'date-fns'

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

export default function Dashboard() {
  const { user } = useAuth()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [debtsCredits, setDebtsCredits] = useState<DebtCredit[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalAccounts: 0,
    balance: 0,
    totalDebt: 0,
    totalCredit: 0
  })

  useEffect(() => {
    if (user) {
      fetchDashboardData()
    }
  }, [user])

  const fetchDashboardData = async () => {
    try {
      const userId = user?.id
      if (!userId) return

      // Define all the promises for parallel fetching
      const accountsPromise = supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)

      const recentTransactionsPromise = supabase
        .from('transactions')
        .select('*, accounts(name, color)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      const debtsCreditsPromise = supabase
        .from('debts_credits')
        .select('id, amount, type, is_settled')
        .eq('user_id', userId)

      const allTransactionsPromise = supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', userId)

      // Await all promises to run in parallel
      const [
        { data: accountsData, error: accountsError },
        { data: recentTransactionsData, error: transactionsError },
        { data: debtsCreditsData, error: debtsCreditsError },
        { data: allTransactions, error: allTransactionsError },
      ] = await Promise.all([
        accountsPromise,
        recentTransactionsPromise,
        debtsCreditsPromise,
        allTransactionsPromise,
      ])

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(3)

      // Handle potential errors from any query
      if (accountsError) throw accountsError
      if (transactionsError) throw transactionsError
      if (debtsCreditsError) throw debtsCreditsError
      if (allTransactionsError) throw allTransactionsError

      // Set state with the fetched data
      const fetchedAccountsData = accountsData || []
      setAccounts(fetchedAccountsData)
      setTransactions(recentTransactionsData || [])
      setDebtsCredits(debtsCreditsData || [])
      setGoals(goalsData || [])

      // Perform calculations
      if (allTransactions && debtsCreditsData) {
        const totalIncome = allTransactions
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0)
        
        const totalExpenses = allTransactions
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
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Total Income</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {formatCurrency(stats.totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600 mt-1">
                {formatCurrency(stats.totalExpenses)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Debts & Credits Overview */}
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

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Transactions</h2>
            <Link to="/app/transactions" className="text-green-600 hover:text-green-700 text-sm font-medium">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">No transactions yet</p>
            ) : (
              transactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{transaction.description}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.accounts?.name} • {format(new Date(transaction.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Number(transaction.amount))}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{transaction.category}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Goals Overview */}
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

      {/* Account Cards */}
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
                className="relative bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all"
              >
                {/* Dynamic Color Dot */}
                <div 
                  className="absolute left w-7 h-7 rounded-full mt-5 m2-5"
                  style={{ backgroundColor: account.color }}
                ></div>
      
                {/* Account Info */}
                <div className="mt-2 ml-10">
                  <p className="text-gray-900 dark:text-white text-lg font-bold">{account.name}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm capitalize">
                    {account.type.replace('_', ' ')} Account
                  </p>
                </div>
      
                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
      
                {/* Balance Section */}
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
    </div>
  )
}