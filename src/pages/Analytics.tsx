// import { useState, useEffect } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// import { supabase } from '../lib/supabase'
// import { 
//   PieChart, 
//   Pie, 
//   Cell, 
//   BarChart, 
//   Bar, 
//   XAxis, 
//   YAxis, 
//   CartesianGrid, 
//   Tooltip, 
//   Legend,
//   ResponsiveContainer,
//   LineChart,
//   Line
// } from 'recharts'
// import { format, subMonths, startOfMonth } from 'date-fns'

// interface Transaction {
//   id: string
//   amount: number
//   type: 'income' | 'expense'
//   description: string
//   category: string
//   created_at: string
//   budgets: {
//     name: string
//     color: string
//   }
// }

// interface ChartData {
//   name: string
//   value: number
//   color: string
// }

// interface MonthlyData {
//   month: string
//   income: number
//   expenses: number
//   net: number
// }

// export default function Analytics() {
//   const { user } = useAuth()
//   const [transactions, setTransactions] = useState<Transaction[]>([])
//   const [loading, setLoading] = useState(true)
//   const [selectedPeriod, setSelectedPeriod] = useState('6months')

//   useEffect(() => {
//     if (user) {
//       fetchTransactions()
//     }
//   }, [user, selectedPeriod])

//   const fetchTransactions = async () => {
//     try {
//       let query = supabase
//         .from('transactions')
//         .select(`
//           *,
//           budgets (
//             name,
//             color
//           )
//         `)
//         .eq('user_id', user?.id)

//       // Add date filter based on selected period
//       if (selectedPeriod !== 'all') {
//         const months = selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12
//         const startDate = startOfMonth(subMonths(new Date(), months - 1))
//         query = query.gte('created_at', startDate.toISOString())
//       }

//       const { data, error } = await query.order('created_at', { ascending: true })

//       if (error) throw error
//       if (data) setTransactions(data)
//     } catch (error) {
//       console.error('Error fetching transactions:', error)
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

//   // Calculate budget distribution
//   const budgetDistribution: ChartData[] = transactions
//     .filter(t => t.type === 'expense')
//     .reduce((acc, transaction) => {
//       const budgetName = transaction.budgets.name
//       const existing = acc.find(item => item.name === budgetName)
      
//       if (existing) {
//         existing.value += Number(transaction.amount)
//       } else {
//         acc.push({
//           name: budgetName,
//           value: Number(transaction.amount),
//           color: transaction.budgets.color
//         })
//       }
      
//       return acc
//     }, [] as ChartData[])

//   // Calculate category distribution
//   const categoryDistribution: ChartData[] = transactions
//     .filter(t => t.type === 'expense')
//     .reduce((acc, transaction) => {
//       const category = transaction.category || 'Other'
//       const existing = acc.find(item => item.name === category)
      
//       if (existing) {
//         existing.value += Number(transaction.amount)
//       } else {
//         acc.push({
//           name: category,
//           value: Number(transaction.amount),
//           color: `hsl(${Math.random() * 360}, 70%, 50%)`
//         })
//       }
      
//       return acc
//     }, [] as ChartData[])

//   // Calculate monthly trends
//   const monthlyTrends: MonthlyData[] = transactions
//     .reduce((acc, transaction) => {
//       const month = format(new Date(transaction.created_at), 'MMM yyyy')
//       const existing = acc.find(item => item.month === month)
//       const amount = Number(transaction.amount)
      
//       if (existing) {
//         if (transaction.type === 'income') {
//           existing.income += amount
//         } else {
//           existing.expenses += amount
//         }
//         existing.net = existing.income - existing.expenses
//       } else {
//         acc.push({
//           month,
//           income: transaction.type === 'income' ? amount : 0,
//           expenses: transaction.type === 'expense' ? amount : 0,
//           net: transaction.type === 'income' ? amount : -amount
//         })
//       }
      
//       return acc
//     }, [] as MonthlyData[])
//     .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())

//   // Calculate totals
//   const totalIncome = transactions
//     .filter(t => t.type === 'income')
//     .reduce((sum, t) => sum + Number(t.amount), 0)
  
//   const totalExpenses = transactions
//     .filter(t => t.type === 'expense')
//     .reduce((sum, t) => sum + Number(t.amount), 0)

