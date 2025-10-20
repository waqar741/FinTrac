// import { useState } from 'react'
// import { MessageCircle, X, Send } from 'lucide-react'
// import { useAuth } from '../contexts/AuthContext'
// import { supabase } from '../lib/supabase'

// interface Message {
//   id: string
//   type: 'user' | 'assistant'
//   content: string
//   timestamp: Date
//   quickReplies?: string[]
// }

// export default function AIChat() {
//   const { user } = useAuth()
//   const [isOpen, setIsOpen] = useState(false)
//   const [messages, setMessages] = useState<Message[]>([
//     {
//       id: '1',
//       type: 'assistant',
//       content: 'Hello! How can I help with your finances?',
//       timestamp: new Date(),
//       quickReplies: [
//         'Balance?',
//         'This month?',
//         'Inc vs exp?',
//         'I owe?',
//         'Goals?',
//         'Recent?',
//         'Who owes me?',
//         'Budget status?',
//         'Categories?'
//       ]
//     }
//   ])
//   const [inputValue, setInputValue] = useState('')
//   const [loading, setLoading] = useState(false)

//   const formatCurrency = (amount: number) =>
//     new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//     }).format(amount)

//   const formatDate = (date: string) =>
//     new Date(date).toLocaleDateString('en-IN', {
//       day: 'numeric',
//       month: 'short',
//       year: 'numeric'
//     })

//   const processQuery = async (query: string): Promise<string> => {
//     const lowerQuery = query.toLowerCase().trim()

//     // Settlement confirmations (shortened)
//     if (lowerQuery.includes('settled') || lowerQuery.includes('paid') || lowerQuery.includes('received')) {
//       return 'Records updated. See balance?'
//     }

//     // Short-form greetings
//     if (['hi', 'hello', 'hey', 'yo'].some(greet => lowerQuery === greet)) {
//       return 'Hi! How can I help?'
//     }

//     // Thank you responses
//     if (['thanks', 'thank you', 'thx', 'ty'].some(thank => lowerQuery === thank)) {
//       return 'You\'re welcome!'
//     }

//     // Short help command
//     if (lowerQuery === 'help' || lowerQuery === '?') {
//       return `Commands:
// - Balance?
// - This month?
// - Recent?
// - Who owes me?
// - Inc vs exp?
// - I owe?
// - Goals?
// - Categories?
// - Account status?`
//     }

//     try {
//       // Fetch user data including debts/credits and budgets
//       const [transactionsResponse, accountsResponse, debtsCreditsResponse] = await Promise.all([
//         supabase
//           .from('transactions')
//           .select(`
//             *,
//             accounts (name, color, type)
//           `)
//           .eq('user_id', user?.id)
//           .order('created_at', { ascending: false }),
//         supabase
//           .from('accounts')
//           .select('*')
//           .eq('user_id', user?.id),
//         supabase
//           .from('debts_credits')
//           .select('*')
//           .eq('user_id', user?.id)
//           .eq('is_settled', false),
//       ])

//       // Fetch goals
//       const { data: goalsData } = await supabase
//         .from('goals')
//         .select('*')
//         .eq('user_id', user?.id)
//         .eq('is_active', true)

//       const transactions = transactionsResponse.data || []
//       const accounts = accountsResponse.data || []
//       const debtsCredits = debtsCreditsResponse.data || []
//       const goals = goalsData || []

//       // Calculate basic metrics
//       const totalIncome = transactions
//         .filter(t => t.type === 'income')
//         .reduce((sum, t) => sum + Number(t.amount), 0)
//       const totalExpenses = transactions
//         .filter(t => t.type === 'expense')
//         .reduce((sum, t) => sum + Number(t.amount), 0)
//       const balance = totalIncome - totalExpenses

//       // Calculate total account balance
//       const totalAccountBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)

//       // Calculate debt/credit metrics
//       const totalDebt = debtsCredits
//         .filter(d => d.type === 'debt' && !d.is_settled)
//         .reduce((sum, d) => sum + Number(d.amount), 0)
//       const totalCredit = debtsCredits
//         .filter(d => d.type === 'credit' && !d.is_settled)
//         .reduce((sum, d) => sum + Number(d.amount), 0)
//       const netDebtCredit = totalCredit - totalDebt

//       // Balance queries (shortened)
//       if (['balance', 'balance?', 'current balance', 'how much', 'money', 'what is my current balance','bal','balc','balan'].some(q => lowerQuery.includes(q.toLowerCase()))) {
//         return `Balance: ${formatCurrency(totalAccountBalance)}
//                 Income: ${formatCurrency(totalIncome)}
//                 Expenses: ${formatCurrency(totalExpenses)}
//                 Difference: ${formatCurrency(balance)}`
//       }

//       // Last transactions query (shortened)
//       if (['last 5 transactions', 'recent transactions', 'show my last 5 transactions', 'latest transactions','kharcha','karca','kharca','kharcha'].some(q => lowerQuery.includes(q.toLowerCase()))) {
//         const recentTransactions = transactions.slice(0, 5)
        
