import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { PlusCircle, TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { format } from 'date-fns'

interface Budget {
  id: string
  name: string
  type: string
  allocated_amount: number
  current_balance: number
  color: string
  parent_id: string | null
  children?: Budget[]
}

interface Transaction {
  id: string
  amount: number
  type: string
  description: string
  category: string
  created_at: string
  budgets: {
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
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [debtsCredits, setDebtsCredits] = useState<DebtCredit[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalBudgets: 0,
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
      // Fetch budgets
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user?.id)

      if (budgetsError) throw budgetsError

      // Fetch related transactions to calculate current_balance
      const budgetIds = budgetsData?.map(b => b.id) || []
      const { data: transactionsData, error: txError } = await supabase
        .from('transactions')
        .select('budget_id, amount, type')
        .eq('user_id', user?.id)
        .in('budget_id', budgetIds)

      if (txError) throw txError

      // Update budgets with calculated current_balance
      const updatedBudgets = budgetsData?.map(budget => {
        const expenses = transactionsData
          .filter(t => t.budget_id === budget.id && t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)
        const currentBalance = Math.max(budget.allocated_amount - expenses, 0)
        return { ...budget, current_balance: currentBalance }
      }) || []

      // Build hierarchy
      const budgetMap = new Map<string, Budget>()
      updatedBudgets.forEach(b => budgetMap.set(b.id, { ...b, children: [] }))

      const masters: Budget[] = []
      updatedBudgets.forEach(b => {
        if (b.parent_id) {
          const parent = budgetMap.get(b.parent_id)
          if (parent) {
            parent.children!.push(budgetMap.get(b.id)!)
          }
        } else {
          masters.push(budgetMap.get(b.id)!)
        }
      })

      // Fetch recent transactions for display
      const { data: recentTransactionsData } = await supabase
        .from('transactions')
        .select(`
          *,
          budgets (
            name,
            color
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(5)

      // Fetch debts and credits
      const { data: debtsCreditsData } = await supabase
        .from('debts_credits')
        .select('id, amount, type, is_settled')
        .eq('user_id', user?.id)
        .eq('is_settled', false)

      // Calculate stats
      const { data: allTransactions } = await supabase
        .from('transactions')
        .select('amount, type')
        .eq('user_id', user?.id)

      if (masters) setBudgets(masters)
      if (recentTransactionsData) setTransactions(recentTransactionsData)
      if (debtsCreditsData) setDebtsCredits(debtsCreditsData)

      if (allTransactions) {
        const totalIncome = allTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0)
        
        const totalExpenses = allTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        const totalDebt = debtsCreditsData
          ?.filter(d => d.type === 'debt' && !d.is_settled)
          .reduce((sum, d) => sum + Number(d.amount), 0) || 0
        
        const totalCredit = debtsCreditsData
          ?.filter(d => d.type === 'credit' && !d.is_settled)
          .reduce((sum, d) => sum + Number(d.amount), 0) || 0
        setStats({
          totalIncome,
          totalExpenses,
          totalBudgets: updatedBudgets.length,
          balance: totalIncome - totalExpenses,
          totalDebt,
          totalCredit
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAggregated = (budget: Budget): { allocated: number; current: number; spent: number } => {
    let allocated = budget.allocated_amount
    let current = budget.current_balance
    let spent = allocated - current

    if (budget.children) {
      budget.children.forEach(child => {
        const childAgg = getAggregated(child)
        allocated += childAgg.allocated
        current += childAgg.current
        spent += childAgg.spent
      })
    }

    return { allocated, current, spent }
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
          <p className="text-gray-600 dark:text-gray-300 mt-1">Welcome back! Here's your financial overview</p>
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
              <p className="text-gray-600 dark:text-gray-300 text-sm">Active Budgets</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">
                {stats.totalBudgets}
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
            <Link to="/debts-credits" className="text-green-600 hover:text-green-700 text-sm font-medium">
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
            <button className="text-green-600 hover:text-green-700 text-sm font-medium">
              View All
            </button>
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
                        {transaction.budgets?.name} • {format(new Date(transaction.created_at), 'MMM d, yyyy')}
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

      {/* Budget Cards */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Budget Overview</h2>
          <button className="text-green-600 hover:text-green-700 text-sm font-medium">
            Manage
          </button>
        </div>
        {budgets.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">No budgets created yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {budgets.map((master) => {
              const agg = getAggregated(master)
              const utilization = agg.allocated > 0 ? (agg.spent / agg.allocated) * 100 : 0

              return (
                <div key={master.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                  {/* Master Budget */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: master.color }}
                        />
                        <span className="font-medium text-gray-900 dark:text-white">{master.name}</span>
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-300">
                        {formatCurrency(agg.current)} / {formatCurrency(agg.allocated)}
                      </span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between text-gray-600 dark:text-gray-300">
                        <span>Budget</span>
                        <span>{formatCurrency(agg.allocated)}</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>Spent</span>
                        <span>{formatCurrency(agg.spent)}</span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Usage</span>
                        <span>{Math.min(utilization, 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(utilization, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Sub Budgets */}
                  {master.children && master.children.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">Sub Budgets</h3>
                      {master.children.map((sub) => {
                        const subSpent = Math.max(sub.allocated_amount - sub.current_balance, 0)
                        const subUtilization = sub.allocated_amount > 0 
                          ? (subSpent / sub.allocated_amount) * 100 
                          : 0

                        return (
                          <div key={sub.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-3">
                                <div 
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: sub.color }}
                                />
                                <span className="font-medium text-gray-900 dark:text-white">{sub.name}</span>
                              </div>
                              <span className="text-sm text-gray-600 dark:text-gray-300">
                                {formatCurrency(sub.current_balance)} / {formatCurrency(sub.allocated_amount)}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between text-gray-600 dark:text-gray-300">
                                <span>Budget</span>
                                <span>{formatCurrency(sub.allocated_amount)}</span>
                              </div>
                              <div className="flex justify-between text-red-600">
                                <span>Spent</span>
                                <span>{formatCurrency(subSpent)}</span>
                              </div>
                            </div>
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Usage</span>
                                <span>{Math.min(subUtilization, 100).toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all"
                                  style={{ width: `${Math.min(subUtilization, 100)}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}