//   if (loading) {
//     return (
//       <div className="p-6">
//         <div className="animate-pulse space-y-6">
//           <div className="h-8 bg-gray-200 rounded w-48"></div>
//           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//             {[1, 2, 3, 4].map((i) => (
//               <div key={i} className="h-96 bg-gray-200 rounded-xl"></div>
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
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
//           <p className="text-gray-600 dark:text-gray-300 mt-1">Visualize your spending patterns</p>
//         </div>
//         <select
//           value={selectedPeriod}
//           onChange={(e) => setSelectedPeriod(e.target.value)}
//           className="mt-4 sm:mt-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
//         >
//           <option value="3months">Last 3 months</option>
//           <option value="6months">Last 6 months</option>
//           <option value="12months">Last 12 months</option>
//           <option value="all">All time</option>
//         </select>
//       </div>

//       {/* Summary Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Income</h3>
//           <p className="text-2xl font-bold text-green-600 mt-2">
//             {formatCurrency(totalIncome)}
//           </p>
//         </div>
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Expenses</h3>
//           <p className="text-2xl font-bold text-red-600 mt-2">
//             {formatCurrency(totalExpenses)}
//           </p>
//         </div>
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Net Balance</h3>
//           <p className={`text-2xl font-bold mt-2 ${
//             totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
//           }`}>
//             {formatCurrency(totalIncome - totalExpenses)}
//           </p>
//         </div>
//       </div>

//       {/* Charts Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Budget Distribution */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expenses by Budget</h3>
//           {budgetDistribution.length > 0 ? (
//             <ResponsiveContainer width="100%" height={300}>
//               <PieChart>
//                 <Pie
//                   data={budgetDistribution}
//                   cx="50%"
//                   cy="50%"
//                   labelLine={false}
//                   label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
//                   outerRadius={80}
//                   fill="#8884d8"
//                   dataKey="value"
//                 >
//                   {budgetDistribution.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip formatter={(value) => formatCurrency(Number(value))} />
//               </PieChart>
//             </ResponsiveContainer>
//           ) : (
//             <div className="flex items-center justify-center h-72 text-gray-500 dark:text-gray-400">
//               No expense data available
//             </div>
//           )}
//         </div>

//         {/* Category Distribution */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expenses by Category</h3>
//           {categoryDistribution.length > 0 ? (
//             <ResponsiveContainer width="100%" height={300}>
//               <PieChart>
//                 <Pie
//                   data={categoryDistribution}
//                   cx="50%"
//                   cy="50%"
//                   labelLine={false}
//                   label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
//                   outerRadius={80}
//                   fill="#8884d8"
//                   dataKey="value"
//                 >
//                   {categoryDistribution.map((entry, index) => (
//                     <Cell key={`cell-${index}`} fill={entry.color} />
//                   ))}
//                 </Pie>
//                 <Tooltip formatter={(value) => formatCurrency(Number(value))} />
//               </PieChart>
//             </ResponsiveContainer>
//           ) : (
//             <div className="flex items-center justify-center h-72 text-gray-500 dark:text-gray-400">
//               No expense data available
//             </div>
//           )}
//         </div>
//       </div>

//       {/* Monthly Trends */}
//       <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Income vs Expenses</h3>
//         {monthlyTrends.length > 0 ? (
//           <ResponsiveContainer width="100%" height={400}>
//             <BarChart data={monthlyTrends}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
//               <Tooltip formatter={(value) => formatCurrency(Number(value))} />
//               <Legend />
//               <Bar dataKey="income" fill="#10B981" name="Income" />
//               <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
//             </BarChart>
//           </ResponsiveContainer>
//         ) : (
//           <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
//             No transaction data available
//           </div>
//         )}
//       </div>

//       {/* Net Balance Trend */}
//       <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Net Balance Trend</h3>
//         {monthlyTrends.length > 0 ? (
//           <ResponsiveContainer width="100%" height={300}>
//             <LineChart data={monthlyTrends}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="month" />
//               <YAxis tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
//               <Tooltip formatter={(value) => formatCurrency(Number(value))} />
//               <Line 
//                 type="monotone" 
//                 dataKey="net" 
//                 stroke="#3B82F6" 
//                 strokeWidth={3}
//                 name="Net Balance"
//               />
//             </LineChart>
//           </ResponsiveContainer>
//         ) : (
//           <div className="flex items-center justify-center h-72 text-gray-500 dark:text-gray-400">
//             No transaction data available
//           </div>
//         )}
//       </div>
//     </div>
//   )
// }




import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import { format, subMonths, startOfMonth } from 'date-fns'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  category: string
  created_at: string
  budgets: {
    name: string
    color: string
  } | null // Allow budgets to be null
}

interface ChartData {
  name: string
  value: number
  color: string
}

interface MonthlyData {
  month: string
  income: number
  expenses: number
  net: number
}

