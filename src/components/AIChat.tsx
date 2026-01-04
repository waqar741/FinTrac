import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Cpu, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  quickReplies?: string[]
}

const API_URL = import.meta.env.VITE_AI_API_URL

export default function AIChat() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [useModel, setUseModel] = useState(true)

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I am Fintrac AI. How can I help?',
      timestamp: new Date(),
      quickReplies: [
        'Balance?', 'This month?', 'Inc vs exp?', 
        'I owe?', 'Goals?', 'Recent?', 
        'Who owes me?', 'Budget status?', 'Categories?'
      ]
    }
  ])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // --- AI Context State ---
  const [systemContext, setSystemContext] = useState('')
  const [onlineModelId, setOnlineModelId] = useState('')
  const [isBackendReachable, setIsBackendReachable] = useState(false)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isOpen, loading])

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    if (!user) return

    const initAI = async () => {
      await refreshFinancialContext()
      try {
        const res = await fetch(`${API_URL}/models`)
        if (res.ok) {
          const data = await res.json()
          const models = data.data || []
          if (models.length > 0) {
            setOnlineModelId(models[0].id)
            setIsBackendReachable(true)
          }
        }
      } catch (e) {
        setIsBackendReachable(false)
      }
    }

    initAI()
  }, [user, isOpen])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount)
  
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  // --- 2. DATA BUILDER (Now includes Names for AI) ---
  const refreshFinancialContext = async () => {
    try {
      const [trRes, acRes, dcRes, glRes] = await Promise.all([
        supabase.from('transactions').select('*, accounts(name)').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('accounts').select('*').eq('user_id', user?.id),
        supabase.from('debts_credits').select('*').eq('user_id', user?.id).eq('is_settled', false),
        supabase.from('savings_goals').select('*').eq('user_id', user?.id)
      ])

      const transactions = trRes.data || []
      const accounts = acRes.data || []
      const debtsCredits = dcRes.data || []
      const goals = glRes.data || []

      // Totals
      const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

      // Month Stats
      const now = new Date()
      const currentMonthTxns = transactions.filter(t => {
        const d = new Date(t.created_at || t.transaction_date)
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      })
      const monthIncome = currentMonthTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const monthExpense = currentMonthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      
      // Debts & Credits Strings (Added Names Here)
      const debtList = debtsCredits
        .filter(d => d.type === 'debt')
        .map(d => `${d.counterpart_name}: ${formatCurrency(d.amount)}`)
        .join(', ')
      const creditList = debtsCredits
        .filter(d => d.type === 'credit')
        .map(c => `${c.counterpart_name}: ${formatCurrency(c.amount)}`)
        .join(', ')
      
      const iOweTotal = debtsCredits.filter(d => d.type === 'debt').reduce((s, d) => s + Number(d.amount), 0)
      const owedTotal = debtsCredits.filter(d => d.type === 'credit').reduce((s, d) => s + Number(d.amount), 0)

      const recentTxText = transactions.slice(0, 5).map(t => 
        `• ${formatDate(t.created_at || t.transaction_date)}: ${t.description || 'Unknown'} (${formatCurrency(t.amount)})`
      ).join('\n')

      const catTotals = currentMonthTxns.filter(t => t.type === 'expense').reduce((acc, t) => {
         const c = t.category || 'Other'
         acc[c] = (acc[c] || 0) + Number(t.amount)
         return acc
      }, {} as Record<string, number>)
      const topCats = Object.entries(catTotals).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([k,v]) => `${k}: ${formatCurrency(v)}`).join(', ')

      const context = `
      You are Fintrac AI. Answer strictly based on the provided data.
      
      **RULES:**
      1. Be Concise (Max 4 lines).
      2. Use Emojis & Newlines for structure.
      3. If asked for Debts/Credits, LIST THE NAMES and amounts.

      **DATA:**
      - Total Balance: ${formatCurrency(totalBalance)}
      - Income (All time): ${formatCurrency(totalIncome)}
      - Expenses (All time): ${formatCurrency(totalExpenses)}
      - THIS MONTH Income: ${formatCurrency(monthIncome)}
      - THIS MONTH Expenses: ${formatCurrency(monthExpense)}
      - Net Savings (Month): ${formatCurrency(monthIncome - monthExpense)}
      
      - DEBTS (I Owe): Total ${formatCurrency(iOweTotal)}. Details: [${debtList || 'None'}]
      - CREDITS (Owes Me): Total ${formatCurrency(owedTotal)}. Details: [${creditList || 'None'}]
      
      - Goals: ${goals.map(g => `${g.name} (${formatCurrency(g.current_amount || 0)}/${formatCurrency(g.target_amount)})`).join(', ') || 'None'}
      - Top Categories (Month): ${topCats || 'None'}

      **RECENT TRANSACTIONS:**
      ${recentTxText}
      `
      setSystemContext(context)
    } catch (e) {
      console.error("Context build error", e)
    }
  }

  // --- 3. ONLINE ENGINE ---
  const processOnline = async (query: string, messageId: string) => {
    let responseText = ''
    try {
      const res = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: onlineModelId,
          messages: [
            { role: 'system', content: systemContext },
            { role: 'user', content: query }
          ],
          stream: true,
          temperature: 0.1,
          max_tokens: 200
        })
      })

      if (!res.body) throw new Error('No stream')
      
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let done = false

      while (!done) {
        const { value, done: doneReading } = await reader.read()
        done = doneReading
        const chunkValue = decoder.decode(value, { stream: true })
        
        const lines = chunkValue.split('\n').filter(line => line.trim() !== '')
        for (const line of lines) {
          if (line.includes('[DONE]')) break
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.replace('data: ', ''))
              const content = data.choices[0]?.delta?.content || ''
              if (content) {
                responseText += content
                setMessages(prev => 
                  prev.map(m => m.id === messageId ? { ...m, content: responseText } : m)
                )
              }
            } catch (e) { console.error(e) }
          }
        }
      }
    } catch (e) {
      const fallback = await processOffline(query)
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: fallback } : m))
    }
  }

  // --- 4. OFFLINE ENGINE ---
  const processOffline = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase().trim()

    try {
      const [trRes, acRes, dcRes, glRes] = await Promise.all([
        supabase.from('transactions').select('*, accounts(name)').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('accounts').select('*').eq('user_id', user?.id),
        supabase.from('debts_credits').select('*').eq('user_id', user?.id).eq('is_settled', false),
        supabase.from('savings_goals').select('*').eq('user_id', user?.id)
      ])

      const transactions = trRes.data || []
      const accounts = acRes.data || []
      const debtsCredits = dcRes.data || []
      const goals = glRes.data || []

      const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)
      const totalDebt = debtsCredits.filter(d => d.type === 'debt').reduce((s, d) => s + Number(d.amount), 0)
      const totalCredit = debtsCredits.filter(d => d.type === 'credit').reduce((s, d) => s + Number(d.amount), 0)

      if (['balance', 'bal', 'money'].some(q => lowerQuery.includes(q))) {
        return `💰 BALANCE STATUS
──────────────
Current: ${formatCurrency(totalBalance)}

📊 Totals:
• Income: ${formatCurrency(totalIncome)}
• Expense: ${formatCurrency(totalExpenses)}`
      }

      if (['recent', 'last', 'latest'].some(q => lowerQuery.includes(q))) {
        const recent = transactions.slice(0, 5).map(t => 
            `• ${formatDate(t.created_at || t.transaction_date)}: ${t.description} (${formatCurrency(t.amount)})`
        ).join('\n')
        return recent ? `🕒 RECENT ACTIVITY\n──────────────\n${recent}` : 'No recent transactions.'
      }

      if (['month', 'monthly'].some(q => lowerQuery.includes(q))) {
        const now = new Date()
        const monthTxns = transactions.filter(t => {
            const d = new Date(t.created_at || t.transaction_date)
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })
        const inc = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        const exp = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        return `📅 THIS MONTH
──────────────
📈 Income:  ${formatCurrency(inc)}
📉 Expense: ${formatCurrency(exp)}
💰 Net:     ${formatCurrency(inc - exp)}`
      }

      // Fixed: Explicitly lists names for Debts
      if (['owe', 'debt', 'payable'].some(q => lowerQuery.includes(q)) && !lowerQuery.includes('me')) {
        const debts = debtsCredits.filter(d => d.type === 'debt')
        if (debts.length === 0) return '✅ No active debts!'
        const list = debts.map(d => `• ${d.counterpart_name}: ${formatCurrency(d.amount)}`).join('\n')
        return `💸 YOU OWE
──────────────
${list}
──────────────
Total: ${formatCurrency(totalDebt)}`
      }

      // Fixed: Explicitly lists names for Credits
      if (['owes me', 'credit', 'receivable'].some(q => lowerQuery.includes(q))) {
        const credits = debtsCredits.filter(d => d.type === 'credit')
        if (credits.length === 0) return '✅ No one owes you money.'
        const list = credits.map(c => `• ${c.counterpart_name}: ${formatCurrency(c.amount)}`).join('\n')
        return `💰 OWED TO YOU
──────────────
${list}
──────────────
Total: ${formatCurrency(totalCredit)}`
      }

      if (['goal', 'target', 'save'].some(q => lowerQuery.includes(q))) {
        if (goals.length === 0) return '🎯 No active goals.'
        return `🎯 GOALS PROGRESS
──────────────
` + goals.map(g => 
          `• ${g.name}: ${formatCurrency(g.current_amount || 0)} / ${formatCurrency(g.target_amount)}`
        ).join('\n')
      }

      if (['category', 'categories', 'spending'].some(q => lowerQuery.includes(q))) {
        const expenses = transactions.filter(t => t.type === 'expense')
        const catMap = expenses.reduce((acc, t) => {
             const c = t.category || 'Other'
             acc[c] = (acc[c] || 0) + Number(t.amount)
             return acc
        }, {} as Record<string, number>)
        const top = Object.entries(catMap).sort((a,b) => b[1] - a[1]).slice(0, 4)
          .map(([k,v]) => `• ${k}: ${formatCurrency(v)}`).join('\n')
        return `📊 TOP SPENDING
──────────────
${top}`
      }

      return "💡 Try asking: Balance?, Month?, Debts? or Goals?"

    } catch (e) {
      return "⚠️ Error accessing records."
    }
  }

  // --- 5. HANDLE SEND ---
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

    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: assistantId,
      type: 'assistant',
      content: '', 
      timestamp: new Date(),
      quickReplies: ['Balance?', 'This month?', 'Debts?', 'Goals?']
    }])

    try {
      if (useModel && isBackendReachable) {
        await processOnline(query, assistantId)
      } else {
        setTimeout(async () => {
          const response = await processOffline(query)
          setMessages(prev => prev.map(m => 
            m.id === assistantId ? { ...m, content: response } : m
          ))
        }, 600)
      }
    } catch (e) {
      setMessages(prev => prev.map(m => 
        m.id === assistantId ? { ...m, content: "Error processing request." } : m
      ))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-all duration-300 flex items-center justify-center z-40 ${isOpen ? 'scale-0' : 'scale-100'}`}
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      <div className={`fixed bottom-6 right-6 w-80 h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 flex flex-col ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-xl">
          <div className="flex items-center space-x-3">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
            </svg>

            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Fintrac AI</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${isBackendReachable ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {useModel && isBackendReachable ? 'Model' : 'Rules'}
                    </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
                onClick={() => setUseModel(!useModel)}
                className={`p-1.5 rounded-lg transition-colors ${useModel ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}
                title={useModel ? "Switch to Rule-Based" : "Switch to AI Model"}
            >
                {useModel ? <Cpu className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
            </button>
            <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
                <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white dark:bg-gray-800">
          {messages.map((m) => (
            (m.content) ? (
                <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-line shadow-sm font-medium ${m.type === 'user' ? 'bg-green-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'}`}>
                    {m.content}
                </div>
                </div>
            ) : null
          ))}
          
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded-lg rounded-bl-none">
                <div className="flex space-x-1">
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                  <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
          
          {/* Quick Replies */}
          {!loading && messages[messages.length - 1]?.quickReplies && (
            <div className="flex flex-wrap gap-2 pt-1">
              {messages[messages.length - 1].quickReplies!.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(q)}
                  className="px-2 py-1 text-[11px] bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-md hover:bg-green-100 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-xl">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              placeholder={useModel ? "Ask AI..." : "Command..."}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-1 focus:ring-green-500 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white"
              disabled={loading}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={loading || !inputValue.trim()}
              className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}