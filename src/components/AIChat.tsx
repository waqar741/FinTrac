import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Cpu, Zap } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { startOfMonth, subMonths, startOfYear, format } from 'date-fns'

interface Message {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
  quickReplies?: string[]
}

const API_URL = import.meta.env.VITE_AI_API_URL

export default function AIChat() {
  const { user, profile } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [useModel, setUseModel] = useState(() => localStorage.getItem('use_ai_model') === 'true')
  const [showModelSwitcher, setShowModelSwitcher] = useState(() => localStorage.getItem('show_model_switcher') === 'true')

  const toggleModel = () => {
    setUseModel(prev => {
      const newVal = !prev
      localStorage.setItem('use_ai_model', String(newVal))
      return newVal
    })
  }

  useEffect(() => {
    const handleStorageChange = () => {
      const isSwitcherEnabled = localStorage.getItem('show_model_switcher') === 'true'
      setShowModelSwitcher(isSwitcherEnabled)

      // If switcher is turned OFF, force Rule Based mode
      if (!isSwitcherEnabled) {
        setUseModel(false)
        localStorage.setItem('use_ai_model', 'false')
      }
    }

    // Initial check on mount
    const isSwitcherEnabled = localStorage.getItem('show_model_switcher') === 'true'
    if (!isSwitcherEnabled && useModel) {
      setUseModel(false)
      localStorage.setItem('use_ai_model', 'false')
    }

    window.addEventListener('settings:modelSwitcher', handleStorageChange)
    window.addEventListener('storage', handleStorageChange)
    return () => {
      window.removeEventListener('settings:modelSwitcher', handleStorageChange)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [useModel])

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I am Traxos AI. How can I help?',
      timestamp: new Date(),
      quickReplies: [
        'What is my balance?',
        'Show my accounts',
        'Income vs expenses',
        'Who do I owe?',
        'Goals progress',
        'Recent transactions',
        'Who owes me?',
        'Budget status',
        'Spending categories'
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
    new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

  // --- 4. DATA MASKING SYSTEM ---

  // Storage for current session's masking map
  const [tokenMap, setTokenMap] = useState<Map<string, string>>(new Map())

  const maskData = (text: string | number, type: 'NAME' | 'AMOUNT' | 'ACCOUNT' | 'DATE', map: Map<string, string>): string => {
    const value = String(text).trim()
    if (!value) return value

    // Check if already masked to ensure consistency (e.g., "John" always -> "[[PERSON_1]]")
    // We need a reverse lookup or just checking the values? 
    // For simplicity, we regenerate or cache. Best to cache based on value.
    const existingEntry = Array.from(map.entries()).find(([, v]) => v === value)
    if (existingEntry) return existingEntry[0] // Return existing placeholder (Wait, map is Placeholder -> Real)

    // Correct Map Structure: Placeholder -> Real Value
    // But we need Real -> Placeholder for masking.

    // Let's use two maps or check values.
    // For a small session, iterating is fine.

    const existingPlaceholder = Array.from(map.entries()).find(([, real]) => real === value)?.[0]
    if (existingPlaceholder) return existingPlaceholder

    // Generate new placeholder
    const count = map.size + 1
    let prefix = 'VAL'
    if (type === 'NAME') prefix = 'PERSON'
    if (type === 'AMOUNT') prefix = 'AMT'
    if (type === 'ACCOUNT') prefix = 'ACCT'
    if (type === 'DATE') prefix = 'DATE'

    const placeholder = `[[${prefix}_${count}]]`
    map.set(placeholder, value)
    return placeholder
  }

  const unmaskContent = (content: string, map: Map<string, string>): string => {
    let unmasked = content
    // Sort keys by length desc to avoid partial replacement issues if any
    const placeholders = Array.from(map.keys()).sort((a, b) => b.length - a.length)

    placeholders.forEach(placeholder => {
      const realValue = map.get(placeholder)
      if (realValue) {
        // Global replace of the placeholder
        unmasked = unmasked.split(placeholder).join(realValue)
      }
    })
    return unmasked
  }

  // --- 2. DATA BUILDER (Returns context string and map for immediate use) ---
  const refreshFinancialContext = async (query: string = ''): Promise<{ context: string; map: Map<string, string> }> => {
    try {
      // Create new map for this request context
      const currentMap = new Map<string, string>()

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

      // Detect "Last Month Transaction" intent specifically for Online Mode context
      // (The instructions below will handle the response generation, but we ensure the data is there)


      const [trRes, acRes, dcRes, glRes] = await Promise.all([
        supabase.from('transactions')
          .select('*, accounts(name)')
          .eq('user_id', user?.id)
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: false }),
        supabase.from('accounts').select('*').eq('user_id', user?.id).eq('is_active', true),
        supabase.from('debts_credits').select('*').eq('user_id', user?.id).eq('is_settled', false),
        supabase.from('goals').select('*').eq('user_id', user?.id).eq('is_active', true)
      ])

      const transactions = trRes.data || []
      const accounts = acRes.data || []
      const debtsCredits = dcRes.data || []
      const goals = glRes.data || []

      // --- MASKING BEGINS HERE ---
      const mask = (val: string | number, type: 'NAME' | 'AMOUNT' | 'ACCOUNT' | 'DATE') => maskData(val, type, currentMap)

      // 1. Mask Profile Name
      const maskedUserName = mask(profile?.full_name || 'User', 'NAME')

      // 2. Calculations (Perform on REAL values, then mask the result)
      const totalBalanceReal = accounts.reduce((sum, a) => sum + (a.balance || 0), 0)
      const totalBalance = mask(formatCurrency(totalBalanceReal), 'AMOUNT') // Mask the formatted string

      // Mask Lists
      const accountList = accounts.map(a =>
        `${mask(a.name, 'ACCOUNT')} (${mask(a.bank_name || 'Bank', 'ACCOUNT')}): ${mask(formatCurrency(a.balance), 'AMOUNT')}`
      ).join(', ')

      // Calculations for period
      let totalIncome = 0
      let totalExpenses = 0
      let periodLabel = `From ${formatDate(startDate.toISOString())} to Now`

      if (lowerQ.includes('last month') || lowerQ.includes('previous month')) {
        const lastMonthStart = startOfMonth(subMonths(new Date(), 1))
        const thisMonthStart = startOfMonth(new Date())

        const lastMonthTxns = transactions.filter(t => {
          const d = new Date(t.created_at || t.transaction_date)
          return d >= lastMonthStart && d < thisMonthStart
        })

        totalIncome = lastMonthTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        totalExpenses = lastMonthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        periodLabel = `Last Month (${format(lastMonthStart, 'MMMM yyyy')})`
      } else {
        totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      }

      // Mask Totals
      const maskedIncome = mask(formatCurrency(totalIncome), 'AMOUNT')
      const maskedExpenses = mask(formatCurrency(totalExpenses), 'AMOUNT')
      const maskedNet = mask(formatCurrency(totalIncome - totalExpenses), 'AMOUNT')

      // Debts/Credits
      const debtList = debtsCredits.filter(d => d.type === 'debt').map(d =>
        `${mask(d.person_name || 'Unknown', 'NAME')}: ${mask(formatCurrency(d.amount), 'AMOUNT')}${d.due_date ? ` (Due: ${mask(formatDate(d.due_date), 'DATE')})` : ''}`
      ).join(', ')

      const creditList = debtsCredits.filter(d => d.type === 'credit').map(c =>
        `${mask(c.person_name || 'Unknown', 'NAME')}: ${mask(formatCurrency(c.amount), 'AMOUNT')}${c.due_date ? ` (Due: ${mask(formatDate(c.due_date), 'DATE')})` : ''}`
      ).join(', ')

      // Goals
      const goalList = goals.map(g => `${mask(g.name, 'NAME')} (${mask(formatCurrency(g.current_amount || 0), 'AMOUNT')}/${mask(formatCurrency(g.target_amount), 'AMOUNT')})`).join(', ')

      // Recent Transactions (Mask Description and Amount)
      const recentTxns = transactions.slice(0, 5).map(t =>
        `- ${mask(formatDate(t.created_at), 'DATE')}: ${mask(t.description, 'NAME')} (${mask(formatCurrency(t.amount), 'AMOUNT')})`
      ).join('\n')

      // Store map
      setTokenMap(currentMap)

      const context = `
      You are Traxos AI.
      The data below contains masked placeholders (like [[VAL_1]], [[AMT_2]]).
      CRITICAL: You MUST use these placeholders EXACTLY as they appear in your response. Do not change them or make up values.
      
      User Name: ${maskedUserName}
      
      **FINANCIAL DATA (${periodLabel}):**
      - Income: ${maskedIncome}
      - Expenses: ${maskedExpenses}
      - Net: ${maskedNet}
      
      - DEBTS (I Owe): [${debtList || 'None'}]
      - CREDITS (Owes Me): [${creditList || 'None'}]
      - GOALS: [${goalList || 'None'}]
      - Accounts (${accounts.length}): [${accountList}]
      - Total Balance: ${totalBalance}

      
      **RECENT TRANSACTIONS:**
      ${recentTxns}
      
      INSTRUCTIONS:
      1. If asked about "Last Month" (or "Previous Month"):
         - STRICTLY provide the Income, Expenses, and Net (Income - Expense) Summary.
         - Use the provided "Net" value. DO NOT try to calculate it yourself.
         - DO NOT mention "Total Balance" unless explicitly asked.
         - If asked for "Transactions": LIST them from RECENT TRANSACTIONS.
      2. If asked about "Recent request", "Recent?", "Transactions", "History", or "All":
         - Reply EXACTLY:
           "Recent transactions
           I can't access the whole history, but here are the last 5 transactions:"
         - Then list the items from RECENT TRANSACTIONS.
      3. If asked about "Balance": Reply "Your total balance is ${totalBalance}."
      4. If asked about "Debts" or "Dues": List the items from DEBTS exactly.
      5. If asked about "Credits": List the items from CREDITS exactly.
      6. If asked about "Goals": List items from GOALS.
      7. If asked about "Income", "Expense", or "Spending": State the Income and Expenses from the data.
      8. If asked about "Summary" or "Report": Provide the Income, Expenses, and Net.

      9. Keep responses short and plain text.
      10. Do NOT use markdown.
      11. Do NOT use the name '${maskedUserName}' in the response.
      `
      setSystemContext(context)
      return { context, map: currentMap }
    } catch (e) {
      console.error("Context build error", e)
      return { context: systemContext, map: tokenMap } // Start with old context if fail
    }
  }

  // --- 3. ONLINE ENGINE ---
  const processOnline = async (query: string, messageId: string, currentContext: string, currentMap: Map<string, string>) => {
    let responseText = ''
    try {
      // 1. Mask the Query as well to protect names in user input
      let maskedQuery = query
      currentMap.forEach((real, placeholder) => {
        // Simple replace - careful with partial matches, but good enough for now
        if (maskedQuery.includes(real)) {
          maskedQuery = maskedQuery.split(real).join(placeholder)
        }
      })

      const res = await fetch(`${API_URL}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: onlineModelId,
          messages: [
            { role: 'system', content: currentContext },
            { role: 'user', content: maskedQuery }
          ],
          stream: true,
          temperature: 0.1,
          max_tokens: 350
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
                // Unmask the stream on the fly so user sees real data immediately using the FRESH map
                const unmaskedText = unmaskContent(responseText, currentMap)
                setMessages(prev =>
                  prev.map(m => m.id === messageId ? { ...m, content: unmaskedText } : m)
                )
              }
            } catch (e) { console.error(e) }
          }
        }
      }
    } catch (e) {
      // ... existing fallback ...
      const fallback = await processOffline(query)
      let currentText = ''
      for (let i = 0; i < fallback.length; i++) {
        currentText += fallback[i]
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: currentText } : m))
        await new Promise(r => setTimeout(r, 10))
      }
    }
  }

  // --- 4. ENHANCED OFFLINE ENGINE (Default Mode) ---
  const processOffline = async (query: string): Promise<string> => {
    const lowerQuery = query.toLowerCase().trim()

    // --- Offline Matching Helper with Word Boundaries ---
    const matches = (keywords: string[]) => {
      return keywords.some(k => {
        // If keyword contains *, treat as wildcard (plain includes)
        if (k.includes('.*')) return new RegExp(k, 'i').test(lowerQuery)
        // Otherwise enforce word boundaries
        return new RegExp(`\\b${k}\\b`, 'i').test(lowerQuery)
      })
    }
    const exactMatch = (patterns: RegExp[]) => patterns.some(p => p.test(lowerQuery))

    // --- Greetings & Identity ---
    if (matches([
      'hi', 'hii', 'hiii', 'hiiii', 'hiiiii', 'hiiiiii',
      'hello', 'helloo', 'hellooo',
      'hey', 'heyy', 'heyyy', 'heyyyy',
      'yo', 'yoo', 'yooo',
      'greetings', 'morning', 'good morning', 'good afternoon', 'good evening',
      'hiya', 'heya', 'sup'
    ])) {
      return "Hello! I'm Traxos AI. How can I help you with your finances today?"
    }

    if (matches([
      'thanks', 'thank you', 'thank u', 'thx', 'ty',
      'appreciate', 'appreciated', 'grateful'
    ])) {
      return "You're welcome! Let me know if you need anything else."
    }

    if (matches([
      'who are you', 'what are you', 'your name', 'who is this',
      'what is your name', 'introduce yourself'
    ])) {
      return "I'm Traxos AI, your personal finance assistant. How can I help you?"
    }

    if (matches([
      'who am i', 'my name', 'what is my name', 'do you know me', 'my profile'
    ])) {
      return profile?.full_name
        ? `You are ${profile.full_name}.`
        : `You are logged in as ${user?.email}.`
    }

    try {
      const [trRes, acRes, dcRes, glRes] = await Promise.all([
        supabase.from('transactions').select('*, accounts(name)').eq('user_id', user?.id).order('created_at', { ascending: false }),
        supabase.from('accounts').select('*').eq('user_id', user?.id).eq('is_active', true),
        supabase.from('debts_credits').select('*').eq('user_id', user?.id).eq('is_settled', false),
        supabase.from('goals').select('*').eq('user_id', user?.id).eq('is_active', true)
      ])

      const transactions = trRes.data || []
      const accounts = acRes.data || []
      const debtsCredits = dcRes.data || []
      const goals = glRes.data || []

      // Calculate totals
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
      const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
      const totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0)
      const netWorth = totalBalance + debtsCredits.filter(d => d.type === 'credit').reduce((s, d) => s + Number(d.amount), 0)
        - debtsCredits.filter(d => d.type === 'debt').reduce((s, d) => s + Number(d.amount), 0)
      const totalDebt = debtsCredits.filter(d => d.type === 'debt').reduce((s, d) => s + Number(d.amount), 0)
      const totalCredit = debtsCredits.filter(d => d.type === 'credit').reduce((s, d) => s + Number(d.amount), 0)

      // --- Amount Search (Offline Range +/- 10) ---
      if (/^\d+(\.\d+)?$/.test(lowerQuery)) {
        const amount = parseFloat(lowerQuery)
        const min = amount - 10
        const max = amount + 10

        const matching = transactions.filter(t => {
          const tAmt = Number(t.amount)
          return tAmt >= min && tAmt <= max
        })

        if (matching.length === 0) return `No transactions found between ${formatCurrency(min)} and ${formatCurrency(max)}.`

        const list = matching.map(t =>
          `• ${formatDate(t.created_at || t.transaction_date)}: ${t.description} (${formatCurrency(t.amount)})`
        ).join('\n')

        return `Transactions matching amount ${amount} (+/- 10):\n\n${list}`
      }

      // --- Account Queries ---
      if (matches(['accounts', 'account', 'bank', 'banks', 'my accounts', 'list accounts'])) {
        if (accounts.length === 0) return "You haven't added any accounts yet. Add accounts to track your balance."

        const accountDetails = accounts.map(a =>
          `• ${a.name} (${a.bank_name || 'Bank'}): ${formatCurrency(a.balance)}`
        ).join('\n')

        return `You have ${accounts.length} account${accounts.length > 1 ? 's' : ''}:\n${accountDetails}\n\nTotal Balance: ${formatCurrency(totalBalance)}`
      }

      // --- Balance & Financial Overview ---
      if (matches(['balance', 'bal', 'money', 'cash', 'funds', 'how much', 'total money', 'net worth'])) {
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : '0'

        return `Financial Overview\n\n` +
          `Total Balance: ${formatCurrency(totalBalance)}\n` +
          `Net Worth: ${formatCurrency(netWorth)}\n\n` +
          `Income: ${formatCurrency(totalIncome)}\n` +
          `Expenses: ${formatCurrency(totalExpenses)}\n` +
          `Savings Rate: ${savingsRate}%`
      }

      // --- Income vs Expenses ---
      if (exactMatch([/income.*expense|expense.*income|inc.*exp|exp.*inc/i, /how.*spending/i, /saving.*rate/i])) {
        const net = totalIncome - totalExpenses
        const savingsRate = totalIncome > 0 ? ((net / totalIncome) * 100).toFixed(1) : '0'

        return `Income vs Expenses\n\n` +
          `Income: ${formatCurrency(totalIncome)}\n` +
          `Expenses: ${formatCurrency(totalExpenses)}\n` +
          `Net: ${formatCurrency(net)}\n` +
          `Savings Rate: ${savingsRate}%\n\n` +
          `${net >= 0 ? 'Good job! You are saving money.' : 'You are spending more than you earn.'}`
      }


      // --- Last Month Transactions (Offline Specific Priority) ---
      if (
        (lowerQuery.includes('last month') || lowerQuery.includes('previous month')) &&
        (matches(['transaction', 'history', 'activity', 'spending log']))
      ) {
        const now = new Date()
        const lastMonthDate = subMonths(now, 1)
        const lastMonth = lastMonthDate.getMonth()
        const lastYear = lastMonthDate.getFullYear()

        const lastMonthTxns = transactions.filter(t => {
          const d = new Date(t.created_at || t.transaction_date)
          return d.getMonth() === lastMonth && d.getFullYear() === lastYear
        })

        if (lastMonthTxns.length === 0) return 'No transactions found for last month.'

        const list = lastMonthTxns.slice(0, 8).map(t =>
          `• ${formatDate(t.created_at || t.transaction_date)}: ${t.description} (${formatCurrency(t.amount)}) ${t.type === 'income' ? '(+)' : '(-)'}`
        ).join('\n')

        return `Last Month's Transactions (${format(lastMonthDate, 'MMMM yyyy')})\n\n${list}\n\nTop 8 shown.`
      }



      // --- Recent Transactions ---
      if (matches(['recent', 'latest', 'history', 'transaction', 'activity'])) {
        const recent = transactions.slice(0, 8)
        if (recent.length === 0) return 'No recent transactions found.'


        const recentList = recent.map(t =>
          `• ${formatDate(t.created_at || t.transaction_date)}: ${t.description} (${formatCurrency(t.amount)}) ${t.type === 'income' ? '(+)' : '(-)'}`
        ).join('\n')

        return `Recent Transactions\n\n${recentList}\n\nView all transactions for more details.`
      }

      // --- Monthly Analysis ---
      if (matches(['month', 'monthly', 'this month', 'current month']) && !lowerQuery.includes('last month')) {
        const now = new Date()
        const monthTxns = transactions.filter(t => {
          const d = new Date(t.created_at || t.transaction_date)
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
        })

        const inc = monthTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        const exp = monthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        const net = inc - exp
        const daysLeft = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate()

        return `This Month's Summary\n\n` +
          `Income: ${formatCurrency(inc)}\n` +
          `Expenses: ${formatCurrency(exp)}\n` +
          `Net: ${formatCurrency(net)}\n\n` +
          `${inc > exp ? `Great! You're saving ${formatCurrency(net)} this month.` : `You're overspending by ${formatCurrency(-net)}.`}\n` +
          `${daysLeft} days remaining in the month.`
      }

      // --- Last Month Analysis ---
      if (matches(['last month', 'previous month'])) {
        const now = new Date()
        const lastMonthDate = subMonths(now, 1) // Go back 1 month
        const lastMonth = lastMonthDate.getMonth()
        const lastYear = lastMonthDate.getFullYear()

        const lastMonthTxns = transactions.filter(t => {
          const d = new Date(t.created_at || t.transaction_date)
          return d.getMonth() === lastMonth && d.getFullYear() === lastYear
        })

        const inc = lastMonthTxns.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount), 0)
        const exp = lastMonthTxns.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount), 0)
        const net = inc - exp

        return `Last Month's Summary (${format(lastMonthDate, 'MMMM yyyy')})\n\n` +
          `Income: ${formatCurrency(inc)}\n` +
          `Expenses: ${formatCurrency(exp)}\n` +
          `Net: ${formatCurrency(net)}\n\n` +
          `${inc > exp ? `You saved ${formatCurrency(net)} last month.` : `You overspent by ${formatCurrency(-net)} last month.`}`
      }


      // --- Due Debts / Dues (Show Dates) ---
      if (matches(['due debts', 'dues', 'due debt', 'debt due', 'upcoming debt', 'my dues'])) {
        const debts = debtsCredits.filter(d => d.type === 'debt')
        if (debts.length === 0) return 'No active dues! You are debt-free!'

        const list = debts.map(d =>
          `• You owe ${d.person_name || 'Someone'}: ${formatCurrency(d.amount)}${d.due_date ? ` (Due: ${formatDate(d.due_date)})` : ''}`
        ).join('\n')

        return `Your Dues (With Dates)\n\n${list}\n\nTotal Debt: ${formatCurrency(totalDebt)}`
      }

      // --- Due Credits (Show Dates) ---
      if (matches(['due credits', 'due credit', 'credit due', 'upcoming credit', 'owed to me due'])) {
        const credits = debtsCredits.filter(d => d.type === 'credit')
        if (credits.length === 0) return 'No one owes you money currently.'

        const list = credits.map(c =>
          `• ${c.person_name || 'Someone'} owes you: ${formatCurrency(c.amount)}${c.due_date ? ` (Due: ${formatDate(c.due_date)})` : ''}`
        ).join('\n')

        return `Credits Due to You (With Dates)\n\n${list}\n\nTotal Owed: ${formatCurrency(totalCredit)}`
      }

      // --- General Debts (No Dates) ---
      if (exactMatch([/owe|debt|payable|liability|borrow|loan/i]) && !lowerQuery.includes('owes me')) {
        const debts = debtsCredits.filter(d => d.type === 'debt')
        if (debts.length === 0) return 'No active debts! You are debt-free!'

        const list = debts.map(d =>
          `• You owe ${d.person_name || 'Someone'}: ${formatCurrency(d.amount)}`
        ).join('\n')

        return `Your Debts\n\n${list}\n\nTotal Debt: ${formatCurrency(totalDebt)}`
      }

      // --- General Credits (No Dates) ---
      if (exactMatch([/owes me|credit|receivable|owed to me|who owes|lend/i])) {
        const credits = debtsCredits.filter(d => d.type === 'credit')
        if (credits.length === 0) return 'No one owes you money currently.'

        const list = credits.map(c =>
          `• ${c.person_name || 'Someone'} owes you: ${formatCurrency(c.amount)}`
        ).join('\n')

        return `Money Owed to You\n\n${list}\n\nTotal Owed: ${formatCurrency(totalCredit)}`
      }

      // --- Due Date Specific Query ---
      // Matches: "due date for [Name]" or "when is [Name] due"
      if (lowerQuery.includes('due date')) {
        const debts = debtsCredits.filter(d => d.type === 'debt')
        const credits = debtsCredits.filter(d => d.type === 'credit')
        const all = [...debts, ...credits]

        // Find if any person's name matches part of the query
        const found = all.find(item => lowerQuery.includes(item.person_name.toLowerCase()))

        if (found) {
          const dateStr = found.due_date ? formatDate(found.due_date) : "No due date set"
          const typeStr = found.type === 'debt' ? `You owe ${found.person_name}` : `${found.person_name} owes you`
          return `${typeStr} ${formatCurrency(found.amount)}. Due Date: ${dateStr}.`
        } else {
          // Fallback: List all upcoming due dates
          const withDates = all.filter(i => i.due_date).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())

          if (withDates.length === 0) {
            return "You don't have any specific due dates set for your active debts or credits."
          }

          const list = withDates.slice(0, 5).map(i => {
            const typeStr = i.type === 'debt' ? `You owe ${i.person_name}` : `${i.person_name} owes you`
            return `• ${typeStr}: ${formatCurrency(i.amount)} (Due: ${formatDate(i.due_date!)})`
          }).join('\n')

          return `Upcoming Due Dates:\n\n${list}\n\nAsk 'due date for [Name]' for a specific person.`
        }
      }

      // --- Goals ---
      if (matches(['goal', 'goals', 'target', 'save', 'saving', 'progress', 'achievement'])) {
        if (goals.length === 0) return 'No active goals. Set up financial goals to track your progress!'

        const goalList = goals.map((g: any) => {
          const progress = g.current_amount || 0
          const target = g.target_amount
          const percent = target > 0 ? Math.min(100, (progress / target) * 100).toFixed(1) : '0'
          return `• ${g.name}: ${formatCurrency(progress)} / ${formatCurrency(target)} (${percent}%)`
        }).join('\n')

        return `Goals Progress\n\n${goalList}`
      }

      // --- Spending Categories ---
      if (matches(['category', 'categories', 'spending', 'expense', 'where.*money', 'spend.*most'])) {
        const expenses = transactions.filter(t => t.type === 'expense')
        if (expenses.length === 0) return 'No expense data available.'

        const catMap = expenses.reduce((acc: Record<string, number>, t: any) => {
          const c = t.category || 'Other'
          acc[c] = (acc[c] || 0) + Number(t.amount)
          return acc
        }, {} as Record<string, number>)

        const sorted = Object.entries(catMap).sort((a, b) => b[1] - a[1])
        const top = sorted.slice(0, 5)
          .map(([k, v], i) => `${i + 1}. ${k}: ${formatCurrency(v as number)} (${((Number(v) / totalExpenses) * 100).toFixed(1)}%)`)
          .join('\n')

        return `Top Spending Categories\n\n${top}`
      }

      // --- Budget Status ---
      if (matches(['budget', 'budget status', 'budget left', 'remaining'])) {
        // Assuming you have a budget table or using monthly expenses
        const now = new Date()
        const monthExpenses = transactions
          .filter(t => t.type === 'expense')
          .filter(t => {
            const d = new Date(t.created_at || t.transaction_date)
            return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
          })
          .reduce((s, t) => s + Number(t.amount), 0)

        // You can customize this based on your budget system
        return `Budget Status\n\n` +
          `This month's expenses: ${formatCurrency(monthExpenses)}\n` +
          `Average daily spend: ${formatCurrency(monthExpenses / now.getDate())}\n\n` +
          `Tip: Track your spending to stay within budget.`
      }

      // --- Financial Health ---
      if (matches(['health', 'status', 'how.*doing', 'financial health'])) {
        const debtRatio = totalIncome > 0 ? (totalDebt / totalIncome).toFixed(2) : '0'
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome * 100).toFixed(1) : '0'

        let healthStatus = ''
        if (parseFloat(savingsRate) > 20) healthStatus = 'Excellent'
        else if (parseFloat(savingsRate) > 10) healthStatus = 'Good'
        else if (parseFloat(savingsRate) > 0) healthStatus = 'Fair'
        else healthStatus = 'Needs Improvement'

        return `Financial Health Check\n\n` +
          `Status: ${healthStatus}\n` +
          `Savings Rate: ${savingsRate}%\n` +
          `Debt-to-Income Ratio: ${debtRatio}\n` +
          `Accounts: ${accounts.length}\n` +
          `Active Goals: ${goals.length}\n\n` +
          `${parseFloat(savingsRate) > 10 ? 'You are on the right track!' : 'Consider increasing your savings rate.'}`
      }

      // --- Help & Suggestions ---
      if (matches(['help', 'what can you do', 'features', 'capabilities'])) {
        return `What I Can Help With:\n\n` +
          `• Check balances and net worth\n` +
          `• Track income vs expenses\n` +
          `• Monitor debts and credits\n` +
          `• Review recent transactions\n` +
          `• Track goal progress\n` +
          `• Analyze spending categories\n` +
          `• Monthly budget status\n` +
          `• Financial health assessment\n\n` +
          `Try asking about any of these topics!`
      }

      // --- Fallback ---
      return "I can help you with:\n\n" +
        "• Balance and financial overview\n" +
        "• Account details and net worth\n" +
        "• Income vs expenses analysis\n" +
        "• Recent transactions\n" +
        "• Debts and credits tracking\n" +
        "• Goals progress\n" +
        "• Spending categories\n" +
        "• Monthly budget status\n\n" +
        "Try asking something like 'What's my balance?' or 'How am I spending my money?'"

    } catch (e) {
      console.error("Error processing request:", e)
      return "I'm having trouble accessing your financial data right now. Please try again or check your connection."
    }
  }

  // --- 5. HANDLE SEND ---
  // --- 5.1 CONSTANTS ---
  const QUESTION_SET_1 = [
    'Balance?', 'My Accounts?', 'Recent?',
    'Inc vs Exp?', 'Debt?', 'Credits?', 'last month?'
  ]

  const QUESTION_SET_2 = [
    'Goals?', 'Spending?', 'Budget?',
    'Health?', 'My Dues?', 'Credits Due?', 'Help?'
  ]

  // Track which set to show NEXT. 
  // Initial Display is "Original Set" (Static in state).
  // First AI Response should show SET 1.
  // Second AI Response should show SET 2.
  const [nextQuestionSet, setNextQuestionSet] = useState<number>(1)

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

    // Determine which set to use for this new response
    const replies = nextQuestionSet === 1 ? QUESTION_SET_1 : QUESTION_SET_2

    // Toggle for NEXT time
    setNextQuestionSet(prev => prev === 1 ? 2 : 1)

    setMessages(prev => [...prev, {
      id: assistantId,
      type: 'assistant',
      content: '', // Will stream in
      timestamp: new Date(),
      quickReplies: replies
    }])

    try {
      if (useModel && isBackendReachable) {
        // Refresh context BEFORE asking and GET THE MAP
        const { context: freshContext, map: freshMap } = await refreshFinancialContext(query)
        await processOnline(query, assistantId, freshContext, freshMap)
      } else {
        // Simulate "Processing" time briefly
        await new Promise(r => setTimeout(r, 400))

        let response = await processOffline(query)

        // --- Dues Reminder Feature (Once per session) ---
        // Check for dues/credits ONLY if this is the first interaction or hasn't been checked yet
        if (!sessionStorage.getItem('dues_reminded') && user) {
          const { data: debts } = await supabase.from('debts_credits').select('amount, type').eq('user_id', user.id).eq('is_settled', false)

          if (debts && debts.length > 0) {
            const totalDebt = debts.filter(d => d.type === 'debt').reduce((s, d) => s + Number(d.amount), 0)
            const totalCredit = debts.filter(d => d.type === 'credit').reduce((s, d) => s + Number(d.amount), 0)

            if (totalDebt > 0 || totalCredit > 0) {
              response += `\n\n(Reminder: You have ${formatCurrency(totalDebt)} in debts and ${formatCurrency(totalCredit)} in credits pending.)`
              sessionStorage.setItem('dues_reminded', 'true')
            }
          }
        }


        //const response = await processOffline(query)

        // Simulate Typing Effect for Offline Mode
        let currentText = ''
        const chunkSize = 2 // Slightly faster typing
        for (let i = 0; i < response.length; i += chunkSize) {
          currentText += response.slice(i, i + chunkSize)
          setMessages(prev => prev.map(m =>
            m.id === assistantId ? { ...m, content: currentText } : m
          ))
          await new Promise(r => setTimeout(r, 8)) // Faster typing speed
        }
      }
    } catch (e) {
      setMessages(prev => prev.map(m =>
        m.id === assistantId ? { ...m, content: "Sorry, I encountered an error. Please try again." } : m
      ))
    } finally {
      setLoading(false)
    }
  }

  const cleanContent = (content: string) => content.replace(/\*/g, '')

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
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Traxos AI</h3>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${useModel && isBackendReachable ? 'bg-green-500' : 'bg-blue-500'}`}></span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400">
                    {useModel && isBackendReachable ? 'AI Model' : 'Rule Based Model'}
                  </span>
                </div>
              </div>
            </div>
          </div>


          <div className="flex items-center space-x-2">
            {showModelSwitcher && (
              <button
                onClick={toggleModel}
                className={`p-1.5 rounded-lg transition-colors ${useModel ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}
                title={useModel ? "Switch to Rule Based Model" : "Switch to AI Model"}
              >
                {useModel ? <Cpu className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
              </button>
            )}
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

          {loading && !messages[messages.length - 1]?.content && (
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
              placeholder={useModel ? "Ask AI..." : "Ask about finances..."}
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