export default function Analytics() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('6months')

  useEffect(() => {
    if (user) {
      fetchTransactions()
    }
  }, [user, selectedPeriod])

  const fetchTransactions = async () => {
    try {
      setLoading(true); // Set loading true at the start of fetch
      let query = supabase
        .from('transactions')
        .select(`
          *,
          budgets (
            name,
            color
          )
        `)
        .eq('user_id', user?.id)

      if (selectedPeriod !== 'all') {
        const months = selectedPeriod === '3months' ? 3 : selectedPeriod === '6months' ? 6 : 12
        const startDate = startOfMonth(subMonths(new Date(), months - 1))
        query = query.gte('created_at', startDate.toISOString())
      }

      const { data, error } = await query.order('created_at', { ascending: true })

      if (error) throw error
      if (data) setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
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

  // ✅ Memoized budget distribution calculation
  const budgetDistribution = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const budgetName = transaction.budgets?.name || 'Uncategorized' // Safety check
        const existing = acc.find(item => item.name === budgetName)
        
        if (existing) {
          existing.value += Number(transaction.amount)
        } else {
          acc.push({
            name: budgetName,
            value: Number(transaction.amount),
            color: transaction.budgets?.color || '#A9A9A9' // Safety check
          })
        }
        
        return acc
      }, [] as ChartData[])
  }, [transactions])

  // ✅ Memoized category distribution calculation
  const categoryDistribution = useMemo(() => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const category = transaction.category || 'Other'
        const existing = acc.find(item => item.name === category)
        
        if (existing) {
          existing.value += Number(transaction.amount)
        } else {
          acc.push({
            name: category,
            value: Number(transaction.amount),
            color: `hsl(${Math.random() * 360}, 70%, 50%)` // Color is now stable
          })
        }
        
        return acc
      }, [] as ChartData[])
  }, [transactions])

  // ✅ Memoized monthly trends calculation
  const monthlyTrends = useMemo(() => {
    return transactions
      .reduce((acc, transaction) => {
        const month = format(new Date(transaction.created_at), 'MMM yyyy')
        const existing = acc.find(item => item.month === month)
        const amount = Number(transaction.amount)
        
        if (existing) {
          if (transaction.type === 'income') {
            existing.income += amount
          } else {
            existing.expenses += amount
          }
          existing.net = existing.income - existing.expenses
        } else {
          acc.push({
            month,
            income: transaction.type === 'income' ? amount : 0,
            expenses: transaction.type === 'expense' ? amount : 0,
            net: transaction.type === 'income' ? amount : -amount
          })
        }
        
        return acc
      }, [] as MonthlyData[])
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime())
  }, [transactions])

  // ✅ Memoized totals calculations
  const totalIncome = useMemo(() => 
    transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  , [transactions])
  
  const totalExpenses = useMemo(() =>
    transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0)
  , [transactions])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-96 bg-gray-200 rounded-xl"></div>
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Visualize your spending patterns</p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="mt-4 sm:mt-0 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="3months">Last 3 months</option>
          <option value="6months">Last 6 months</option>
          <option value="12months">Last 12 months</option>
          <option value="all">All time</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Income</h3>
          <p className="text-2xl font-bold text-green-600 mt-2">
            {formatCurrency(totalIncome)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Total Expenses</h3>
          <p className="text-2xl font-bold text-red-600 mt-2">
            {formatCurrency(totalExpenses)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300">Net Balance</h3>
          <p className={`text-2xl font-bold mt-2 ${
            totalIncome - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(totalIncome - totalExpenses)}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expenses by Budget</h3>
          {budgetDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={budgetDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {budgetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-72 text-gray-500 dark:text-gray-400">
              No expense data available
            </div>
          )}
        </div>

        {/* Category Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Expenses by Category</h3>
          {categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-72 text-gray-500 dark:text-gray-400">
              No expense data available
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Income vs Expenses</h3>
        {monthlyTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₹${(Number(value) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Legend />
              <Bar dataKey="income" fill="#10B981" name="Income" />
              <Bar dataKey="expenses" fill="#EF4444" name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-96 text-gray-500 dark:text-gray-400">
            No transaction data available
          </div>
        )}
      </div>

      {/* Net Balance Trend */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Net Balance Trend</h3>
        {monthlyTrends.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `₹${(Number(value) / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              <Line 
                type="monotone" 
                dataKey="net" 
                stroke="#3B82F6" 
                strokeWidth={3}
                name="Net Balance"
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-72 text-gray-500 dark:text-gray-400">
            No transaction data available
          </div>
        )}
      </div>
    </div>
  )
}