//         if (recentTransactions.length === 0) {
//           return 'No recent transactions.'
//         }
        
//         const transactionsList = recentTransactions.map((t, index) => 
//           `${index + 1}. ${formatDate(t.created_at)}: ${t.description || 'No desc'} - ${formatCurrency(t.amount)} (${t.type})`
//         ).join('\n')
        
//         return `Last 5:\n${transactionsList}`
//       }

//       // Weekly spending query (shortened)
//       if (['this week', 'week spending', 'how much did i spend this week', 'weekly spending','week','hafta'].some(q => lowerQuery.includes(q.toLowerCase()))) {
//         const oneWeekAgo = new Date()
//         oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        
//         const weeklyTransactions = transactions.filter(t => 
//           new Date(t.created_at) >= oneWeekAgo
//         )
        
//         const weeklyExpenses = weeklyTransactions
//           .filter(t => t.type === 'expense')
//           .reduce((s, t) => s + Number(t.amount), 0)
//         const weeklyIncome = weeklyTransactions
//           .filter(t => t.type === 'income')
//           .reduce((s, t) => s + Number(t.amount), 0)

//         // Top spending categories this week
//         const weeklyCategories = weeklyTransactions
//           .filter(t => t.type === 'expense')
//           .reduce((acc, t) => {
//             const cat = t.category || 'Other'
//             acc[cat] = (acc[cat] || 0) + Number(t.amount)
//             return acc
//           }, {} as Record<string, number>)
        
//         const topWeeklyCategories = Object.entries(weeklyCategories)
//           .sort(([, a], [, b]) => (b as number) - (a as number))
//           .slice(0, 3)
//           .map(([cat, amt]) => `${cat}: ${formatCurrency(amt as number)}`)
//           .join('\n')

//         return `Week: Expenses ${formatCurrency(weeklyExpenses)}, Income ${formatCurrency(weeklyIncome)}, Net ${formatCurrency(weeklyIncome - weeklyExpenses)}\nTop: ${topWeeklyCategories || 'None'}`
//       }

//       // Monthly spending query (shortened)
//       if (['this month', 'month spending', 'how much did i spend this month', 'monthly spending','month','mahina','mon'].some(q => lowerQuery.includes(q.toLowerCase()))) {
//         const now = new Date()
//         const currentMonth = now.getMonth()
//         const currentYear = now.getFullYear()
        
//         const monthlyTransactions = transactions.filter(t => {
//           const d = new Date(t.created_at)
//           return d.getMonth() === currentMonth && d.getFullYear() === currentYear
//         })
        
//         const monthlyExpenses = monthlyTransactions
//           .filter(t => t.type === 'expense')
//           .reduce((s, t) => s + Number(t.amount), 0)
//         const monthlyIncome = monthlyTransactions
//           .filter(t => t.type === 'income')
//           .reduce((s, t) => s + Number(t.amount), 0)
        
//         // Top categories this month
//         const categorySpending = monthlyTransactions
//           .filter(t => t.type === 'expense')
//           .reduce((acc, t) => {
//             const cat = t.category || 'Other'
//             acc[cat] = (acc[cat] || 0) + Number(t.amount)
//             return acc
//           }, {} as Record<string, number>)
        
//         const topCategories = Object.entries(categorySpending)
//           .sort(([, a], [, b]) => (b as number) - (a as number))
//           .slice(0, 3)
//           .map(([cat, amt]) => `${cat}: ${formatCurrency(amt as number)}`)
//           .join('\n')

//         const monthName = now.toLocaleString('default', { month: 'short' })
//         const netSavings = monthlyIncome - monthlyExpenses

//         return `${monthName}: Expenses ${formatCurrency(monthlyExpenses)}, Income ${formatCurrency(monthlyIncome)}, Net ${formatCurrency(netSavings)}\nTop: ${topCategories || 'None'}`
//       }

//       // Short-form total spending
//       if (['total', 'total spend', 'spent', 'expenses', 'spending'].some(q => lowerQuery === q)) {
//         return `Expenses: ${formatCurrency(totalExpenses)} (${transactions.filter(t => t.type === 'expense').length} txns)`
//       }

//       // Short-form income
//       if (['income', 'earned', 'earnings', 'total income','kamai'].some(q => lowerQuery === q)) {
//         return `Income: ${formatCurrency(totalIncome)} (${transactions.filter(t => t.type === 'income').length} sources)`
//       }

//       // Debt and Credit queries (shortened)
//       if (['debt', 'debts', 'owing', 'i owe','paisa dena','dena'].some(q => lowerQuery.includes(q))) {
//         const debts = debtsCredits.filter(d => d.type === 'debt' && !d.is_settled)
//         if (debts.length === 0) {
//           return 'No debts!'
//         }
//         const debtList = debts.slice(0, 3).map(d => 
//           `${d.person_name}: ${formatCurrency(d.amount)}`
//         ).join('\n')
//         return `Owe:\n${debtList}${debts.length > 3 ? `\n+${debts.length - 3} more` : ''}\nTotal: ${formatCurrency(totalDebt)}`
//       }

