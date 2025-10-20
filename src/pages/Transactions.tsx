import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useForm } from 'react-hook-form'
import { Plus, Trash2, X, Search, Download, FileText, Clock, Loader, Eye, ChevronDown, ChevronUp } from 'lucide-react'
import { format, subDays, isBefore } from 'date-fns'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

interface Transaction {
  id: string
  user_id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  category: string
  is_recurring: boolean
  recurring_frequency: string | null
  created_at: string
  account_id: string
  goal_id: string | null
  accounts: {
    id: string
    name: string
    color: string
    balance: number
  }
}

interface Account {
  id: string
  name: string
  color: string
  balance: number
}

interface Goal {
  id: string
  name: string
  current_amount: number
  target_amount: number
}

interface TransactionForm {
  account_id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  category: string
  is_recurring: boolean
  recurring_frequency: string
}

export default function Transactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(null)
  const [expandedTransactionId, setExpandedTransactionId] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(0)
  const pageSize = 15

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
    setError
  } = useForm<TransactionForm>()

  const isRecurring = watch('is_recurring', false)

  useEffect(() => {
    if (user) {
      fetchInitialData()
    }
  }, [user])

  // Reset pagination when filters change
  useEffect(() => {
    if (user) {
      fetchInitialData()
    }
  }, [searchTerm, filterType, filterAccount, dateFrom, dateTo])

  const fetchInitialData = async () => {
    try {
      setLoading(true)
      setPage(0)
      setHasMore(true)

      // Fetch accounts with balance
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('id, name, color, balance')
        .eq('user_id', user?.id)
        .eq('is_active', true)

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('id, name, current_amount, target_amount')
        .eq('user_id', user?.id)
        .eq('is_active', true)

      // Fetch first page of transactions
      let query = supabase
        .from('transactions')
        .select(`
          *,
          accounts (
            id,
            name,
            color,
            balance
          )
        `, { count: 'exact' })
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(pageSize)

      // Apply filters
      if (filterType !== 'all') {
        query = query.eq('type', filterType)
      }
      if (filterAccount !== 'all') {
        query = query.eq('account_id', filterAccount)
      }
      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59.999Z')
      }
      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      }

      const { data: transactionsData, error, count } = await query

      if (error) throw error

      if (accountsData) setAccounts(accountsData)
      if (goalsData) setGoals(goalsData)
      if (transactionsData) {
        setTransactions(transactionsData)
        setHasMore(transactionsData.length === pageSize)
        setPage(1)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadMoreTransactions = async () => {
    if (!hasMore || loadingMore) return

    try {
      setLoadingMore(true)

      let query = supabase
        .from('transactions')
        .select(`
          *,
          accounts (
            id,
            name,
            color,
            balance
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1)

      // Apply filters
      if (filterType !== 'all') {
        query = query.eq('type', filterType)
      }
      if (filterAccount !== 'all') {
        query = query.eq('account_id', filterAccount)
      }
      if (dateFrom) {
        query = query.gte('created_at', dateFrom)
      }
      if (dateTo) {
        query = query.lte('created_at', dateTo + 'T23:59:59.999Z')
      }
      if (searchTerm) {
        query = query.or(`description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
      }

      const { data: newTransactions, error } = await query

      if (error) throw error

      if (newTransactions && newTransactions.length > 0) {
        setTransactions(prev => [...prev, ...newTransactions])
        setHasMore(newTransactions.length === pageSize)
        setPage(prev => prev + 1)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error loading more transactions:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  // Check if transaction is older than 7 days
  const isTransactionOld = (transactionDate: string) => {
    const sevenDaysAgo = subDays(new Date(), 7)
    const transactionDateObj = new Date(transactionDate)
    return isBefore(transactionDateObj, sevenDaysAgo)
  }

  const onSubmit = async (data: TransactionForm) => {
    try {
      if (editingTransaction) {
        // Check if editing is allowed
        if (isTransactionOld(editingTransaction.created_at)) {
          setError('root', { message: 'Cannot edit transactions older than 7 days' })
          return
        }

        const { error } = await supabase
          .from('transactions')
          .update({
            account_id: data.account_id,
            amount: data.amount,
            type: data.type,
            description: data.description,
            category: data.category,
            is_recurring: data.is_recurring,
            recurring_frequency: data.is_recurring ? data.recurring_frequency : null
          })
          .eq('id', editingTransaction.id)

        if (error) throw error
      } else {
        // First, get the current account balance
        const { data: accountData, error: accountError } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', data.account_id)
          .single()

        if (accountError) throw accountError

        const currentBalance = Number(accountData?.balance) || 0
        const transactionAmount = Number(data.amount)
        
        // Calculate new balance
        const balanceChange = data.type === 'income' ? transactionAmount : -transactionAmount
        const newBalance = currentBalance + balanceChange

        // Insert the transaction
        const { error: transactionError } = await supabase
          .from('transactions')
          .insert({
            user_id: user?.id,
            account_id: data.account_id,
            amount: transactionAmount,
            type: data.type,
            description: data.description,
            category: data.category,
            is_recurring: data.is_recurring,
            recurring_frequency: data.is_recurring ? data.recurring_frequency : null
          })

        if (transactionError) throw transactionError

        // Update account balance
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', data.account_id)

        if (updateError) throw updateError
      }

      // Refresh the data
      await fetchInitialData()
      handleCloseModal()
    } catch (error: any) {
      setError('root', { message: error.message })
    }
  }

  const deleteTransaction = async (transaction: Transaction) => {
    if (deletingTransactionId === transaction.id) {
      return;
    }

    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      setDeletingTransactionId(transaction.id);

      if (isTransactionOld(transaction.created_at)) {
        alert('Cannot delete transactions older than 7 days')
        setDeletingTransactionId(null);
        return
      }

      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', transaction.account_id)
        .single()

      if (accountError) throw accountError

      const currentBalance = Number(accountData?.balance) || 0
      const transactionAmount = Number(transaction.amount)

      // Handle goal transaction reversal
      if (transaction.goal_id) {
        try {
          const { data: goalData, error: goalFetchError } = await supabase
            .from('goals')
            .select('current_amount, name')
            .eq('id', transaction.goal_id)
            .single();

          if (goalFetchError) throw goalFetchError;

          const newGoalAmount = Math.max(0, goalData.current_amount - transactionAmount);
          
          const { error: goalUpdateError } = await supabase
            .from('goals')
            .update({ current_amount: newGoalAmount })
            .eq('id', transaction.goal_id);

          if (goalUpdateError) throw goalUpdateError;
        } catch (goalError) {
          console.error('Error updating goal:', goalError);
        }
      }

      const balanceChange = transaction.type === 'income' ? -transactionAmount : transactionAmount
      const newBalance = currentBalance + balanceChange

      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transaction.id)

      if (deleteError) throw deleteError

      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', transaction.account_id)

      if (updateError) throw updateError

      await fetchInitialData()
      
      alert(transaction.goal_id 
        ? 'Transaction deleted successfully. Amount deducted from goal.' 
        : 'Transaction deleted successfully.'
      );
      
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      alert(`Error deleting transaction: ${error.message}`);
    } finally {
      setDeletingTransactionId(null);
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTransaction(null)
    reset()
  }

  const handleEditTransaction = (transaction: Transaction) => {
    if (isTransactionOld(transaction.created_at)) {
      alert('Cannot edit transactions older than 7 days')
      return
    }

    setEditingTransaction(transaction)
    reset({
      account_id: transaction.account_id,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      category: transaction.category,
      is_recurring: transaction.is_recurring,
      recurring_frequency: transaction.recurring_frequency || ''
    })
    setShowModal(true)
  }

  const toggleTransactionDetails = (transactionId: string) => {
    setExpandedTransactionId(expandedTransactionId === transactionId ? null : transactionId)
  }

  const exportToExcel = () => {
    // For export, we need to fetch all transactions
    const exportAllTransactions = async () => {
      try {
        let query = supabase
          .from('transactions')
          .select(`
            *,
            accounts (
              id,
              name,
              color,
              balance
            )
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })

        if (filterType !== 'all') {
          query = query.eq('type', filterType)
        }
        if (filterAccount !== 'all') {
          query = query.eq('account_id', filterAccount)
        }
        if (dateFrom) {
          query = query.gte('created_at', dateFrom)
        }
        if (dateTo) {
          query = query.lte('created_at', dateTo + 'T23:59:59.999Z')
        }
        if (searchTerm) {
          query = query.or(`description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        }

        const { data: allTransactions, error } = await query

        if (error) throw error

        const exportData = allTransactions?.map(t => ({
          Date: format(new Date(t.created_at), 'yyyy-MM-dd'),
          Description: t.description,
          Amount: t.amount,
          Type: t.type,
          Category: t.category,
          Account: t.accounts.name,
          Goal: t.goal_id ? 'Yes' : 'No'
        })) || []

        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
        XLSX.writeFile(wb, `FinTrac-Report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
      } catch (error) {
        console.error('Error exporting to Excel:', error)
        alert('Error exporting data. Please try again.')
      }
    }

    exportAllTransactions()
  }

  const exportToPDF = () => {
    // Similar to Excel export, we need to fetch all data for PDF
    const exportAllForPDF = async () => {
      try {
        let query = supabase
          .from('transactions')
          .select(`
            *,
            accounts (
              id,
              name,
              color,
              balance
            )
          `)
          .eq('user_id', user?.id)
          .order('created_at', { ascending: false })

        if (filterType !== 'all') {
          query = query.eq('type', filterType)
        }
        if (filterAccount !== 'all') {
          query = query.eq('account_id', filterAccount)
        }
        if (dateFrom) {
          query = query.gte('created_at', dateFrom)
        }
        if (dateTo) {
          query = query.lte('created_at', dateTo + 'T23:59:59.999Z')
        }
        if (searchTerm) {
          query = query.or(`description.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        }

        const { data: allTransactions, error } = await query

        if (error) throw error

        // Continue with PDF generation using allTransactions
        let totalIncome = 0;
        let totalExpense = 0;

        allTransactions?.forEach((t) => {
          if (t.type === 'income') {
            totalIncome += Number(t.amount);
          } else if (t.type === 'expense') {
            totalExpense += Number(t.amount);
          }
        });

        const balance = totalIncome - totalExpense;
        const pdf = new jsPDF();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        let currentPage = 1;
        const transactionPages = Math.ceil((allTransactions?.length || 0) / 15);
        const totalPages = (allTransactions?.length || 0) > 0 ? transactionPages + 1 : 1;

        const addHeader = (pageNum: number, totalPages: number) => {
          pdf.setFontSize(18);
          pdf.setFont('helvetica', 'bold');
          pdf.text('FinTrac Report', pageWidth / 2, 20, { align: 'center' });

          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'normal');
          pdf.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd')}`, 20, 35);
          pdf.text(`Total Transactions: ${allTransactions?.length || 0}`, 20, 42);
          pdf.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 30, 35);
        };

        const addTableHeader = (yPos: number) => {
          pdf.setFontSize(10);
          pdf.setFont('helvetica', 'bold');
          pdf.text('Date', 20, yPos);
          pdf.text('Description', 50, yPos);
          pdf.text('Amount (INR)', 140, yPos);
          pdf.text('Type', 170, yPos);
          
          yPos += 2;
          pdf.setLineWidth(0.2);
          pdf.line(20, yPos, pageWidth - 20, yPos);
          return yPos + 10;
        };

        let yPos = 60;

        // --- Transaction Pages ---
        if (allTransactions && allTransactions.length > 0) {
          addHeader(currentPage, totalPages);
          yPos = addTableHeader(yPos);

          allTransactions.forEach((t, index) => {
            if (yPos > pageHeight - 30 && index < allTransactions.length - 1) {
              pdf.addPage();
              currentPage++;
              yPos = 40;
              addHeader(currentPage, totalPages);
              yPos = addTableHeader(yPos);
            }

            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'normal');
            
            pdf.text(format(new Date(t.created_at), 'yyyy-MM-dd'), 20, yPos);
            
            let description = t.description || 'No description';
            if (description.length > 35) {
              description = description.substring(0, 32) + '...';
            }
            pdf.text(description, 50, yPos);
            
            pdf.text(t.amount.toFixed(2), 140, yPos);
            
            pdf.text(t.type.charAt(0).toUpperCase() + t.type.slice(1), 170, yPos);
            
            yPos += 7;
          });
        }

        // --- Summary Page ---
        if (allTransactions && allTransactions.length > 0) {
          pdf.addPage();
          currentPage++;
        }
        
        addHeader(currentPage, totalPages);
        yPos = 60;

        pdf.setFontSize(16);
        pdf.setFont('helvetica', 'bold');
        pdf.text('SUMMARY', pageWidth / 2, yPos, { align: 'center' });
        yPos += 20;

        pdf.setLineWidth(0.5);
        pdf.line(20, yPos, pageWidth - 20, yPos);
        yPos += 15;

        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Summary:', 30, yPos);
        yPos += 12;
        
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Total Income: INR ${totalIncome.toFixed(2)}`, 30, yPos);
        yPos += 10;
        pdf.text(`Total Expenses: INR ${totalExpense.toFixed(2)}`, 30, yPos);
        yPos += 10;
        pdf.text(`Balance: INR ${balance.toFixed(2)}`, 30, yPos);

        pdf.save(`FinTrac-Report-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
      } catch (error) {
        console.error('Error exporting to PDF:', error)
        alert('Error exporting data. Please try again.')
      }
    }

    exportAllForPDF()
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const categories = Array.from(new Set(transactions.map(t => t.category)))
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-4 space-y-3 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2"/>
          Add
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Mobile View */}
        <div className="block sm:hidden space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>

          {/* Date Inputs */}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="dd-mm-yyyy"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="dd-mm-yyyy"
            />
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center justify-center flex-1 px-3 py-2 text-sm bg-green-100 text-green-700 border border-green-200 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center justify-center flex-1 px-3 py-2 text-sm bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition-colors"
            >
              <FileText className="w-4 h-4 mr-1" />
              PDF
            </button>
          </div>
        </div>

        {/* Desktop View */}
        <div className="hidden sm:flex flex-wrap items-center gap-4">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[120px]"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[120px]"
          >
            <option value="all">All Accounts</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>{account.name}</option>
            ))}
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
            placeholder="dd-mm-yyyy"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white min-w-[140px]"
            placeholder="dd-mm-yyyy"
          />

          {/* Export Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 border border-green-200 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center px-3 py-2 text-sm bg-red-100 text-red-700 border border-red-200 rounded-lg hover:bg-red-200 transition-colors"
            >
              <FileText className="w-4 h-4 mr-1" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 text-green-600 hover:text-green-700 font-medium"
            >
              Add your first transaction
            </button>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {transactions.map((transaction) => {
                const isOld = isTransactionOld(transaction.created_at)
                const isGoalTransaction = !!transaction.goal_id
                const goal = isGoalTransaction ? goals.find(g => g.id === transaction.goal_id) : null
                const isDeleting = deletingTransactionId === transaction.id
                const isExpanded = expandedTransactionId === transaction.id
                
                return (
                  <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {/* Mobile Layout */}
                    <div className="block sm:hidden">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                            style={{ backgroundColor: transaction.accounts.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {transaction.description}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {transaction.accounts.name}
                              </span>
                              {isGoalTransaction && (
                                <span className="flex items-center px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs flex-shrink-0">
                                  {goal ? `Goal: ${goal.name}` : 'Goal'}
                                </span>
                              )}
                              {isOld && (
                                <span className="flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs flex-shrink-0">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Archived
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                          {/* View Details Button */}
                          <button
                            onClick={() => toggleTransactionDetails(transaction.id)}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                            title="View details"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => deleteTransaction(transaction)}
                            disabled={isOld || isDeleting}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                            title={isOld ? "Cannot delete transactions older than 7 days" : "Delete transaction"}
                          >
                            {isDeleting ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="capitalize">{transaction.category}</span>
                            {transaction.is_recurring && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                                {transaction.recurring_frequency}
                              </span>
                            )}
                          </div>
                          <span className="text-xs">{format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}</span>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-semibold text-sm ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{transaction.type}</p>
                        </div>
                      </div>

                      {/* Expanded Details for Mobile */}
                      {isExpanded && (
                        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-600 rounded-lg space-y-2">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Created:</span>
                              <p>{format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Account:</span>
                              <p>{transaction.accounts.name}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Category:</span>
                              <p>{transaction.category}</p>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Description:</span>
                              <p>{transaction.description}</p>
                            </div>
                            {transaction.is_recurring && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Recurring:</span>
                                <p>{transaction.recurring_frequency}</p>
                              </div>
                            )}
                            {isGoalTransaction && (
                              <div>
                                <span className="text-gray-500 dark:text-gray-400">Goal:</span>
                                <p>{goal ? goal.name : 'Goal Contribution'}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Desktop Layout */}
                    <div className="hidden sm:flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: transaction.accounts.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {transaction.description}
                            </h3>
                            {isGoalTransaction && (
                              <span className="flex items-center px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs flex-shrink-0">
                                {goal ? `Goal: ${goal.name}` : 'Goal Contribution'}
                              </span>
                            )}
                            {isOld && (
                              <span className="flex items-center px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs flex-shrink-0">
                                <Clock className="w-3 h-3 mr-1" />
                                Archived
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
                            <span className="truncate">{transaction.accounts.name}</span>
                            <span className="truncate">{transaction.category}</span>
                            <span>{format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}</span>
                            {transaction.is_recurring && (
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex-shrink-0">
                                {transaction.recurring_frequency}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`font-semibold ${
                            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{transaction.type}</p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {/* View Details Button for Desktop */}
                          <button
                            onClick={() => toggleTransactionDetails(transaction.id)}
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                            title="View details"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          
                          {/* Delete Button */}
                          <button
                            onClick={() => deleteTransaction(transaction)}
                            disabled={isOld || isDeleting}
                            className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                            title={isOld ? "Cannot delete transactions older than 7 days" : "Delete transaction"}
                          >
                            {isDeleting ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details for Desktop */}
                    {isExpanded && (
                      <div className="hidden sm:block mt-4 p-4 bg-gray-50 dark:bg-gray-600 rounded-lg">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Created Date:</span>
                            <p className="mt-1">{format(new Date(transaction.created_at), 'MMM d, yyyy')}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Account:</span>
                            <p className="mt-1">{transaction.accounts.name}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Category:</span>
                            <p className="mt-1">{transaction.category}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Description:</span>
                            <p className="mt-1">{transaction.description}</p>
                          </div>
                          {transaction.is_recurring && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Recurring:</span>
                              <p className="mt-1 capitalize">{transaction.recurring_frequency}</p>
                            </div>
                          )}
                          {isGoalTransaction && (
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Goal:</span>
                              <p className="mt-1">{goal ? goal.name : 'Goal Contribution'}</p>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Status:</span>
                            <p className="mt-1">{isOld ? 'Archived' : 'Active'}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => toggleTransactionDetails(transaction.id)}
                            className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                          >
                            Close Details
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 text-center">
                <button
                  onClick={loadMoreTransactions}
                  disabled={loadingMore}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <div className="flex items-center justify-center">
                      <Loader className="w-4 h-4 animate-spin mr-2" />
                      Loading...
                    </div>
                  ) : (
                    `Load More (${pageSize} more)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Account
                </label>
                <select
                  {...register('account_id', { required: 'Account is required' })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">Select an account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>{account.name}</option>
                  ))}
                </select>
                {errors.account_id && (
                  <p className="text-red-500 text-sm mt-1">{errors.account_id.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type
                </label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Amount (₹)
                </label>
                <input
                  {...register('amount', { 
                    required: 'Amount is required',
                    min: { value: 0.01, message: 'Amount must be greater than 0' }
                  })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="1000"
                />
                {errors.amount && (
                  <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  {...register('description', { required: 'Description is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., Grocery shopping"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  {...register('category')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="Food & Dining">Food & Dining</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Bills & Utilities">Bills & Utilities</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Education">Education</option>
                  <option value="Travel">Travel</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Rent">Rent</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Investment">Investment</option>
                  <option value="Salary">Salary</option>
                  <option value="Business">Business</option>
                  <option value="Gifts">Gifts</option>
                  <option value="Personal Care">Personal Care</option>
                  <option value="Home & Garden">Home & Garden</option>
                  <option value="Sports & Fitness">Sports & Fitness</option>
                  <option value="Technology">Technology</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  {...register('is_recurring')}
                  type="checkbox"
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                />
                <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                  Recurring Transaction
                </label>
              </div>

              {isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Frequency
                  </label>
                  <select
                    {...register('recurring_frequency')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              )}

              {errors.root && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-red-700 dark:text-red-400 text-sm">{errors.root.message}</p>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Saving...' : (editingTransaction ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}