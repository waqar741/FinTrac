// import { useState } from 'react'
// import { MessageCircle, X, Send, TrendingUp } from 'lucide-react'
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
//       content: 'Hello! 👋 I\'m your financial AI assistant. Ask me anything about your expenses, budgets, or financial insights!',
//       timestamp: new Date(),
//       quickReplies: [
//         "What's my total spend?",
//         "Show me this month's summary",
//         "Top spending categories",
//         "What's my current balance?",
//         "Recent transactions",
//         "Budget status"
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

//     // ✅ Greeting handling
//     if (["hi", "hello", "hey", "good morning", "good afternoon"].some(greet => lowerQuery.includes(greet))) {
//       return "Hi there! 👋 How can I help you with your finances today?"
//     }

//     // ✅ Thank you responses
//     if (["thanks", "thank you", "thank"].some(thank => lowerQuery.includes(thank))) {
//       return "You're welcome! 😊 Is there anything else you'd like to know about your finances?"
//     }

//     // ✅ Help command
//     if (lowerQuery.includes('help') || lowerQuery === 'what can you do') {
//       return `I can help you with:
// • Monthly/Weekly/Daily summaries
// • Transaction history and search
// • Budget tracking and status
// • Spending by categories
// • Income vs expenses analysis
// • Debts and credits tracking
// • Specific transaction queries
// • Financial insights and trends

// Try asking things like:
// "Show me this month's summary"
// "What did I spend on groceries?"
// "How much did I earn last month?"
// "Am I over budget?"
// "Who owes me money?"
// "How much do I owe?"`
//     }

//     try {
//       // Fetch user data including debts/credits
//       const [transactionsResponse, budgetsResponse, debtsCreditsResponse] = await Promise.all([
//         supabase
//           .from('transactions')
//           .select(`
//             *,
//             budgets (name, color)
//           `)
//           .eq('user_id', user?.id)
//           .order('created_at', { ascending: false }),
//         supabase
//           .from('budgets')
//           .select('*')
//           .eq('user_id', user?.id),
//         supabase
//           .from('debts_credits')
//           .select('*')
//           .eq('user_id', user?.id)
//       ])

//       const transactions = transactionsResponse.data || []
//       const budgets = budgetsResponse.data || []
//       const debtsCredits = debtsCreditsResponse.data || []

//       // Calculate basic metrics
//       const totalIncome = transactions.filter(t => t.type === 'income')
//         .reduce((sum, t) => sum + Number(t.amount), 0)
//       const totalExpenses = transactions.filter(t => t.type === 'expense')
//         .reduce((sum, t) => sum + Number(t.amount), 0)
//       const balance = totalIncome - totalExpenses

//       // Calculate debt/credit metrics
//       const totalDebt = debtsCredits.filter(d => d.type === 'debt' && !d.is_settled)
//         .reduce((sum, d) => sum + Number(d.amount), 0)
//       const totalCredit = debtsCredits.filter(d => d.type === 'credit' && !d.is_settled)
//         .reduce((sum, d) => sum + Number(d.amount), 0)
//       const netDebtCredit = totalCredit - totalDebt

//       // ✅ Debt and Credit queries
//       if (lowerQuery.includes('debt') || lowerQuery.includes('owe') || lowerQuery.includes('borrow')) {
//         if (lowerQuery.includes('who') && (lowerQuery.includes('owe me') || lowerQuery.includes('owes me'))) {
//           const credits = debtsCredits.filter(d => d.type === 'credit' && !d.is_settled)
//           if (credits.length === 0) {
//             return "No one currently owes you money. 💰"
//           }
//           const creditList = credits.map(c => 
//             `• ${c.person_name}: ${formatCurrency(c.amount)} - ${c.description}`
//           ).join('\n')
//           return `💰 **People who owe you money:**\n\n${creditList}\n\nTotal: ${formatCurrency(totalCredit)}`
//         }
        
//         if (lowerQuery.includes('who') && lowerQuery.includes('i owe')) {
//           const debts = debtsCredits.filter(d => d.type === 'debt' && !d.is_settled)
//           if (debts.length === 0) {
//             return "You don't owe anyone money right now. Great job! ✅"
//           }
//           const debtList = debts.map(d => 
//             `• ${d.person_name}: ${formatCurrency(d.amount)} - ${d.description}`
//           ).join('\n')
//           return `💳 **People you owe money to:**\n\n${debtList}\n\nTotal: ${formatCurrency(totalDebt)}`
//         }
        