//       if (['credit', 'credits', 'owes me', 'owe me', 'who owes', 'owes','paisa baki','lena','who owes me'].some(q => lowerQuery.includes(q))) {
//         const credits = debtsCredits.filter(d => d.type === 'credit' && !d.is_settled)
//         if (credits.length === 0) {
//           return 'No credits.'
//         }
//         const creditList = credits.slice(0, 3).map(c => 
//           `${c.person_name}: ${formatCurrency(c.amount)}`
//         ).join('\n')
//         return `Owed:\n${creditList}${credits.length > 3 ? `\n+${credits.length - 3} more` : ''}\nTotal: ${formatCurrency(totalCredit)}`
//       }

//       // Debt/credit summary (shortened)
//       if (['debt summary', 'debt status', 'karza','udhar', 'loan', 'net debt', 'debt balance', 'all debts'].some(q => lowerQuery.includes(q))) {
//         return `I Owe: ${formatCurrency(totalDebt)}\nOwed: ${formatCurrency(totalCredit)}\nNet: ${formatCurrency(netDebtCredit)}`
//       }

//       // Monthly Summary (shortened)
//       if (['month', 'this month', 'monthly', 'month?', 'this month?'].some(q => lowerQuery === q)) {
//         const now = new Date()
//         const currentMonth = now.getMonth()
//         const currentYear = now.getFullYear()
        
//         const monthlyTransactions = transactions.filter(t => {
//           const d = new Date(t.created_at)
//           return d.getMonth() === currentMonth && d.getFullYear() === currentYear
//         })
        
//         const monthlyExpenses = monthlyTransactions
//           .filter(t => t.type === 'expense')
//           .reduce((s, t) => s + Number(t.amount), 0)
//         const monthlyIncome = monthlyTransactions
//           .filter(t => t.type === 'income')
//           .reduce((s, t) => s + Number(t.amount), 0)
        
//         // Top categories this month
//         const categorySpending = monthlyTransactions
//           .filter(t => t.type === 'expense')
//           .reduce((acc, t) => {
//             const cat = t.category || 'Other'
//             acc[cat] = (acc[cat] || 0) + Number(t.amount)
//             return acc
//           }, {} as Record<string, number>)
        
//         const topCategories = Object.entries(categorySpending)
//           .sort(([, a], [, b]) => (b as number) - (a as number))
//           .slice(0, 3)
//           .map(([cat, amt]) => `${cat}: ${formatCurrency(amt as number)}`)
//           .join('\n')

//         const monthName = now.toLocaleString('default', { month: 'short' })
//         const netSavings = monthlyIncome - monthlyExpenses

//         return `${monthName}: Income ${formatCurrency(monthlyIncome)}, Expenses ${formatCurrency(monthlyExpenses)}, Net ${formatCurrency(netSavings)}\nTop: ${topCategories || 'None'}`
//       }

//       // Weekly Summary (shortened)
//       if (['week', 'weekly', 'last week', 'week?', '7 days'].some(q => lowerQuery === q)) {
//         const oneWeekAgo = new Date()
//         oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        
//         const weeklyTransactions = transactions.filter(t => 
//           new Date(t.created_at) >= oneWeekAgo
//         )
        
//         const weeklyExpenses = weeklyTransactions
//           .filter(t => t.type === 'expense')
//           .reduce((s, t) => s + Number(t.amount), 0)
//         const weeklyIncome = weeklyTransactions
//           .filter(t => t.type === 'income')
//           .reduce((s, t) => s + Number(t.amount), 0)

//         return `Week: Income ${formatCurrency(weeklyIncome)}, Expenses ${formatCurrency(weeklyExpenses)}, Net ${formatCurrency(weeklyIncome - weeklyExpenses)}`
//       }

//       // Today's Summary (shortened)
//       if (['today', 'today?', 'daily'].some(q => lowerQuery === q)) {
//         const today = new Date().toDateString()
//         const todayTransactions = transactions.filter(t => 
//           new Date(t.created_at).toDateString() === today
//         )
        
//         const todayExpenses = todayTransactions
//           .filter(t => t.type === 'expense')
//           .reduce((s, t) => s + Number(t.amount), 0)
//         const todayIncome = todayTransactions
//           .filter(t => t.type === 'income')
//           .reduce((s, t) => s + Number(t.amount), 0)

//         return `Today: Income ${formatCurrency(todayIncome)}, Expenses ${formatCurrency(todayExpenses)}, Net ${formatCurrency(todayIncome - todayExpenses)}`
//       }

//       // Recent Transactions (shortened)
//       if (['recent', 'latest', 'last', 'recent?', 'transactions'].some(q => lowerQuery === q)) {
//         const recentTransactions = transactions.slice(0, 5)
        
