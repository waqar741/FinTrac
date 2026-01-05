import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Cpu, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { startOfMonth, subMonths, startOfYear, subYears } from 'date-fns'

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
        'Balance?', 'My Accounts?', 'Inc vs exp?',
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

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await fetch(`${API_URL}/models`)
        if (res.ok) setIsBackendReachable(true)
      } catch (e) { setIsBackendReachable(false) }
    }
    if (isOpen) checkBackend()
  }, [isOpen])

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  // --- 2. DATA BUILDER (Returns context string for immediate use) ---
  const refreshFinancialContext = async (query: string = ''): Promise<string> => {
    try {
      const lowerQ = query.toLowerCase()
      let startDate = startOfMonth(new Date()) // Default: Current Month

      // Dynamic Range based on Query
      if (lowerQ.includes('last month') || lowerQ.includes('previous month')) {
        startDate = startOfMonth(subMonths(new Date(), 1))
      } else if (lowerQ.includes('year') || lowerQ.includes('annual')) {
        startDate = startOfYear(new Date())
      } else if (lowerQ.includes('all') || lowerQ.includes('history') || lowerQ.includes('total')) {
        startDate = new Date(0) // Start of epoch (All time)
      } else if (lowerQ.includes('last 2 months')) {
        startDate = subMonths(new Date(), 2)
      }

      const [trRes, acRes, dcRes, glRes, upRes] = await Promise.all([
        supabase.from('transactions')
          .select('*, accounts(name)')
          .eq('user_id', user?.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false }),
        supabase.from('accounts').select('*').eq('user_id', user?.id),
        supabase.from('debts_credits').select('*').eq('user_id', user?.id).eq('is_settled', false),
        supabase.from('savings_goals').select('*').eq('user_id', user?.id),
        supabase.from('profiles').select('full_name').eq('id', user?.id).single()
      ])

      const transactions = trRes.data || []
      const accounts = acRes.data || []
      const debtsCredits = dcRes.data || []
      const goals = glRes.data || []
      const profile = upRes.data

      const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)

      // Calculate totals based on the fetched transactions (which are time-filtered)
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)

      const accountList = accounts.map(a => `${a.name} (${a.bank_name || 'Bank'}): ${formatCurrency(a.balance)}`).join(', ')
      const debtList = debtsCredits.filter(d => d.type === 'debt').map(d => `${d.person_name || 'Unknown'}: ${formatCurrency(d.amount)}`).join(', ')
      const creditList = debtsCredits.filter(d => d.type === 'credit').map(c => `${c.person_name || 'Unknown'}: ${formatCurrency(c.amount)}`).join(', ')

      const context = `
      You are Fintrac AI. Answer strictly based on the provided data.
      User Name: ${profile?.full_name || 'User'}
      
      **FINANCIAL DATA (From ${formatDate(startDate.toISOString())} to Now):**
      - Total Balance: ${formatCurrency(totalBalance)}
      - Accounts (${accounts.length}): [${accountList}]
      - Income (in selected period): ${formatCurrency(totalIncome)}
      - Expenses (in selected period): ${formatCurrency(totalExpenses)}
      
      - DEBTS (I Owe): [${debtList || 'None'}]
      - CREDITS (Owes Me): [${creditList || 'None'}]
      - Goals: ${goals.map(g => `${g.name} (${formatCurrency(g.current_amount || 0)}/${formatCurrency(g.target_amount)})`).join(', ') || 'None'}
      
      **RECENT TRANSACTIONS (Selected Period):**
      ${transactions.slice(0, 10).map(t => `${formatDate(t.created_at)}: ${t.description} (${formatCurrency(t.amount)})`).join('\n')}
      
      IMPORTANT:
      - Always refer to the user as 'You'. 
      - Do NOT use the name '${profile?.full_name}' in your response (e.g., say "You owe", not "${profile?.full_name} owes").
      - Provide plain text responses only.
      - Do NOT use markdown formatting (no bold **, no italics *).
      - Be concise and helpful.
      `
      setSystemContext(context)
      return context
    } catch (e) {
      console.error("Context build error", e)
      return systemContext // Start with old context if fail
    }
  }

  // --- 3. ONLINE ENGINE ---
  const processOnline = async (query: string, messageId: string, currentContext: string) => {
    let responseText = ''
    try {
      const res = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: onlineModelId,
          messages: [
            { role: 'system', content: currentContext },
            { role: 'user', content: query }
          ],
          stream: true,
          temperature: 0.1,
          max_tokens: 300
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

  // --- 4. OFFLINE ENGINE (Updated Regex) ---
  const processOffline = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase().trim()

    // Match helper
    const matches = (keywords: string[]) => keywords.some(k => new RegExp(`\\b${k}\\b`, 'i').test(lowerQuery))

    // --- Basic Personality & Identity ---
    if (['hi', 'hello', 'hey', 'yo', 'greetings'].some(q => lowerQuery.includes(q))) {
      return "Hello! How can I help you with your finances today?"
    }

    try {
      const [trRes, acRes, dcRes, glRes, upRes] = await Promise.all([
        supabase.from('transactions').select('*, accounts(name)').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('accounts').select('*').eq('user_id', user?.id),
        supabase.from('debts_credits').select('*').eq('user_id', user?.id).eq('is_settled', false),
        supabase.from('savings_goals').select('*').eq('user_id', user?.id),
        supabase.from('profiles').select('full_name').eq('id', user?.id).single()
      ])

      const transactions = trRes.data || []
      const accounts = acRes.data || []
      const debtsCredits = dcRes.data || []
      const goals = glRes.data || []
      const profile = upRes.data

      const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)
      const totalDebt = debtsCredits.filter(d => d.type === 'debt').reduce((s, d) => s + Number(d.amount), 0)
      const totalCredit = debtsCredits.filter(d => d.type === 'credit').reduce((s, d) => s + Number(d.amount), 0)

      // --- Identity Query ---
      if (lowerQuery.includes('who am i') || lowerQuery.includes('my name')) {
        return profile?.full_name ? `You are ${profile.full_name}.` : `You are logged in as ${user?.email}.`
      }

      // --- Account Queries ---
      if (matches(['accounts', 'account', 'bank', 'banks'])) {
        if (accounts.length === 0) return "You don't have any accounts linked yet."
        const accountDetails = accounts.map(a =>
          `• ${a.name} (${a.bank_name || 'Bank'}): ${formatCurrency(a.balance)}`
        ).join('\n')
        return `You have ${accounts.length} accounts:\n${accountDetails}\n\nTotal Balance: ${formatCurrency(totalBalance)}`
      }

      // --- Standard Financial Queries ---

      if (matches(['balance', 'bal', 'money', 'cash', 'funds'])) {
        return `Balance Status:
Current: ${formatCurrency(totalBalance)}

Totals:
• Income: ${formatCurrency(totalIncome)}
• Expense: ${formatCurrency(totalExpenses)}`
      }

      if (matches(['recent', 'last', 'latest', 'history'])) {
        const recent = transactions.slice(0, 5).map(t =>
          `• ${formatDate(t.created_at || t.transaction_date)}: ${t.description} (${formatCurrency(t.amount)})`
        ).join('\n')
        return recent ? `Recent Activity:\n${recent}` : 'No recent transactions.'
      }

      if (matches(['month', 'monthly'])) {
        const now = new Date()
        const monthTxns = transactions.filter(t => {
          const d = new Date(t.created_at || t.transaction_date)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })
        const inc = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        const exp = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        return `This Month:
Income:  ${formatCurrency(inc)}
Expense: ${formatCurrency(exp)}
Net:     ${formatCurrency(inc - exp)}`
      }

      if (matches(['owe', 'debt', 'payable', 'liability']) && !lowerQuery.includes('owed to me')) {
        const debts = debtsCredits.filter(d => d.type === 'debt')
        if (debts.length === 0) return 'No active debts!'
        const list = debts.map(d => `• ${d.person_name || 'Unknown'}: ${formatCurrency(d.amount)}`).join('\n')
        return `You Owe:\n${list}\nTotal: ${formatCurrency(totalDebt)}`
      }

      if (matches(['owes me', 'credit', 'receivable', 'owed to me'])) {
        const credits = debtsCredits.filter(d => d.type === 'credit')
        if (credits.length === 0) return 'No one owes you money.'
        const list = credits.map(c => `• ${c.person_name || 'Unknown'}: ${formatCurrency(c.amount)}`).join('\n')
        return `Owed to You:\n${list}\nTotal: ${formatCurrency(totalCredit)}`
      }

      if (matches(['goal', 'target', 'save', 'saving'])) {
        if (goals.length === 0) return 'No active goals.'
        return `Goals Progress:\n` + goals.map(g =>
          `• ${g.name}: ${formatCurrency(g.current_amount || 0)} / ${formatCurrency(g.target_amount)}`
        ).join('\n')
      }

      if (matches(['category', 'categories', 'spending', 'expense'])) {
        const expenses = transactions.filter(t => t.type === 'expense')
        const catMap = expenses.reduce((acc, t) => {
          const c = t.category || 'Other'
          acc[c] = (acc[c] || 0) + Number(t.amount)
          return acc
        }, {} as Record<string, number>)
        const top = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 4)
          .map(([k, v]) => `• ${k}: ${formatCurrency(v)}`).join('\n')
        return `Top Spending:\n${top}`
      }

      return "I can help with Balance, Recent transactions, Debts, Goals, or Account details."

    } catch (e) {
      return "Error accessing records."
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
      content: '', // Will stream in
      timestamp: new Date(),
      quickReplies: ['Balance?', 'My Accounts?', 'Debts?', 'Goals?']
    }])

    try {
      if (useModel && isBackendReachable) {
        // Refresh context BEFORE asking
        const freshContext = await refreshFinancialContext(query)
        await processOnline(query, assistantId, freshContext)
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

  const cleanContent = (content: string) => content.replace(/\*\*/g, '').replace(/\*/g, '•') // Simple cleaner

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
                    {useModel && isBackendReachable ? 'Model' : 'Offline'}
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
                  {m.type === 'assistant' ? cleanContent(m.content) : m.content}
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