//         if (lowerQuery.includes('how much') && (lowerQuery.includes('owe') || lowerQuery.includes('debt'))) {
//           return `💳 **Your Debt Summary:**

// Total you owe: ${formatCurrency(totalDebt)}
// Total others owe you: ${formatCurrency(totalCredit)}
// Net balance: ${formatCurrency(netDebtCredit)}

// ${netDebtCredit >= 0 ? '✅ You\'re in a positive position!' : '⚠️ You owe more than others owe you.'}`
//         }
        
//         if (lowerQuery.includes('debt') && (lowerQuery.includes('summary') || lowerQuery.includes('overview'))) {
//           const activeDebts = debtsCredits.filter(d => !d.is_settled).length
//           const settledDebts = debtsCredits.filter(d => d.is_settled).length
          
//           return `📊 **Debts & Credits Overview:**

// Active entries: ${activeDebts}
// Settled entries: ${settledDebts}

// You owe: ${formatCurrency(totalDebt)} (${debtsCredits.filter(d => d.type === 'debt' && !d.is_settled).length} people)
// Others owe you: ${formatCurrency(totalCredit)} (${debtsCredits.filter(d => d.type === 'credit' && !d.is_settled).length} people)

// Net position: ${formatCurrency(netDebtCredit)}`
//         }
//       }

//       // ✅ Monthly Summary (Enhanced)
//   if ((lowerQuery.includes("month's summary") || lowerQuery.includes('month') && (lowerQuery.includes('summary') || lowerQuery.includes('overview')))) {
//         const now = new Date()
//         const currentMonth = now.getMonth()
//         const currentYear = now.getFullYear()
        
//         const monthlyTransactions = transactions.filter(t => {
//           const d = new Date(t.created_at)
//           return d.getMonth() === currentMonth && d.getFullYear() === currentYear
//         })
        
//         const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense')
//           .reduce((s, t) => s + Number(t.amount), 0)
//         const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income')
//           .reduce((s, t) => s + Number(t.amount), 0)
        
//         // Top categories this month
//         const categorySpending = monthlyTransactions.filter(t => t.type === 'expense')
//           .reduce((acc, t) => {
//             const cat = t.category || 'Other'
//             acc[cat] = (acc[cat] || 0) + Number(t.amount)
//             return acc
//           }, {} as Record<string, number>)
        
//         const topCategories = Object.entries(categorySpending)
//           .sort(([, a], [, b]) => (b as number) - (a as number))
//           .slice(0, 3)
//           .map(([cat, amt]) => `• ${cat}: ${formatCurrency(amt as number)}`)
//           .join('\n')

//         return `📊 **This Month's Summary** (${now.toLocaleString('default', { month: 'long' })} ${currentYear})

// 📈 Income: ${formatCurrency(monthlyIncome)}
// 📉 Expenses: ${formatCurrency(monthlyExpenses)}
// 💰 Net Savings: ${formatCurrency(monthlyIncome - monthlyExpenses)}

// 🏆 Top Spending Categories:
// ${topCategories || 'No spending data this month'}

// ${monthlyExpenses > monthlyIncome ? '⚠️ You\'re spending more than you\'re earning this month.' : '✅ You\'re within your means this month.'}`
//       }

//       // ✅ Weekly Summary
//       if (lowerQuery.includes('week') || lowerQuery.includes('weekly')) {
//         const oneWeekAgo = new Date()
//         oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        
//         const weeklyTransactions = transactions.filter(t => 
//           new Date(t.created_at) >= oneWeekAgo
//         )
        
//         const weeklyExpenses = weeklyTransactions.filter(t => t.type === 'expense')
//           .reduce((s, t) => s + Number(t.amount), 0)
//         const weeklyIncome = weeklyTransactions.filter(t => t.type === 'income')
//           .reduce((s, t) => s + Number(t.amount), 0)

//         return `📅 **Last 7 Days Summary**

// 📈 Income: ${formatCurrency(weeklyIncome)}
// 📉 Expenses: ${formatCurrency(weeklyExpenses)}
// 💰 Net: ${formatCurrency(weeklyIncome - weeklyExpenses)}

// ${weeklyTransactions.length === 0 ? 'No transactions in the last week.' : `${weeklyTransactions.length} transactions recorded.`}`
//       }