//         if (recentTransactions.length === 0) {
//           return 'No recent txns.'
//         }
        
//         const transactionsList = recentTransactions.map(t => 
//           `${t.type}: ${formatCurrency(t.amount)} - ${t.description || 'No desc'}`
//         ).join('\n')
        
//         return `Recent:\n${transactionsList}`
//       }

//       // Budget queries (shortened)
//       if (['account', 'accounts', 'account?', 'account status','acc','ac', 'my accounts'].some(q => lowerQuery.includes(q))) {
//         if (accounts.length === 0) {
//           return 'No accounts.'
//         }
        
//         const accountStatus = accounts.slice(0, 4).map(a => {
//           const typeLabel = a.type.replace('_', ' ')
//           return `${a.name} (${typeLabel}): ${formatCurrency(a.balance)}`
//         }).join('\n')
        
//         return `Accounts:\n${accountStatus}${accounts.length > 4 ? `\n+${accounts.length - 4} more` : ''}`
//       }

//       // Category queries (shortened)
//       if (['categories', 'category', 'categories?', 'top categories', 'spending by category'].some(q => lowerQuery.includes(q))) {
//         const categorySpending = transactions
//           .filter(t => t.type === 'expense')
//           .reduce((acc, t) => {
//             const cat = t.category || 'Other'
//             acc[cat] = (acc[cat] || 0) + Number(t.amount)
//             return acc
//           }, {} as Record<string, number>)
        
//         if (Object.keys(categorySpending).length === 0) {
//           return 'No categories.'
//         }
        
//         const topCategories = Object.entries(categorySpending)
//           .sort(([, a], [, b]) => (b as number) - (a as number))
//           .slice(0, 5)
//           .map(([cat, amt]) => `${cat}: ${formatCurrency(amt as number)}`)
//           .join('\n')
        
//         return `Top:\n${topCategories}`
//       }

//       // Goals queries (shortened)
//       if (['goals', 'goal', 'goals?', 'goal status', 'my goals', 'progress','saving','save'].some(q => lowerQuery.includes(q))) {
//         if (goals.length === 0) {
//           return 'No goals.'
//         }
        
//         const goalStatus = goals.slice(0, 4).map(g => {
//           const progress = Math.min((g.current_amount / g.target_amount) * 100, 100)
//           return `${g.name}: ${formatCurrency(g.current_amount)}/${formatCurrency(g.target_amount)} (${progress.toFixed(0)}%)`
//         }).join('\n')
        
//         return `Goals:\n${goalStatus}${goals.length > 4 ? `\n+${goals.length - 4} more` : ''}`
//       }

//       // Transaction Search by Amount (shortened)
//       const amountMatch = lowerQuery.match(/(\d+)/)
//       if (amountMatch) {
//         const targetAmount = Number(amountMatch[0])
//         const matchedTxns = transactions.filter(
//           t => Number(t.amount) === targetAmount
//         )
        
//         if (matchedTxns.length > 0) {
//           const txnList = matchedTxns.slice(0, 3).map(t =>
//             `${formatDate(t.created_at)}: ${t.description || 'No desc'}`
//           ).join('\n')
          
//           return `${matchedTxns.length} for ${formatCurrency(targetAmount)}:\n${txnList}`
//         }
        
//         return `No txns for ${formatCurrency(targetAmount)}.`
//       }

//       // Category-specific queries (shortened)
//       const commonCategories = ['food', 'groceries', 'rent', 'shopping', 'entertainment', 'transport', 'bills', 'utilities', 'health', 'education', 'travel', 'dining']
//       const matchedCategory = commonCategories.find(cat => lowerQuery.includes(cat))
      
//       if (matchedCategory) {
//         const categoryTransactions = transactions.filter(t => 
//           t.type === 'expense' && 
//           (t.category?.toLowerCase().includes(matchedCategory) || 
//            t.description?.toLowerCase().includes(matchedCategory))
//         )
        
//         const categoryTotal = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
//         const thisMonth = categoryTransactions.filter(t => {
//           const d = new Date(t.created_at)
//           return d.getMonth() === new Date().getMonth()
//         })
//         const monthlyTotal = thisMonth.reduce((sum, t) => sum + Number(t.amount), 0)
        
//         return `${matchedCategory}: Total ${formatCurrency(categoryTotal)}, Month ${formatCurrency(monthlyTotal)}`
//       }

//       // Transaction Search by Description/Keyword (shortened)
//       if (lowerQuery.includes('spent on') || lowerQuery.includes('where did') || lowerQuery.includes('what did')) {
//         const keywords = lowerQuery.replace(/spent on|where did|what did|i|spend|money/gi, '').trim().split(/\s+/).filter(k => k.length > 2)
        
