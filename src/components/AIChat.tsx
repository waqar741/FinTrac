import { useState, useEffect, useRef } from 'react'
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

const API_URL = import.meta.env.VITE_AI_API_URL

export default function AIChat() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Start with just the welcome message
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I am Fintrac AI. How can I help?',
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

  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // --- AI State ---
  const [systemContext, setSystemContext] = useState('')
  const [isOnline, setIsOnline] = useState(false) // State for Red/Green dot
  const [onlineModelId, setOnlineModelId] = useState('')

  useEffect(() => {
    scrollToBottom()
  }, [messages, isOpen, loading])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // --- 1. INITIALIZATION ---
  useEffect(() => {
    if (!user) return

    const initAI = async () => {
      // A. Build Context (Hidden)
      await refreshFinancialContext()

      // B. Check Connectivity (For Red/Green Dot)
      try {
        const res = await fetch(`${API_URL}/models`)
        if (res.ok) {
          const data = await res.json()
          const models = data.data || []
          if (models.length > 0) {
            setOnlineModelId(models[0].id)
            setIsOnline(true) // Green Dot
          }
        } else {
          setIsOnline(false) // Red Dot
        }
      } catch (e) {
        setIsOnline(false) // Red Dot
      }
    }

    initAI()
  }, [user])

  // Helpers
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(amount)
  
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  // --- 2. DATA BUILDER ---
  const refreshFinancialContext = async () => {
    try {
      const [transactionsRes, accountsRes, debtsRes, goalsRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(30),
        supabase.from('accounts').select('*').eq('user_id', user?.id),
        supabase.from('debts_credits').select('*').eq('user_id', user?.id).eq('is_settled', false),
        supabase.from('goals').select('*').eq('user_id', user?.id).eq('is_active', true)
      ])

      const transactions = transactionsRes.data || []
      const accounts = accountsRes.data || []
      const debts = debtsRes.data || []
      const goals = goalsRes.data || []

      // Totals
      const totalBalance = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
      const totalDebt = debts.filter(d => d.type === 'debt').reduce((s, d) => s + Number(d.amount), 0)
      const totalCredit = debts.filter(d => d.type === 'credit').reduce((s, d) => s + Number(d.amount), 0)

      // Recent Transactions String
      const recentTxText = transactions.slice(0, 10).map(t => 
        `- ${t.created_at.split('T')[0]}: ${t.description || 'Unknown'} (${formatCurrency(t.amount)} ${t.type} ${t.category ? `for ${t.category}` : ''})`
      ).join('\n')

      // Category Summary (Pre-calculated for the AI)
      const expenses = transactions.filter(t => t.type === 'expense')
      const catTotals = expenses.reduce((acc, t) => {
        const c = t.category || 'Other'
        acc[c] = (acc[c] || 0) + Number(t.amount)
        return acc
      }, {} as Record<string, number>)
      const topCats = Object.entries(catTotals).sort((a,b) => b[1] - a[1]).slice(0, 3).map(([k,v]) => `${k}: ${formatCurrency(v)}`).join(', ')

      const context = `
      USER FINANCIAL SNAPSHOT:
      - Total Balance: ${formatCurrency(totalBalance)}
      - Total Debt (I Owe): ${formatCurrency(totalDebt)}
      - Total Credit (Owed to Me): ${formatCurrency(totalCredit)}
      - Top Expense Categories: ${topCats}
      - Active Goals: ${goals.map(g => g.name).join(', ')}
      
      RECENT TRANSACTIONS LOG:
      ${recentTxText}

      INSTRUCTIONS:
      You are Fintrac AI. Answer strictly based on the snapshot above.
      - If asked for "Categories", ONLY list Expense categories, do not list income sources.
      - Keep answers short (under 40 words).
      `
      setSystemContext(context)
    } catch (e) {
      console.error(e)
    }
  }

  // --- 3. ONLINE ENGINE (Streaming) ---
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
          stream: true
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
                setMessages(prev => prev.map(m => 
                  m.id === messageId ? { ...m, content: responseText } : m
                ))
              }
            } catch (e) { console.error(e) }
          }
        }
      }
    } catch (e) {
      // Fallback to offline if online fails
      const fallback = await processOffline(query)
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, content: fallback } : m
      ))
    }
  }

  // --- 4. OFFLINE ENGINE (Rule Based) ---
  const processOffline = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase()
    
    try {
      // Refetch data for accuracy
      const [trRes, acRes, dcRes, glRes] = await Promise.all([
        supabase.from('transactions').select('*').eq('user_id', user?.id),
        supabase.from('accounts').select('*').eq('user_id', user?.id),
        supabase.from('debts_credits').select('*').eq('user_id', user?.id).eq('is_settled', false),
        supabase.from('goals').select('*').eq('user_id', user?.id).eq('is_active', true)
      ])
      
      const transactions = trRes.data || []
      const accounts = acRes.data || []
      
      // Calculate
      const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const expense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      const balance = accounts.reduce((s, a) => s + (a.balance || 0), 0)

      if (lowerQuery.includes('balance') || lowerQuery.includes('bal')) {
        return `Current Balance: ${formatCurrency(balance)}\n(Inc: ${formatCurrency(income)}, Exp: ${formatCurrency(expense)})`
      }

      if (lowerQuery.includes('categor') || lowerQuery.includes('spending')) {
        // STRICTLY Filter Expenses Only
        const expenses = transactions.filter(t => t.type === 'expense')
        if (expenses.length === 0) return 'No expenses recorded yet.'
        
        const catMap = expenses.reduce((acc, t) => {
            const c = t.category || 'Uncategorized'
            acc[c] = (acc[c] || 0) + Number(t.amount)
            return acc
        }, {} as Record<string, number>)
        
        const top = Object.entries(catMap)
            .sort((a,b) => b[1] - a[1])
            .slice(0, 5)
            .map(([k,v]) => `${k}: ${formatCurrency(v)}`)
            .join('\n')
            
        return `Top Spending:\n${top}`
      }

      // Default fallback
      return "I can help with Balance, Categories, Recent transactions, or Debts."
      
    } catch (e) {
      return "Error checking your records."
    }
  }

  // --- 5. HANDLE SEND ---
  const handleSendMessage = async (msg?: string) => {
    const query = msg || inputValue
    if (!query.trim() || loading) return

    // Add User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setLoading(true)

    // Add Assistant Placeholder (Empty content initially)
    const assistantId = (Date.now() + 1).toString()
    setMessages(prev => [...prev, {
      id: assistantId,
      type: 'assistant',
      content: '', // Start empty to avoid ghost bubble
      timestamp: new Date(),
      quickReplies: ['Balance?', 'Categories?', 'Recent?']
    }])

    try {
      if (isOnline) {
        await processOnline(query, assistantId)
      } else {
        // Simulate thinking delay for offline
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

      <div className={`fixed bottom-6 right-6 w-80 h-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 transition-all duration-300 flex flex-col ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-t-xl">
          <div className="flex items-center space-x-3">
             {/* Logo */}
            {/* <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400">
               <MessageCircle className="w-5 h-5" />
            </div> */}


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
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Fintrac AI</h3>
              {/* STATUS INDICATOR (Red/Green Dot) */}
              <div className="flex items-center space-x-1.5">
                <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-red-500'}`}></span>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                    {isOnline ? 'Online (Model)' : 'Offline (Rules)'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white dark:bg-gray-800">
          {messages.map((m) => (
            // FIX: Only render the bubble if content exists!
            (m.content) ? (
                <div key={m.id} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-lg text-sm whitespace-pre-line shadow-sm ${m.type === 'user' ? 'bg-green-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'}`}>
                    {m.content}
                </div>
                </div>
            ) : null
          ))}
          
          {/* Loading Animation (Only shows when loading is TRUE) */}
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
          
          {/* Quick Replies (Only for last message if not loading) */}
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
              placeholder="Ask finances..."
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