//       // ✅ Today's Summary
//       if (lowerQuery.includes('today') || lowerQuery.includes('day')) {
//         const today = new Date().toDateString()
//         const todayTransactions = transactions.filter(t => 
//           new Date(t.created_at).toDateString() === today
//         )
        
//         const todayExpenses = todayTransactions.filter(t => t.type === 'expense')
//           .reduce((s, t) => s + Number(t.amount), 0)
//         const todayIncome = todayTransactions.filter(t => t.type === 'income')
//           .reduce((s, t) => s + Number(t.amount), 0)

//         return `🌞 **Today's Summary** (${new Date().toLocaleDateString()})

// 📈 Income: ${formatCurrency(todayIncome)}
// 📉 Expenses: ${formatCurrency(todayExpenses)}
// 💰 Net: ${formatCurrency(todayIncome - todayExpenses)}

// ${todayTransactions.length === 0 ? 'No transactions today.' : `${todayTransactions.length} transactions today.`}`
//       }

//       // ✅ Recent Transactions
//       if (lowerQuery.includes('recent') || lowerQuery.includes('last') || lowerQuery.includes('latest')) {
//         const recentTransactions = transactions.slice(0, 5)
        
//         if (recentTransactions.length === 0) {
//           return "No recent transactions found."
//         }
        
//         const transactionsList = recentTransactions.map(t => 
//           `• ${formatDate(t.created_at)}: ${t.type === 'income' ? '📈' : '📉'} ${formatCurrency(t.amount)} - ${t.description || 'No description'} ${t.category ? `(${t.category})` : ''}`
//         ).join('\n')
        
//         return `📋 **Recent Transactions**\n\n${transactionsList}`
//       }

//       // ✅ Transaction Search by Amount
//       const amountMatch = lowerQuery.match(/(\d+)/)
//       if (amountMatch) {
//         const targetAmount = Number(amountMatch[0])
//         const matchedTxns = transactions.filter(
//           t => Number(t.amount) === targetAmount
//         )
        
//         if (matchedTxns.length > 0) {
//           const txnList = matchedTxns.slice(0, 3).map(t =>
//             `• ${formatDate(t.created_at)}: ${t.description || 'No description'} in ${t.category || 'Uncategorized'}`
//           ).join('\n')
          
//           return `I found ${matchedTxns.length} transaction(s) for ${formatCurrency(targetAmount)}:\n${txnList}${matchedTxns.length > 3 ? `\n...and ${matchedTxns.length - 3} more` : ''}`
//         }
        
//         if (lowerQuery.includes("for what") || lowerQuery.includes("spent on")) {
//           return `I couldn't find any transactions for ${formatCurrency(targetAmount)}.`
//         }
//       }

//       // ✅ Transaction Search by Description/Keyword
//       if (lowerQuery.includes("did") || lowerQuery.includes("spend on") || lowerQuery.includes("where did") || lowerQuery.includes("what did")) {
//         const keywords = ['did', 'i', 'spend', 'on', 'where', 'what', 'money', 'for'].reduce((acc, word) => 
//           acc.replace(new RegExp(word, 'gi'), ''), lowerQuery
//         ).trim().split(/\s+/).filter(k => k.length > 2)
        
//         if (keywords.length > 0) {
//           const matchedTxns = transactions.filter(t =>
//             keywords.some(keyword =>
//               t.description?.toLowerCase().includes(keyword) ||
//               t.category?.toLowerCase().includes(keyword) ||
//               t.budgets?.name?.toLowerCase().includes(keyword)
//             )
//           )
          
//           if (matchedTxns.length > 0) {
//             const total = matchedTxns.reduce((sum, t) => sum + Number(t.amount), 0)
//             const keywordStr = keywords.join('", "')
//             return `✅ Found ${matchedTxns.length} transaction(s) related to "${keywordStr}":\nTotal spent: ${formatCurrency(total)}\nRecent: ${matchedTxns.slice(0, 3).map(t => `${t.description} (${formatCurrency(t.amount)})`).join(', ')}`
//           }
//           return `❌ No transactions found related to "${keywords.join('", "')}".`
//         }
//       }

//       // ✅ Category-specific queries
//       const commonCategories = ['food', 'groceries', 'rent', 'shopping', 'entertainment', 'transport', 'bills', 'utilities', 'health', 'education']
//       const matchedCategory = commonCategories.find(cat => lowerQuery.includes(cat))
      