//         if (keywords.length > 0) {
//           const matchedTxns = transactions.filter(t =>
//             keywords.some(keyword =>
//               t.description?.toLowerCase().includes(keyword) ||
//               t.category?.toLowerCase().includes(keyword)
//             )
//           )
          
//           if (matchedTxns.length > 0) {
//             const total = matchedTxns.reduce((sum, t) => sum + Number(t.amount), 0)
//             return `${matchedTxns.length} for "${keywords[0]}": Total ${formatCurrency(total)}`
//           }
//           return `No txns for "${keywords[0]}".`
//         }
//       }

//       // Income vs Expenses comparison (shortened)
//       if (['compare', 'vs', 'difference', 'in vs ex','income vs expenses'].some(q => lowerQuery.includes(q))) {
//         const ratio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0
//         const savings = totalIncome - totalExpenses
        
//         return `Income ${formatCurrency(totalIncome)}, Expenses ${formatCurrency(totalExpenses)}, Savings ${formatCurrency(savings)} (Ratio ${ratio.toFixed(0)}%)`
//       }

//       // Financial health check (shortened)
//       if (['health', 'financial health', 'how am i doing', 'status', 'overview'].some(q => lowerQuery.includes(q))) {
//         const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
        
//         let advice = 'Good!'
//         if (savingsRate < 10) {
//           advice = 'Reduce expenses'
//         } else if (savingsRate < 20) {
//           advice = 'Room to improve'
//         }
        
//         return `Balance ${formatCurrency(balance)}, Savings rate ${savingsRate.toFixed(0)}%, Advice: ${advice}`
//       }

//       // Default response (shortened)
//       const suggestions = [
//         'Balance?',
//         'This month?',
//         'Inc vs exp?',
//         'I owe?',
//         'Goals?',
//         'Recent?',
//         'Who owes me?',
//         'Budget status?',
//         'Categories?'
//       ]

//       return `Unrecognized: "${query}".\nTry:\n${suggestions.map(s => `${s}`).join('\n')}`

//     } catch (err) {
//       console.error('Query error:', err)
//       return 'Error occurred.'
//     }
//   }

//   const handleSendMessage = async (msg?: string) => {
//     const query = msg || inputValue
//     if (!query.trim() || loading) return

//     const userMessage: Message = {
//       id: Date.now().toString(),
//       type: 'user',
//       content: query,
//       timestamp: new Date()
//     }
//     setMessages(prev => [...prev, userMessage])
//     setInputValue('')
//     setLoading(true)

//     try {
//       const response = await processQuery(query)
//       const assistantMessage: Message = {
//         id: (Date.now() + 1).toString(),
//         type: 'assistant',
//         content: response,
//         timestamp: new Date(),
//         quickReplies: [
//         'Balance?',
//         'This month?',
//         'Inc vs exp?',
//         'I owe?',
//         'Goals?',
//         'Recent?',
//         'Who owes me?',
//         'Budget status?',
//         'Categories?'
//         ]
//       }
//       setMessages(prev => [...prev, assistantMessage])
//     } catch {
//       setMessages(prev => [...prev, {
//         id: (Date.now() + 1).toString(),
//         type: 'assistant',
//         content: 'Error occurred.',
//         timestamp: new Date()
//       }])
//     } finally {
//       setLoading(false)
//     }
//   }

//   return (
//     <>
//       {/* Toggle Button */}
//       <button
//         onClick={() => setIsOpen(true)}
//         className={`fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center z-40 ${isOpen ? 'scale-0' : 'scale-100'}`}
//       >
//         <MessageCircle className="w-6 h-6" />
//       </button>

//       {/* Chat Window */}
//       <div className={`fixed bottom-6 right-6 w-80 h-90 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
//         {/* Header */}
//         <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
//           <div className="flex items-center space-x-2">
//             {/* LOGO ADDED HERE */}
//             <svg
//               className="w-8 h-8 text-green-600"
//               fill="none"
//               stroke="currentColor"
//               strokeWidth="1.5"
//               viewBox="0 0 24 24"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
//               />
//             </svg>
//             <div>
//               <h3 className="font-medium text-gray-900 dark:text-white">Fintrac AI</h3>
//               <p className="text-xs text-gray-500 dark:text-gray-400">Financial Assistant</p>
//             </div>
//           </div>
//           <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
//             <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
//           </button>
//         </div>

