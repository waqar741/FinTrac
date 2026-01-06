import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useCurrency } from '../hooks/useCurrency'
import { TrendingUp, TrendingDown, DollarSign, Activity } from 'lucide-react'
import { format, subDays, eachDayOfInterval } from 'date-fns'
import SEO from '../components/SEO'

export default function Analytics() {
  const { user } = useAuth()
  const { formatCurrency } = useCurrency()
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days

  // Stats
  const [stats, setStats] = useState({
    income: 0,
    expenses: 0,
    savingsRate: 0,
    avgDailySpend: 0
  })

  // Chart Data
  const [trendData, setTrendData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1']

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user, dateRange])

  const fetchData = async () => {
    setLoading(true)
    try {
      const startDate = subDays(new Date(), parseInt(dateRange))

      const { data: txData, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user?.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      // setTransactions(txData || [])
      processData(txData || [])

    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const processData = (data: any[]) => {
    // 1. Calculate General Stats
    const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0)
    const expenses = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0)
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0
    const days = parseInt(dateRange)
    const avgDailySpend = expenses / days

    setStats({
      income,
      expenses,
      savingsRate,
      avgDailySpend
    })

    // 2. Process Trend Data (Cumulative Flow)
    // Create an array of all days in range
    const today = new Date()
    const start = subDays(today, parseInt(dateRange))
    const daysInterval = eachDayOfInterval({ start, end: today })

    let runningBalance = 0 // Note: accurate running balance requires all-time history, this is diff for period
    const trends = daysInterval.map(day => {
      const dayStr = format(day, 'MMM d')
      const dayTx = data.filter(t => format(new Date(t.created_at), 'MMM d') === dayStr)
      const dayIncome = dayTx.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const dayExpense = dayTx.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

      runningBalance += (dayIncome - dayExpense)

      return {
        name: dayStr,
        balance: runningBalance,
        income: dayIncome,
        expense: dayExpense
      }
    })
    setTrendData(trends)

    // 3. Process Category Data
    const expenseTx = data.filter(t => t.type === 'expense')
    const categories: { [key: string]: number } = {}
    expenseTx.forEach(t => {
      const cat = t.category || 'Uncategorized'
      categories[cat] = (categories[cat] || 0) + Number(t.amount)
    })

    const catChartData = Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6) // Top 6 categories

    setCategoryData(catChartData)

  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 pb-20">
      <SEO title="Analytics" description="Deep dive into your financial data" />

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-blue-600">
            Financial Analytics
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive tracking and insights
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
          {['7', '30', '90'].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${dateRange === range
                ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
            >
              {range} Days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            label: 'Total Income',
            value: stats.income,
            icon: TrendingUp,
            color: 'text-green-600',
            bg: 'bg-green-50 dark:bg-green-900/20'
          },
          {
            label: 'Total Expenses',
            value: stats.expenses,
            icon: TrendingDown,
            color: 'text-red-600',
            bg: 'bg-red-50 dark:bg-red-900/20'
          },
          {
            label: 'Daily Average',
            value: stats.avgDailySpend,
            icon: Activity,
            color: 'text-blue-600',
            bg: 'bg-blue-50 dark:bg-blue-900/20'
          },
          {
            label: 'Savings Rate',
            value: stats.savingsRate,
            icon: DollarSign,
            color: 'text-purple-600',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            isPercent: true
          },
        ].map((item, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{item.label}</p>
                <p className={`text-2xl font-bold mt-1 ${item.color}`}>
                  {item.isPercent ? `${item.value.toFixed(1)}%` : formatCurrency(item.value)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${item.bg}`}>
                <item.icon className={`w-6 h-6 ${item.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

        {/* Net Flow Trend */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Net Flow Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                  dataKey="name"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    borderColor: 'rgba(55, 65, 81, 1)',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="balance"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorBalance)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Income vs Expenses Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Income vs Expenses</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis
                  dataKey="name"
                  stroke="#6B7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{
                    backgroundColor: 'rgba(31, 41, 55, 0.95)',
                    borderColor: 'rgba(55, 65, 81, 1)',
                    borderRadius: '8px',
                    color: '#F3F4F6'
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Bar name="Income" dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar name="Expense" dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending Distribution */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Spending Distribution</h3>
          <div className="flex flex-col md:flex-row items-center justify-center">
            <div className="h-[300px] w-full md:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(31, 41, 55, 0.95)',
                      borderColor: 'rgba(55, 65, 81, 1)',
                      borderRadius: '8px',
                      color: '#F3F4F6'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 space-y-3 mt-4 md:mt-0">
              {categoryData.map((entry, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-gray-600 dark:text-gray-300 truncate max-w-[120px]">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{formatCurrency(entry.value)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Efficiency Gauge (Simple visual representation) */}
        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg text-white flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Financial Health Score</h3>
            <p className="text-indigo-100 text-sm">Based on your savings rate and spending habits.</p>
          </div>

          <div className="flex items-center justify-center my-8">
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Outer Ring */}
              <svg className="absolute w-full h-full transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="transparent"
                  className="text-indigo-400 opacity-30"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="white"
                  strokeWidth="12"
                  fill="transparent"
                  strokeDasharray={440}
                  strokeDashoffset={440 - (440 * Math.min(Math.max(stats.savingsRate + 50, 0), 100)) / 100} // Rough heuristic for "Health"
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-4xl font-bold">{Math.round(Math.min(Math.max(stats.savingsRate + 50, 0), 100))}</span>
                <span className="text-sm block text-indigo-100">/ 100</span>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <p className="text-sm font-medium">
              {stats.savingsRate > 20 ? "Excellent work! You're saving consistently." : "Try to reduce expenses to boost your score."}
            </p>
          </div>
        </div>

      </div>

    </div>
  )
}