//       if (matchedCategory) {
//         const categoryTransactions = transactions.filter(t => 
//           t.type === 'expense' && 
//           (t.category?.toLowerCase().includes(matchedCategory) || 
//            t.description?.toLowerCase().includes(matchedCategory))
//         )
        
//         const categoryTotal = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
//         const monthlyCategoryTransactions = categoryTransactions.filter(t => {
//           const d = new Date(t.created_at)
//           return d.getMonth() === new Date().getMonth()
//         })
//         const monthlyTotal = monthlyCategoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
        
//         return `📊 **${matchedCategory.charAt(0).toUpperCase() + matchedCategory.slice(1)} Spending**

// Total: ${formatCurrency(categoryTotal)} (${categoryTransactions.length} transactions)
// This Month: ${formatCurrency(monthlyTotal)}
// ${monthlyTotal > 0 ? `Average per transaction: ${formatCurrency(monthlyTotal / monthlyCategoryTransactions.length)}` : ''}`
//       }

//       // ✅ Budget-related queries
//       if (lowerQuery.includes('budget') || lowerQuery.includes('over budget') || lowerQuery.includes('under budget')) {
//         if (budgets.length === 0) {
//           return "You haven't created any budgets yet. Would you like to create one?"
//         }
        
//         const budgetStatus = budgets.map(b => {
//           const used = b.current_balance
//           const allocated = b.allocated_amount
//           const percentage = (used / allocated) * 100
//           const status = percentage > 100 ? '❌ Over budget' : percentage > 80 ? '⚠️ Close to limit' : '✅ Within budget'
          
//           return `${b.name}: ${formatCurrency(used)} / ${formatCurrency(allocated)} (${percentage.toFixed(1)}%) - ${status}`
//         }).join('\n')
        
//         return `💰 **Budget Status**\n\n${budgetStatus}`
//       }

//       // ✅ Income vs Expenses comparison
//       if (lowerQuery.includes('compare') || lowerQuery.includes('vs') || lowerQuery.includes('difference')) {
//         const ratio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0
//         const savings = totalIncome - totalExpenses
        
//         return `⚖️ **Income vs Expenses**

// Total Income: ${formatCurrency(totalIncome)}
// Total Expenses: ${formatCurrency(totalExpenses)}
// Savings: ${formatCurrency(savings)}

// Expense to Income Ratio: ${ratio.toFixed(1)}%
// ${ratio > 80 ? '⚠️ You\'re spending a high percentage of your income' : '✅ Healthy spending ratio'}`
//       }

//       // ✅ Financial health check
//       if (lowerQuery.includes('health') || lowerQuery.includes('how am i doing') || lowerQuery.includes('financial situation')) {
//         const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

        
//         let healthStatus = 'Excellent'
//         let advice = 'Keep up the good work!'
        
//         if (savingsRate < 10) {
//           healthStatus = 'Needs Attention'
//           advice = 'Try to increase your savings rate by reducing unnecessary expenses'
//         } else if (savingsRate < 20) {
//           healthStatus = 'Good'
//           advice = 'You\'re doing well, but there\'s room for improvement'
//         }
        
//         return `🏥 **Financial Health Check**

// Current Balance: ${formatCurrency(balance)}
// Monthly Savings Rate: ${savingsRate.toFixed(1)}%
// Status: ${healthStatus}

// 💡 Advice: ${advice}`
//       }

//       // ✅ Basic financial queries
//       if (lowerQuery.includes('total') && lowerQuery.includes('spend')) {
//         return `You've spent a total of ${formatCurrency(totalExpenses)} across ${transactions.filter(t => t.type === 'expense').length} transactions.`
//       }

//       if (lowerQuery.includes('total') && lowerQuery.includes('income')) {
//         return `Your total income is ${formatCurrency(totalIncome)} from ${transactions.filter(t => t.type === 'income').length} income sources.`
//       }

//       if (lowerQuery.includes('balance') || lowerQuery.includes('how much money')) {
//         return `Your current balance is ${formatCurrency(balance)}.`
//       }

//       if (lowerQuery.includes('category') || lowerQuery.includes('categories')) {
//         const categorySpending = transactions.filter(t => t.type === 'expense')
//           .reduce((acc, t) => {
//             const cat = t.category || 'Other'
//             acc[cat] = (acc[cat] || 0) + Number(t.amount)
//             return acc
//           }, {} as Record<string, number>)
        