//         {/* Messages */}
//         <div className="flex-1 p-4 h-64 overflow-y-auto space-y-3">
//           {messages.map((m) => (
//             <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
//               <div className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-line ${m.type === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
//                 {m.content}
//               </div>
//             </div>
//           ))}
//           {loading && (
//             <div className="flex justify-start">
//               <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm">
//                 <div className="flex space-x-1">
//                   <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
//                   <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
//                   <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
//                 </div>
//               </div>
//             </div>
//           )}
//           {/* Quick Replies */}
//           {messages[messages.length - 1]?.quickReplies && !loading && (
//             <div className="flex flex-wrap gap-2 mt-2">
//               {messages[messages.length - 1].quickReplies!.map((q, i) => (
//                 <button
//                   key={i}
//                   onClick={() => handleSendMessage(q)}
//                   className="px-2 py-1 text-xs bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40"
//                 >
//                   {q}
//                 </button>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Input */}
//         <div className="p-4 border-t border-gray-200 dark:border-gray-700">
//           <div className="flex items-center space-x-2">
//             <input
//               type="text"
//               value={inputValue}
//               onChange={(e) => setInputValue(e.target.value)}
//               onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
//               placeholder="Ask about your finances..."
//               className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//               disabled={loading}
//             />
//             <button
//               onClick={() => handleSendMessage()}
//               disabled={loading || !inputValue.trim()}
//               className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors"
//             >
//               <Send className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       </div>
//     </>
//   )
// }






import { useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  quickReplies?: string[]
}