//         if (Object.keys(categorySpending).length === 0) {
//           return "No spending categories found."
//         }
        
//         const topCategories = Object.entries(categorySpending)
//           .sort(([, a], [, b]) => (b as number) - (a as number))
//           .slice(0, 8)
//           .map(([cat, amt]) => `• ${cat}: ${formatCurrency(amt as number)}`)
//           .join('\n')
        
//         return `📊 **Spending by Category**\n\n${topCategories}`
//       }

//       // ✅ Default response with suggestions
//       return `I understand you're asking about: "${query}"

// I can help you with:
// • Monthly/weekly/daily summaries
// • Specific transaction searches
// • Budget status and tracking
// • Category-wise spending
// • Income vs expenses analysis
// • Debts and credits tracking
// • Financial health insights

// Try rephrasing your question or ask about:
// "Show me this month's expenses"
// "How much did I spend on food?"
// "What's my budget status?"
// "Recent transactions"
// "Who owes me money?"
// "How much do I owe?"`

//     } catch (err) {
//       console.error("Query error:", err)
//       return "Sorry, I encountered an error while processing your request. Please try again."
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
//           "Show me this month's summary",
//           "Top spending categories",
//           "Recent transactions",
//           "Budget status",
//           "Who owes me money?",
//           "How much do I owe?"
//         ]
//       }
//       setMessages(prev => [...prev, assistantMessage])
//     } catch {
//       setMessages(prev => [...prev, {
//         id: (Date.now() + 1).toString(),
//         type: 'assistant',
//         content: "Sorry, I encountered an error. Please try again.",
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
//       <div className={`fixed bottom-6 right-6 w-80 h-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
//         {/* Header */}
//         <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
//           <div className="flex items-center space-x-2">
//             <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
//               <TrendingUp className="w-4 h-4 text-green-600" />
//             </div>
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
import { MessageCircle, X, Send, TrendingUp } from 'lucide-react'
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
      content: 'Hello! 👋 I\'m your financial AI assistant. Ask me anything about your expenses, budgets, or financial insights!',
      timestamp: new Date(),
      quickReplies: [
        "Balance?",
        "This month?",
        "Top categories?",
        "Recent?",
        "Who owes me?",
        "Budget status?"
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

    // ✅ Enhanced short-form greetings
    if (["hi", "hello", "hey", "yo"].some(greet => lowerQuery === greet)) {
      return "Hi! 👋 How can I help?"
    }

    // ✅ Enhanced thank you responses
    if (["thanks", "thank you", "thx", "ty"].some(thank => lowerQuery === thank)) {
      return "You're welcome! 😊 Anything else?"
    }

    // ✅ Short help command
    if (lowerQuery === 'help' || lowerQuery === '?') {
      return `I can help with:
• Balance & summaries
• Spending by category
• Recent transactions
• Budget tracking
• Debts & credits
• Search transactions

Try: "balance", "this month", "food spending", "who owes me"`
    }

    try {
      // Fetch user data including debts/credits
      const [transactionsResponse, budgetsResponse, debtsCreditsResponse] = await Promise.all([
        supabase
          .from('transactions')
          .select(`
            *,
            budgets (name, color)
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('budgets')
          .select('*')
          .eq('user_id', user?.id),
        supabase
          .from('debts_credits')
          .select('*')
          .eq('user_id', user?.id)
      ])

      const transactions = transactionsResponse.data || []
      const budgets = budgetsResponse.data || []
      const debtsCredits = debtsCreditsResponse.data || []

      // Calculate basic metrics
      const totalIncome = transactions.filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const totalExpenses = transactions.filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)
      const balance = totalIncome - totalExpenses

      // Calculate debt/credit metrics
      const totalDebt = debtsCredits.filter(d => d.type === 'debt' && !d.is_settled)
        .reduce((sum, d) => sum + Number(d.amount), 0)
      const totalCredit = debtsCredits.filter(d => d.type === 'credit' && !d.is_settled)
        .reduce((sum, d) => sum + Number(d.amount), 0)
      const netDebtCredit = totalCredit - totalDebt

      // ✅ Enhanced short-form balance queries
      if (["balance", "balance?", "current balance", "how much", "money"].some(q => lowerQuery === q)) {
        const emoji = balance >= 0 ? '💰' : '⚠️'
        return `${emoji} Balance: ${formatCurrency(balance)}`
      }

      // ✅ Enhanced short-form total spending
      if (["total", "total spend", "spent", "expenses", "spending"].some(q => lowerQuery === q)) {
        return `📉 Total expenses: ${formatCurrency(totalExpenses)} (${transactions.filter(t => t.type === 'expense').length} transactions)`
      }

      // ✅ Enhanced short-form income
      if (["income", "earned", "earnings", "total income"].some(q => lowerQuery === q)) {
        return `📈 Total income: ${formatCurrency(totalIncome)} (${transactions.filter(t => t.type === 'income').length} sources)`
      }

      // ✅ Enhanced Debt and Credit queries with short forms
      if (["debt", "debts", "owe", "owing", "i owe"].some(q => lowerQuery.includes(q))) {
        const debts = debtsCredits.filter(d => d.type === 'debt' && !d.is_settled)
        if (debts.length === 0) {
          return "✅ You don't owe anyone money!"
        }
        const debtList = debts.slice(0, 3).map(d => 
          `• ${d.person_name}: ${formatCurrency(d.amount)}`
        ).join('\n')
        return `💳 **You owe:**\n${debtList}${debts.length > 3 ? `\n...+${debts.length - 3} more` : ''}\n\nTotal: ${formatCurrency(totalDebt)}`
      }

      if (["credit", "credits", "owes me", "owe me", "who owes", "owes"].some(q => lowerQuery.includes(q))) {
        const credits = debtsCredits.filter(d => d.type === 'credit' && !d.is_settled)
        if (credits.length === 0) {
          return "💰 No one owes you money currently."
        }
        const creditList = credits.slice(0, 3).map(c => 
          `• ${c.person_name}: ${formatCurrency(c.amount)}`
        ).join('\n')
        return `💰 **Others owe you:**\n${creditList}${credits.length > 3 ? `\n...+${credits.length - 3} more` : ''}\n\nTotal: ${formatCurrency(totalCredit)}`
      }

      // ✅ Enhanced debt/credit summary with short forms
      if (["debt summary", "debt status", "net debt", "debt balance", "who", "all debts"].some(q => lowerQuery.includes(q))) {
        return `📊 **Debt & Credit Summary:**

💳 You owe: ${formatCurrency(totalDebt)}
💰 Others owe you: ${formatCurrency(totalCredit)}
⚖️ Net: ${formatCurrency(netDebtCredit)}

${netDebtCredit >= 0 ? '✅ You\'re in a positive position!' : '⚠️ You owe more than you\'re owed.'}`
      }

      // ✅ Enhanced Monthly Summary with short forms
      if (["month", "this month", "monthly", "month?", "this month?"].some(q => lowerQuery === q)) {
        const now = new Date()
        const currentMonth = now.getMonth()
        const currentYear = now.getFullYear()
        
        const monthlyTransactions = transactions.filter(t => {
          const d = new Date(t.created_at)
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear
        })
        
        const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense')
          .reduce((s, t) => s + Number(t.amount), 0)
        const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income')
          .reduce((s, t) => s + Number(t.amount), 0)
        
        // Top categories this month
        const categorySpending = monthlyTransactions.filter(t => t.type === 'expense')
          .reduce((acc, t) => {
            const cat = t.category || 'Other'
            acc[cat] = (acc[cat] || 0) + Number(t.amount)
            return acc
          }, {} as Record<string, number>)
        
        const topCategories = Object.entries(categorySpending)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([cat, amt]) => `• ${cat}: ${formatCurrency(amt as number)}`)
          .join('\n')

        const monthName = now.toLocaleString('default', { month: 'short' })
        const netSavings = monthlyIncome - monthlyExpenses
        const emoji = netSavings >= 0 ? '✅' : '⚠️'

        return `📊 **${monthName} ${currentYear}**

📈 Income: ${formatCurrency(monthlyIncome)}
📉 Expenses: ${formatCurrency(monthlyExpenses)}
${emoji} Net: ${formatCurrency(netSavings)}

🏆 **Top Categories:**
${topCategories || 'No spending this month'}`
      }

      // ✅ Enhanced Weekly Summary with short forms
      if (["week", "weekly", "last week", "week?", "7 days"].some(q => lowerQuery === q)) {
        const oneWeekAgo = new Date()
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
        
        const weeklyTransactions = transactions.filter(t => 
          new Date(t.created_at) >= oneWeekAgo
        )
        
        const weeklyExpenses = weeklyTransactions.filter(t => t.type === 'expense')
          .reduce((s, t) => s + Number(t.amount), 0)
        const weeklyIncome = weeklyTransactions.filter(t => t.type === 'income')
          .reduce((s, t) => s + Number(t.amount), 0)

        return `📅 **Last 7 Days**

📈 Income: ${formatCurrency(weeklyIncome)}
📉 Expenses: ${formatCurrency(weeklyExpenses)}
💰 Net: ${formatCurrency(weeklyIncome - weeklyExpenses)}

${weeklyTransactions.length} transactions`
      }

      // ✅ Enhanced Today's Summary with short forms
      if (["today", "today?", "daily"].some(q => lowerQuery === q)) {
        const today = new Date().toDateString()
        const todayTransactions = transactions.filter(t => 
          new Date(t.created_at).toDateString() === today
        )
        
        const todayExpenses = todayTransactions.filter(t => t.type === 'expense')
          .reduce((s, t) => s + Number(t.amount), 0)
        const todayIncome = todayTransactions.filter(t => t.type === 'income')
          .reduce((s, t) => s + Number(t.amount), 0)

        return `🌞 **Today**

📈 Income: ${formatCurrency(todayIncome)}
📉 Expenses: ${formatCurrency(todayExpenses)}
💰 Net: ${formatCurrency(todayIncome - todayExpenses)}

${todayTransactions.length} transactions today`
      }

      // ✅ Enhanced Recent Transactions with short forms
      if (["recent", "latest", "last", "recent?", "transactions"].some(q => lowerQuery === q)) {
        const recentTransactions = transactions.slice(0, 5)
        
        if (recentTransactions.length === 0) {
          return "No recent transactions found."
        }
        
        const transactionsList = recentTransactions.map(t => 
          `• ${t.type === 'income' ? '📈' : '📉'} ${formatCurrency(t.amount)} - ${t.description || 'No description'}`
        ).join('\n')
        
        return `📋 **Recent:**\n${transactionsList}`
      }

      // ✅ Enhanced Budget queries with short forms
      if (["budget", "budgets", "budget?", "budget status", "over budget"].some(q => lowerQuery.includes(q))) {
        if (budgets.length === 0) {
          return "No budgets created yet. Create one to track spending!"
        }
        
        const budgetStatus = budgets.slice(0, 4).map(b => {
          const used = b.current_balance
          const allocated = b.allocated_amount
          const percentage = (used / allocated) * 100
          const emoji = percentage > 100 ? '❌' : percentage > 80 ? '⚠️' : '✅'
          
          return `${emoji} ${b.name}: ${formatCurrency(used)}/${formatCurrency(allocated)} (${percentage.toFixed(0)}%)`
        }).join('\n')
        
        return `💰 **Budget Status:**\n${budgetStatus}`
      }

      // ✅ Enhanced Category queries with short forms
      if (["categories", "category", "categories?", "top categories", "spending by category"].some(q => lowerQuery.includes(q))) {
        const categorySpending = transactions.filter(t => t.type === 'expense')
          .reduce((acc, t) => {
            const cat = t.category || 'Other'
            acc[cat] = (acc[cat] || 0) + Number(t.amount)
            return acc
          }, {} as Record<string, number>)
        
        if (Object.keys(categorySpending).length === 0) {
          return "No spending categories found."
        }
        
        const topCategories = Object.entries(categorySpending)
          .sort(([, a], [, b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([cat, amt]) => `• ${cat}: ${formatCurrency(amt as number)}`)
          .join('\n')
        
        return `📊 **Top Categories:**\n${topCategories}`
      }

      // ✅ Enhanced Transaction Search by Amount
      const amountMatch = lowerQuery.match(/(\d+)/)
      if (amountMatch) {
        const targetAmount = Number(amountMatch[0])
        const matchedTxns = transactions.filter(
          t => Number(t.amount) === targetAmount
        )
        
        if (matchedTxns.length > 0) {
          const txnList = matchedTxns.slice(0, 3).map(t =>
            `• ${formatDate(t.created_at)}: ${t.description || 'No description'}`
          ).join('\n')
          
          return `Found ${matchedTxns.length} transaction(s) for ${formatCurrency(targetAmount)}:\n${txnList}`
        }
        
        return `No transactions found for ${formatCurrency(targetAmount)}.`
      }

      // ✅ Enhanced Category-specific queries (food, rent, etc.)
      const commonCategories = ['food', 'groceries', 'rent', 'shopping', 'entertainment', 'transport', 'bills', 'utilities', 'health', 'education', 'travel', 'dining']
      const matchedCategory = commonCategories.find(cat => lowerQuery.includes(cat))
      
      if (matchedCategory) {
        const categoryTransactions = transactions.filter(t => 
          t.type === 'expense' && 
          (t.category?.toLowerCase().includes(matchedCategory) || 
           t.description?.toLowerCase().includes(matchedCategory))
        )
        
        const categoryTotal = categoryTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
        const thisMonth = categoryTransactions.filter(t => {
          const d = new Date(t.created_at)
          return d.getMonth() === new Date().getMonth()
        })
        const monthlyTotal = thisMonth.reduce((sum, t) => sum + Number(t.amount), 0)
        
        return `📊 **${matchedCategory.charAt(0).toUpperCase() + matchedCategory.slice(1)}**

Total: ${formatCurrency(categoryTotal)} (${categoryTransactions.length} transactions)
This month: ${formatCurrency(monthlyTotal)}${monthlyTotal > 0 ? ` (${thisMonth.length} txns)` : ''}`
      }

      // ✅ Enhanced Transaction Search by Description/Keyword
      if (lowerQuery.includes("spent on") || lowerQuery.includes("where did") || lowerQuery.includes("what did")) {
        const keywords = lowerQuery.replace(/spent on|where did|what did|i|spend|money/gi, '').trim().split(/\s+/).filter(k => k.length > 2)
        
        if (keywords.length > 0) {
          const matchedTxns = transactions.filter(t =>
            keywords.some(keyword =>
              t.description?.toLowerCase().includes(keyword) ||
              t.category?.toLowerCase().includes(keyword)
            )
          )
          
          if (matchedTxns.length > 0) {
            const total = matchedTxns.reduce((sum, t) => sum + Number(t.amount), 0)
            return `Found ${matchedTxns.length} transaction(s) for "${keywords[0]}":\nTotal: ${formatCurrency(total)}\nRecent: ${matchedTxns.slice(0, 2).map(t => `${t.description} (${formatCurrency(t.amount)})`).join(', ')}`
          }
          return `No transactions found for "${keywords[0]}".`
        }
      }

      // ✅ Enhanced Income vs Expenses comparison with short forms
      if (["compare", "vs", "difference", "income vs expenses"].some(q => lowerQuery.includes(q))) {
        const ratio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0
        const savings = totalIncome - totalExpenses
        const emoji = ratio > 80 ? '⚠️' : '✅'
        
        return `⚖️ **Income vs Expenses**

📈 Income: ${formatCurrency(totalIncome)}
📉 Expenses: ${formatCurrency(totalExpenses)}
💰 Savings: ${formatCurrency(savings)}

${emoji} Expense ratio: ${ratio.toFixed(1)}%`
      }

      // ✅ Enhanced Financial health check with short forms
      if (["health", "financial health", "how am i doing", "status", "overview"].some(q => lowerQuery.includes(q))) {
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0
        
        let healthEmoji = '🟢'
        let advice = 'Keep it up!'
        
        if (savingsRate < 10) {
          healthEmoji = '🔴'
          advice = 'Try reducing expenses'
        } else if (savingsRate < 20) {
          healthEmoji = '🟡'
          advice = 'Good progress, room to improve'
        }
        
        return `${healthEmoji} **Financial Health**

Balance: ${formatCurrency(balance)}
Savings rate: ${savingsRate.toFixed(1)}%
💡 ${advice}`
      }

      // ✅ Default response with smart suggestions based on query
      const suggestions = [
        "Balance?",
        "This month?",
        "Recent?",
        "Categories?",
        "Who owes me?",
        "Budget status?"
      ]

      return `I didn't quite understand "${query}".

Try asking:
${suggestions.map(s => `• ${s}`).join('\n')}

Or ask about specific categories like "food", "rent", etc.`

    } catch (err) {
      console.error("Query error:", err)
      return "Sorry, I encountered an error. Please try again."
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
          "Balance?",
          "This month?",
          "Categories?",
          "Recent?",
          "Who owes me?",
          "Budget?"
        ]
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
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
            <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-green-600" />
            </div>
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