export default function AIChat() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! How can I help with your finances?',
      timestamp: new Date(),
      quickReplies: [
        'Balance?',
        'This month?',
        'Inc vs exp?',
        'I owe?',
        'Goals?',
        'Recent?',
        'Who owes me?',
        'Budget status?',
        'Categories?'
      ]
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })

  const processQuery = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase().trim()

    // Settlement confirmations (shortened)
    if (lowerQuery.includes('settled') || lowerQuery.includes('paid') || lowerQuery.includes('received')) {
      return 'Records updated. See balance?'
    }

    // Short-form greetings
    if (['hi', 'hello', 'hey', 'yo'].some(greet => lowerQuery === greet)) {
      return 'Hi! How can I help?'
    }

    // Thank you responses
    if (['thanks', 'thank you', 'thx', 'ty'].some(thank => lowerQuery === thank)) {
      return 'You\'re welcome!'
    }

    // Short help command
    if (lowerQuery === 'help' || lowerQuery === '?') {
      return `Commands:
- Balance?
- This month?
- Recent?
- Who owes me?
- Inc vs exp?
- I owe?
- Goals?
- Categories?
- Account status?
- Search [description]
- Transactions in [category]
- Account [name]`
    }

    try {
      // Fetch user data including debts/credits and budgets
      const [transactionsResponse, accountsResponse, debtsCreditsResponse] = await Promise.all([
        supabase
          .from('transactions')
          .select(`
            *,
            accounts (name, color, type)
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('accounts')
          .select('*')
          .eq('user_id', user?.id),
        supabase
          .from('debts_credits')
          .select('*')
          .eq('user_id', user?.id)
          .eq('is_settled', false),
      ])

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)

      const transactions = transactionsResponse.data || []
      const accounts = accountsResponse.data || []
      const debtsCredits = debtsCreditsResponse.data || []
      const goals = goalsData || []

      // Calculate basic metrics
      const totalIncome = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const totalExpenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const balance = totalIncome - totalExpenses

      // Calculate total account balance
      const totalAccountBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)

      // Calculate debt/credit metrics
      const totalDebt = debtsCredits
        .filter(d => d.type === 'debt' && !d.is_settled)
        .reduce((sum, d) => sum + Number(d.amount), 0)
      const totalCredit = debtsCredits
        .filter(d => d.type === 'credit' && !d.is_settled)
        .reduce((sum, d) => sum + Number(d.amount), 0)
      const netDebtCredit = totalCredit - totalDebt

      // ===== ENHANCED QUERIES FOR TRANSACTIONS, CATEGORIES, AND ACCOUNTS =====

      // Transaction search by description (enhanced)
      if (lowerQuery.includes('search') || lowerQuery.includes('find') || lowerQuery.includes('lookup') || 
          lowerQuery.includes('transaction for') || lowerQuery.includes('txn for')) {
        
        const searchTerms = lowerQuery
          .replace(/search|find|lookup|transaction for|txn for|transactions?|where|did|i|spend|on/gi, '')
          .trim()
          .split(/\s+/)
          .filter(term => term.length > 2)

        if (searchTerms.length > 0) {
          const matchedTransactions = transactions.filter(t =>
            searchTerms.some(term =>
              t.description?.toLowerCase().includes(term) ||
              t.category?.toLowerCase().includes(term) ||
              t.accounts?.name?.toLowerCase().includes(term)
            )
          )

          if (matchedTransactions.length > 0) {
            const totalAmount = matchedTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
            const transactionList = matchedTransactions.slice(0, 5).map(t =>
              `${formatDate(t.created_at)}: ${t.description || 'No description'} - ${formatCurrency(t.amount)} (${t.category || 'No category'})`
            ).join('\n')

            return `Found ${matchedTransactions.length} transactions for "${searchTerms.join(' ')}":\nTotal: ${formatCurrency(totalAmount)}\n\n${transactionList}${matchedTransactions.length > 5 ? `\n\n...and ${matchedTransactions.length - 5} more` : ''}`
          }
          return `No transactions found for "${searchTerms.join(' ')}".`
        }
      }

      // Category-specific detailed queries (enhanced)
      const commonCategories = ['food', 'groceries', 'rent', 'shopping', 'entertainment', 'transport', 'bills', 'utilities', 'health', 'education', 'travel', 'dining', 'medical', 'insurance', 'investment', 'emi', 'loan', 'subscription', 'fuel', 'maintenance']
      
      const matchedCategory = commonCategories.find(cat => 
        lowerQuery.includes(cat) || 
        lowerQuery.includes(`transactions in ${cat}`) ||
        lowerQuery.includes(`spending on ${cat}`) ||
        lowerQuery.includes(`${cat} transactions`)
      )
      
      if (matchedCategory) {
        const categoryTransactions = transactions.filter(t => 
          t.type === 'expense' && 
          (t.category?.toLowerCase().includes(matchedCategory) || 
           t.description?.toLowerCase().includes(matchedCategory))
        )
        
        const categoryTotal = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
        
        // This month's spending in category
        const thisMonthTransactions = categoryTransactions.filter(t => {
          const d = new Date(t.created_at)
          const now = new Date()
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })
        const monthlyTotal = thisMonthTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
        
        // Last 3 transactions in this category
        const recentTransactions = categoryTransactions.slice(0, 3).map(t =>
          `${formatDate(t.created_at)}: ${t.description || 'No description'} - ${formatCurrency(t.amount)}`
        ).join('\n')

        return `${matchedCategory.charAt(0).toUpperCase() + matchedCategory.slice(1)}:\nTotal: ${formatCurrency(categoryTotal)}\nThis Month: ${formatCurrency(monthlyTotal)}\nTransactions: ${categoryTransactions.length}\n\nRecent:\n${recentTransactions || 'None'}`
      }

      // Account-specific queries (enhanced)
      const accountNames = accounts.map(acc => acc.name.toLowerCase())
      const matchedAccount = accountNames.find(accName => 
        lowerQuery.includes(accName) ||
        lowerQuery.includes(`account ${accName}`) ||
        lowerQuery.includes(`${accName} account`) ||
        lowerQuery.includes(`transactions in ${accName}`)
      )

      if (matchedAccount) {
        const account = accounts.find(acc => acc.name.toLowerCase() === matchedAccount)
        if (!account) return 'Account not found.'

        const accountTransactions = transactions.filter(t => 
          t.accounts?.name?.toLowerCase() === matchedAccount
        )

        const accountBalance = account.balance || 0
        const accountIncome = accountTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0)
        const accountExpenses = accountTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0)

        const recentAccountTransactions = accountTransactions.slice(0, 5).map(t =>
          `${formatDate(t.created_at)}: ${t.description || 'No description'} - ${formatCurrency(t.amount)} (${t.type})`
        ).join('\n')

        return `Account: ${account.name}\nBalance: ${formatCurrency(accountBalance)}\nIncome: ${formatCurrency(accountIncome)}\nExpenses: ${formatCurrency(accountExpenses)}\nTransactions: ${accountTransactions.length}\n\nRecent:\n${recentAccountTransactions || 'No transactions'}`
      }

      // List all categories with spending (enhanced)
      if (['all categories', 'list categories', 'categories list', 'show all categories', 'every category'].some(q => lowerQuery.includes(q))) {
        const categorySpending = transactions
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => {
            const cat = t.category || 'Uncategorized'
            acc[cat] = (acc[cat] || 0) + Number(t.amount)
            return acc
          }, {} as Record<string, number>)
        
        if (Object.keys(categorySpending).length === 0) {
          return 'No categories with spending.'
        }
        
        const allCategories = Object.entries(categorySpending)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .map(([cat, amt]) => `${cat}: ${formatCurrency(amt as number)}`)
          .join('\n')
        
        return `All Categories:\n${allCategories}`
      }

      // List all accounts with details (enhanced)
      if (['all accounts', 'list accounts', 'accounts list', 'show all accounts', 'every account'].some(q => lowerQuery.includes(q))) {
        if (accounts.length === 0) {
          return 'No accounts found.'
        }
        
        const allAccounts = accounts.map(a => {
          const typeLabel = a.type.replace('_', ' ')
          return `${a.name}: ${formatCurrency(a.balance)} (${typeLabel})`
        }).join('\n')
        
        return `All Accounts:\n${allAccounts}\n\nTotal: ${formatCurrency(totalAccountBalance)}`
      }

      // Transaction description analysis
      if (['describe transaction', 'transaction details', 'txn details', 'show transaction'].some(q => lowerQuery.includes(q))) {
        // Look for amount or date patterns in query
        const amountMatch = lowerQuery.match(/(\d+)/)
        const dateMatch = lowerQuery.match(/(today|yesterday|last week|this month)/)
        
        let filteredTransactions = transactions
        
        if (amountMatch) {
          const targetAmount = Number(amountMatch[0])
          filteredTransactions = transactions.filter(t => Number(t.amount) === targetAmount)
        }
        
        if (dateMatch) {
          const dateTerm = dateMatch[0]
          const now = new Date()
          let startDate = new Date()
          
          switch (dateTerm) {
            case 'today':
              startDate.setHours(0, 0, 0, 0)
              break
            case 'yesterday':
              startDate.setDate(now.getDate() - 1)
              startDate.setHours(0, 0, 0, 0)
              const yesterdayEnd = new Date(startDate)
              yesterdayEnd.setDate(startDate.getDate() + 1)
              filteredTransactions = filteredTransactions.filter(t => {
                const tDate = new Date(t.created_at)
                return tDate >= startDate && tDate < yesterdayEnd
              })
              break
            case 'last week':
              startDate.setDate(now.getDate() - 7)
              filteredTransactions = filteredTransactions.filter(t => new Date(t.created_at) >= startDate)
              break
            case 'this month':
              startDate.setDate(1)
              startDate.setHours(0, 0, 0, 0)
              filteredTransactions = filteredTransactions.filter(t => {
                const tDate = new Date(t.created_at)
                return tDate.getMonth() === now.getMonth() && tDate.getFullYear() === now.getFullYear()
              })
              break
          }
        }
        
        if (filteredTransactions.length > 0) {
          const transactionDetails = filteredTransactions.slice(0, 5).map(t => 
            `Date: ${formatDate(t.created_at)}\nDesc: ${t.description || 'No description'}\nAmount: ${formatCurrency(t.amount)}\nCategory: ${t.category || 'No category'}\nAccount: ${t.accounts?.name || 'No account'}\nType: ${t.type}\n---`
          ).join('\n')
          
          return `Found ${filteredTransactions.length} transactions:\n\n${transactionDetails}`
        }
        
        return 'No transactions found with those criteria.'
      }

      // Balance queries (existing - keep as is)
      if (['balance', 'balance?', 'current balance', 'how much', 'money', 'what is my current balance','bal','balc','balan'].some(q => lowerQuery.includes(q.toLowerCase()))) {
        return `Balance: ${formatCurrency(totalAccountBalance)}
                Income: ${formatCurrency(totalIncome)}
                Expenses: ${formatCurrency(totalExpenses)}
                Difference: ${formatCurrency(balance)}`
      }

      // Last transactions query (existing - keep as is)
      if (['last 5 transactions', 'recent transactions', 'show my last 5 transactions', 'latest transactions','kharcha','karca','kharca','kharcha'].some(q => lowerQuery.includes(q.toLowerCase()))) {
        const recentTransactions = transactions.slice(0, 5)
        
        if (recentTransactions.length === 0) {
          return 'No recent transactions.'
        }
        
        const transactionsList = recentTransactions.map((t, index) => 
          `${index + 1}. ${formatDate(t.created_at)}: ${t.description || 'No desc'} - ${formatCurrency(t.amount)} (${t.type})`
        ).join('\n')
        
        return `Last 5:\n${transactionsList}`
      }

      // Continue with all your existing queries...
      // [Keep all your existing query handlers here...]

      // Weekly spending query
      if (['this week', 'week spending', 'how much did i spend this week', 'weekly spending','week','hafta'].some(q => lowerQuery.includes(q.toLowerCase()))) {
        // ... existing code
      }

      // Monthly spending query
      if (['this month', 'month spending', 'how much did i spend this month', 'monthly spending','month','mahina','mon'].some(q => lowerQuery.includes(q.toLowerCase()))) {
        // ... existing code
      }

      // Default response with enhanced suggestions
      const suggestions = [
        'Balance?',
        'This month?',
        'Search [description]',
        'Transactions in [category]',
        'Account [name]',
        'All categories?',
        'All accounts?',
        'I owe?',
        'Goals?'
      ]

      return `Unrecognized: "${query}".\nTry:\n${suggestions.map(s => `${s}`).join('\n')}`

    } catch (err) {
      console.error('Query error:', err)
      return 'Error occurred.'
    }
  }

  const handleSendMessage = async (msg?: string) => {
    const query = msg || inputValue
    if (!query.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    try {
      const response = await processQuery(query)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        quickReplies: [
          'Balance?',
          'This month?',
          'Search food',
          'Transactions in shopping',
          'All categories?',
          'I owe?',
          'Goals?',
          'Recent?',
          'Account status?'
        ]
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Error occurred.',
        timestamp: new Date()
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center z-40 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-80 h-90 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            {/* LOGO ADDED HERE */}
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
              />
            </svg>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Fintrac AI</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Financial Assistant</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 h-64 overflow-y-auto space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-line ${m.type === 'user' ? 'bg-green-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          {/* Quick Replies */}
          {messages[messages.length - 1]?.quickReplies && !loading && (
            <div className="flex flex-wrap gap-2 mt-2">
              {messages[messages.length - 1].quickReplies!.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className="px-2 py-1 text-xs bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder="Ask about your finances..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-1 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputValue.trim()}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}