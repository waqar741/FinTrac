// import { useState, useEffect } from 'react'
// import { useAuth } from '../contexts/AuthContext'
// import { supabase } from '../lib/supabase'
// import { useForm } from 'react-hook-form'
// import { Plus, CreditCard as Edit2, Trash2, X, Search, Download } from 'lucide-react'
// import { format } from 'date-fns'
// import * as XLSX from 'xlsx'
// import jsPDF from 'jspdf'

// interface Transaction {
//   id: string
//   amount: number
//   type: 'income' | 'expense'
//   description: string
//   category: string
//   is_recurring: boolean
//   recurring_frequency: string | null
//   created_at: string
//   accounts: {
//     id: string
//     name: string
//     color: string
//     balance: number
//   }
// }

// interface Account {
//   id: string
//   name: string
//   color: string
//   balance: number
// }

// interface TransactionForm {
//   account_id: string
//   amount: number
//   type: 'income' | 'expense'
//   description: string
//   category: string
//   is_recurring: boolean
//   recurring_frequency: string
// }

// export default function Transactions() {
//   const { user } = useAuth()
//   const [transactions, setTransactions] = useState<Transaction[]>([])
//   const [accounts, setAccounts] = useState<Account[]>([])
//   const [loading, setLoading] = useState(true)
//   const [showModal, setShowModal] = useState(false)
//   const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
//   const [searchTerm, setSearchTerm] = useState('')
//   const [filterType, setFilterType] = useState<string>('all')
//   const [filterAccount, setFilterAccount] = useState<string>('all')
//   const [dateFrom, setDateFrom] = useState('')
//   const [dateTo, setDateTo] = useState('')

//   const {
//     register,
//     handleSubmit,
//     reset,
//     watch,
//     formState: { errors, isSubmitting },
//     setError
//   } = useForm<TransactionForm>()

//   const isRecurring = watch('is_recurring', false)

//   useEffect(() => {
//     if (user) {
//       fetchData()
//     }
//   }, [user])

//   const fetchData = async () => {
//     try {
//       // Fetch accounts with balance
//       const { data: accountsData } = await supabase
//         .from('accounts')
//         .select('id, name, color, balance')
//         .eq('user_id', user?.id)
//         .eq('is_active', true)

//       // Fetch transactions
//       const { data: transactionsData } = await supabase
//         .from('transactions')
//         .select(`
//           *,
//           accounts (
//             id,
//             name,
//             color,
//             balance
//           )
//         `)
//         .eq('user_id', user?.id)
//         .order('created_at', { ascending: false })

//       if (accountsData) setAccounts(accountsData)
//       if (transactionsData) setTransactions(transactionsData)
//     } catch (error) {
//       console.error('Error fetching data:', error)
//     } finally {
//       setLoading(false)
//     }
//   }

//   const onSubmit = async (data: TransactionForm) => {
//     try {
//       if (editingTransaction) {
//         // Handle editing transaction - more complex logic needed for balance updates
//         // For now, just update the transaction without balance changes
//         // In a real app, you'd want to handle balance adjustments when editing
//         const { error } = await supabase
//           .from('transactions')
//           .update({
//             account_id: data.account_id,
//             amount: data.amount,
//             type: data.type,
//             description: data.description,
//             category: data.category,
//             is_recurring: data.is_recurring,
//             recurring_frequency: data.is_recurring ? data.recurring_frequency : null
//           })
//           .eq('id', editingTransaction.id)

//         if (error) throw error
//       } else {
//         // First, get the current account balance
//         const { data: accountData, error: accountError } = await supabase
//           .from('accounts')
//           .select('balance')
//           .eq('id', data.account_id)
//           .single()

//         if (accountError) throw accountError

//         const currentBalance = accountData?.balance || 0
        
//         // Calculate new balance
//         const balanceChange = data.type === 'income' ? data.amount : -data.amount
//         const newBalance = currentBalance + balanceChange

//         // Insert the transaction
//         const { error: transactionError } = await supabase
//           .from('transactions')
//           .insert({
//             user_id: user?.id,
//             account_id: data.account_id,
//             amount: data.amount,
//             type: data.type,
//             description: data.description,
//             category: data.category,
//             is_recurring: data.is_recurring,
//             recurring_frequency: data.is_recurring ? data.recurring_frequency : null
//           })

//         if (transactionError) throw transactionError

//         // Update account balance with the calculated new balance
//         const { error: updateError } = await supabase
//           .from('accounts')
//           .update({ balance: newBalance })
//           .eq('id', data.account_id)

//         if (updateError) throw updateError
//       }

//       await fetchData()
//       handleCloseModal()
//     } catch (error: any) {
//       setError('root', { message: error.message })
//     }
//   }

//   const deleteTransaction = async (id: string) => {
//     if (!confirm('Are you sure you want to delete this transaction?')) return

//     try {
//       // Get transaction details before deleting
//       const transaction = transactions.find(t => t.id === id)
//       if (!transaction) return

//       // Get current account balance
//       const { data: accountData, error: accountError } = await supabase
//         .from('accounts')
//         .select('balance')
//         .eq('id', transaction.accounts.id)
//         .single()

//       if (accountError) throw accountError

//       // Reverse the balance change
//       const balanceChange = transaction.type === 'income' ? -transaction.amount : transaction.amount
//       const newBalance = (accountData?.balance || 0) + balanceChange

//       // Delete the transaction
//       const { error: deleteError } = await supabase
//         .from('transactions')
//         .delete()
//         .eq('id', id)

//       if (deleteError) throw deleteError

//       // Update account balance
//       const { error: updateError } = await supabase
//         .from('accounts')
//         .update({ balance: newBalance })
//         .eq('id', transaction.accounts.id)

//       if (updateError) throw updateError

//       await fetchData()
//     } catch (error) {
//       console.error('Error deleting transaction:', error)
//     }
//   }

//   const handleCloseModal = () => {
//     setShowModal(false)
//     setEditingTransaction(null)
//     reset()
//   }

//   const handleEditTransaction = (transaction: Transaction) => {
//     setEditingTransaction(transaction)
//     reset({
//       account_id: transaction.accounts.id,
//       amount: transaction.amount,
//       type: transaction.type,
//       description: transaction.description,
//       category: transaction.category,
//       is_recurring: transaction.is_recurring,
//       recurring_frequency: transaction.recurring_frequency || ''
//     })
//     setShowModal(true)
//   }

//   const exportToExcel = () => {
//     const exportData = filteredTransactions.map(t => ({
//       Date: format(new Date(t.created_at), 'yyyy-MM-dd'),
//       Description: t.description,
//       Amount: t.amount,
//       Type: t.type,
//       Category: t.category,
//       Account: t.accounts.name
//     }))

//     const ws = XLSX.utils.json_to_sheet(exportData)
//     const wb = XLSX.utils.book_new()
//     XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
//     XLSX.writeFile(wb, `transactions-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
//   }

//   const exportToPDF = () => {
//     // Calculate totals
//     let totalIncome = 0;
//     let totalExpense = 0;
//     filteredTransactions.forEach((t) => {
//       if (t.type === 'income') {
//         totalIncome += Number(t.amount);
//       } else if (t.type === 'expense') {
//         totalExpense += Number(t.amount);
//       }
//     });
//     const balance = totalIncome - totalExpense;
  
//     // Initialize PDF
//     const pdf = new jsPDF();
//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();
  
//     // Function to add header
//     const addHeader = (currentPage: number) => {
//       pdf.setFontSize(18);
//       pdf.setFont('helvetica', 'bold');
//       pdf.text('Transaction Report', pageWidth / 2, 20, { align: 'center' });

//       pdf.setFontSize(10);
//       pdf.setFont('helvetica', 'normal');
//       pdf.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd')}`, 20, 30);
//       pdf.text(`Total Transactions: ${filteredTransactions.length}`, 20, 35);
//       pdf.text(`Page ${currentPage}`, pageWidth - 40, 30);
//     };
  
//     // Function to add table header
//     const addTableHeader = (yPos: number) => {
//       pdf.setFontSize(10);
//       pdf.setFont('helvetica', 'bold');
//       pdf.text('Date', 20, yPos);
//       pdf.text('Description', 50, yPos);
//       pdf.text('Amount (₹)', 140, yPos);
//       pdf.text('Type', 170, yPos);
//       pdf.setFont('helvetica', 'normal');

//       yPos += 5;
//       pdf.setLineWidth(0.2);
//       pdf.line(20, yPos, pageWidth - 20, yPos); // Horizontal line under header
//       return yPos + 5;
//     };
  
//     // Function to add footer
//     const addFooter = (currentPage: number, totalPages: number) => {
//       pdf.setFontSize(8);
//       pdf.setTextColor(150);
//       pdf.text(`Page ${currentPage} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
//       pdf.setTextColor(0);
//     };
  
//     // Initialize variables
//     let yPos = 50;
//     let currentPage = 1;
//     let totalPages = 1; // Placeholder, will calculate later
  
//     // Add initial header and table header
//     addHeader(currentPage);
//     yPos = addTableHeader(yPos);
  
//     // Add transaction rows
//     filteredTransactions.forEach((t) => {
//       if (yPos > pageHeight - 30) { // Check for page break
//         addFooter(currentPage, totalPages); // Temporary, will update later
//         pdf.addPage();
//         currentPage++;
//         yPos = 20;
//         addHeader(currentPage);
//         yPos = addTableHeader(yPos);
//       }

//       pdf.setFontSize(10);
//       pdf.text(format(new Date(t.created_at), 'yyyy-MM-dd'), 20, yPos);
//       pdf.text(t.description || 'No description', 50, yPos);
//       pdf.text(t.amount.toFixed(2), 140, yPos);
//       pdf.text(t.type.charAt(0).toUpperCase() + t.type.slice(1), 170, yPos);

//       yPos += 10;
//     });
  
//     // Add summary section
//     if (yPos > pageHeight - 60) { // Check if enough space for summary
//       addFooter(currentPage, totalPages); // Temporary
//       pdf.addPage();
//       currentPage++;
//       yPos = 20;
//       addHeader(currentPage);
//     } else {
//       yPos += 10;
//       pdf.line(20, yPos, pageWidth - 20, yPos); // Separator line
//       yPos += 10;
//     }
  
//     pdf.setFont('helvetica', 'bold');
//     pdf.text('Summary:', 20, yPos);
//     pdf.setFont('helvetica', 'normal');
//     yPos += 10;
//     pdf.text(`Total Income: ₹${totalIncome.toFixed(2)}`, 20, yPos);
//     yPos += 10;
//     pdf.text(`Total Expenses: ₹${totalExpense.toFixed(2)}`, 20, yPos);
//     yPos += 10;
//     pdf.text(`Balance: ₹${balance.toFixed(2)}`, 20, yPos);
  
//     // Calculate total pages and update footers on all pages
//     totalPages = currentPage;
//     for (let i = 1; i <= totalPages; i++) {
//       pdf.setPage(i);
//       addFooter(i, totalPages);
//     }
  
//     // Save the PDF
//     pdf.save(`transactions-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
//   }

//   const formatCurrency = (amount: number) => {
//     return new Intl.NumberFormat('en-IN', {
//       style: 'currency',
//       currency: 'INR',
//       minimumFractionDigits: 0,
//     }).format(amount)
//   }

//   // Filter transactions
//   const filteredTransactions = transactions.filter(transaction => {
//     const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    
//     const matchesType = filterType === 'all' || transaction.type === filterType
//     const matchesAccount = filterAccount === 'all' || transaction.accounts.id === filterAccount
    
//     const transactionDate = new Date(transaction.created_at)
//     const matchesDateFrom = !dateFrom || transactionDate >= new Date(dateFrom)
//     const matchesDateTo = !dateTo || transactionDate <= new Date(dateTo)
    
//     return matchesSearch && matchesType && matchesAccount && matchesDateFrom && matchesDateTo
//   })

//   const categories = Array.from(new Set(transactions.map(t => t.category)))
  
//   if (loading) {
//     return (
//       <div className="p-6">
//         <div className="animate-pulse space-y-6">
//           <div className="h-8 bg-gray-200 rounded w-48"></div>
//           <div className="space-y-4">
//             {[1, 2, 3, 4, 5].map((i) => (
//               <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
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
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
//           <p className="text-gray-600 dark:text-gray-300 mt-1">Track your income and expenses</p>
//         </div>
//         <button
//           onClick={() => setShowModal(true)}
//           className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mt-4 sm:mt-0"
//         >
//           <Plus className="w-4 h-4 mr-2" />
//           Add Transaction
//         </button>
//       </div>

//       {/* Filters */}
//       <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 dark:text-gray-500" />
//             <input
//               type="text"
//               placeholder="Search transactions..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//             />
//           </div>

//           <select
//             value={filterType}
//             onChange={(e) => setFilterType(e.target.value)}
//             className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//           >
//             <option value="all">All Types</option>
//             <option value="income">Income</option>
//             <option value="expense">Expense</option>
//           </select>

//           <select
//             value={filterAccount}
//             onChange={(e) => setFilterAccount(e.target.value)}
//             className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//           >
//             <option value="all">All Accounts</option>
//             {accounts.map(account => (
//               <option key={account.id} value={account.id}>{account.name}</option>
//             ))}
//           </select>

//           <input
//             type="date"
//             value={dateFrom}
//             onChange={(e) => setDateFrom(e.target.value)}
//             className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//             placeholder="From date"
//           />

//           <input
//             type="date"
//             value={dateTo}
//             onChange={(e) => setDateTo(e.target.value)}
//             className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//             placeholder="To date"
//           />
//         </div>

//         <div className="flex items-center space-x-2 mt-4">
//           <button
//             onClick={exportToExcel}
//             className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
//           >
//             <Download className="w-4 h-4 mr-1" />
//             Excel
//           </button>
//           <button
//             onClick={exportToPDF}
//             className="flex items-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
//           >
//             <Download className="w-4 h-4 mr-1" />
//             PDF
//           </button>
//         </div>
//       </div>

//       {/* Transactions List */}
//       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
//         {filteredTransactions.length === 0 ? (
//           <div className="text-center py-12">
//             <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
//             <button
//               onClick={() => setShowModal(true)}
//               className="mt-2 text-green-600 hover:text-green-700 font-medium"
//             >
//               Add your first transaction
//             </button>
//           </div>
//         ) : (
//           <div className="divide-y divide-gray-100 dark:divide-gray-700">
//             {filteredTransactions.map((transaction) => (
//               <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
//                 <div className="flex items-center justify-between">
//                   <div className="flex items-center space-x-4">
//                     <div
//                       className="w-3 h-3 rounded-full"
//                       style={{ backgroundColor: transaction.accounts.color }}
//                     />
//                     <div>
//                       <h3 className="font-medium text-gray-900 dark:text-white">{transaction.description}</h3>
//                       <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mt-1">
//                         <span>{transaction.accounts.name}</span>
//                         <span>{transaction.category}</span>
//                         <span>{format(new Date(transaction.created_at), 'MMM d, yyyy h:mm a')}</span>
//                         {transaction.is_recurring && (
//                           <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
//                             {transaction.recurring_frequency}
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
                  
//                   <div className="flex items-center space-x-4">
//                     <div className="text-right">
//                       <p className={`font-semibold ${
//                         transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
//                       }`}>
//                         {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
//                       </p>
//                       <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{transaction.type}</p>
//                     </div>
                    
//                     <div className="flex items-center space-x-2">
//                       <button
//                         onClick={() => handleEditTransaction(transaction)}
//                         className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
//                       >
//                         <Edit2 className="w-4 h-4" />
//                       </button>
//                       <button
//                         onClick={() => deleteTransaction(transaction.id)}
//                         className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600"
//                       >
//                         <Trash2 className="w-4 h-4" />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Modal */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-bold text-gray-900 dark:text-white">
//                 {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
//               </h2>
//               <button
//                 onClick={handleCloseModal}
//                 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Account
//                 </label>
//                 <select
//                   {...register('account_id', { required: 'Account is required' })}
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                 >
//                   <option value="">Select an account</option>
//                   {accounts.map(account => (
//                     <option key={account.id} value={account.id}>{account.name}</option>
//                   ))}
//                 </select>
//                 {errors.account_id && (
//                   <p className="text-red-500 text-sm mt-1">{errors.account_id.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Type
//                 </label>
//                 <select
//                   {...register('type')}
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                 >
//                   <option value="expense">Expense</option>
//                   <option value="income">Income</option>
//                 </select>
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Amount (₹)
//                 </label>
//                 <input
//                   {...register('amount', { 
//                     required: 'Amount is required',
//                     min: { value: 0.01, message: 'Amount must be greater than 0' }
//                   })}
//                   type="number"
//                   step="0.01"
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                   placeholder="1000"
//                 />
//                 {errors.amount && (
//                   <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Description
//                 </label>
//                 <input
//                   {...register('description', { required: 'Description is required' })}
//                   type="text"
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                   placeholder="e.g., Grocery shopping"
//                 />
//                 {errors.description && (
//                   <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
//                 )}
//               </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Category
//                 </label>
//                 <select
//                   {...register('category')}
//                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                 >
//                   <option value="Food & Dining">Food & Dining</option>
//                   <option value="Transportation">Transportation</option>
//                   <option value="Shopping">Shopping</option>
//                   <option value="Entertainment">Entertainment</option>
//                   <option value="Bills & Utilities">Bills & Utilities</option>
//                   <option value="Healthcare">Healthcare</option>
//                   <option value="Education">Education</option>
//                   <option value="Travel">Travel</option>
//                   <option value="Groceries">Groceries</option>
//                   <option value="Rent">Rent</option>
//                   <option value="Insurance">Insurance</option>
//                   <option value="Investment">Investment</option>
//                   <option value="Salary">Salary</option>
//                   <option value="Business">Business</option>
//                   <option value="Gifts">Gifts</option>
//                   <option value="Personal Care">Personal Care</option>
//                   <option value="Home & Garden">Home & Garden</option>
//                   <option value="Sports & Fitness">Sports & Fitness</option>
//                   <option value="Technology">Technology</option>
//                   <option value="Other">Other</option>
//                 </select>
//               </div>

//               <div className="flex items-center">
//                 <input
//                   {...register('is_recurring')}
//                   type="checkbox"
//                   className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
//                 />
//                 <label className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
//                   Recurring Transaction
//                 </label>
//               </div>

//               {isRecurring && (
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                     Frequency
//                   </label>
//                   <select
//                     {...register('recurring_frequency')}
//                     className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//                   >
//                     <option value="daily">Daily</option>
//                     <option value="weekly">Weekly</option>
//                     <option value="monthly">Monthly</option>
//                     <option value="yearly">Yearly</option>
//                   </select>
//                 </div>
//               )}

//               {errors.root && (
//                 <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
//                   <p className="text-red-700 dark:text-red-400 text-sm">{errors.root.message}</p>
//                 </div>
//               )}

//               <div className="flex space-x-3 pt-4">
//                 <button
//                   type="button"
//                   onClick={handleCloseModal}
//                   className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   disabled={isSubmitting}
//                   className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
//                 >
//                   {isSubmitting ? 'Saving...' : (editingTransaction ? 'Update' : 'Add')}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   )
// }


import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useForm } from 'react-hook-form'
import { Plus, CreditCard as Edit2, Trash2, X, Search, Download, Clock } from 'lucide-react'
import { format, subMonths, isBefore } from 'date-fns'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  description: string
  category: string
  is_recurring: boolean
  recurring_frequency: string | null
  created_at: string
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
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterAccount, setFilterAccount] = useState<string>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

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
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      // Fetch accounts with balance
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('id, name, color, balance')
        .eq('user_id', user?.id)
        .eq('is_active', true)

      // Fetch transactions
      const { data: transactionsData } = await supabase
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

      if (accountsData) setAccounts(accountsData)
      if (transactionsData) setTransactions(transactionsData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Check if transaction is older than 1 month
  const isTransactionOld = (transactionDate: string) => {
    const oneMonthAgo = subMonths(new Date(), 1)
    const transactionDateObj = new Date(transactionDate)
    return isBefore(transactionDateObj, oneMonthAgo)
  }

  const onSubmit = async (data: TransactionForm) => {
    try {
      if (editingTransaction) {
        // Check if editing is allowed
        if (isTransactionOld(editingTransaction.created_at)) {
          setError('root', { message: 'Cannot edit transactions older than 1 month' })
          return
        }

        // Handle editing transaction - more complex logic needed for balance updates
        // For now, just update the transaction without balance changes
        // In a real app, you'd want to handle balance adjustments when editing
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

        // 🔥 FIX: Convert ALL values to numbers to prevent string concatenation
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

        // Update account balance with the calculated new balance
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ balance: newBalance })
          .eq('id', data.account_id)

        if (updateError) throw updateError
      }

      await fetchData()
      handleCloseModal()
    } catch (error: any) {
      setError('root', { message: error.message })
    }
  }

  const deleteTransaction = async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      // Get transaction details before deleting
      const transaction = transactions.find(t => t.id === id)
      if (!transaction) return

      // Check if deletion is allowed
      if (isTransactionOld(transaction.created_at)) {
        alert('Cannot delete transactions older than 1 month')
        return
      }

      // Get current account balance
      const { data: accountData, error: accountError } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', transaction.accounts.id)
        .single()

      if (accountError) throw accountError

      // 🔥 FIX: Convert ALL values to numbers to prevent string concatenation
      const currentBalance = Number(accountData?.balance) || 0
      const transactionAmount = Number(transaction.amount)

      // Reverse the balance change
      const balanceChange = transaction.type === 'income' ? -transactionAmount : transactionAmount
      const newBalance = currentBalance + balanceChange

      // Delete the transaction
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      // Update account balance
      const { error: updateError } = await supabase
        .from('accounts')
        .update({ balance: newBalance })
        .eq('id', transaction.accounts.id)

      if (updateError) throw updateError

      await fetchData()
    } catch (error) {
      console.error('Error deleting transaction:', error)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTransaction(null)
    reset()
  }

  const handleEditTransaction = (transaction: Transaction) => {
    // Check if editing is allowed
    if (isTransactionOld(transaction.created_at)) {
      alert('Cannot edit transactions older than 1 month')
      return
    }

    setEditingTransaction(transaction)
    reset({
      account_id: transaction.accounts.id,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      category: transaction.category,
      is_recurring: transaction.is_recurring,
      recurring_frequency: transaction.recurring_frequency || ''
    })
    setShowModal(true)
  }

  const exportToExcel = () => {
    const exportData = filteredTransactions.map(t => ({
      Date: format(new Date(t.created_at), 'yyyy-MM-dd'),
      Description: t.description,
      Amount: t.amount,
      Type: t.type,
      Category: t.category,
      Account: t.accounts.name
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions')
    XLSX.writeFile(wb, `transactions-${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
  }

  const exportToPDF = () => {
    // Calculate totals
    let totalIncome = 0;
    let totalExpense = 0;
    filteredTransactions.forEach((t) => {
      if (t.type === 'income') {
        totalIncome += Number(t.amount);
      } else if (t.type === 'expense') {
        totalExpense += Number(t.amount);
      }
    });
    const balance = totalIncome - totalExpense;
  
    // Initialize PDF
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
  
    // Function to add header
    const addHeader = (currentPage: number) => {
      pdf.setFontSize(18);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Transaction Report', pageWidth / 2, 20, { align: 'center' });

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Generated on: ${format(new Date(), 'yyyy-MM-dd')}`, 20, 30);
      pdf.text(`Total Transactions: ${filteredTransactions.length}`, 20, 35);
      pdf.text(`Page ${currentPage}`, pageWidth - 40, 30);
    };
  
    // Function to add table header
    const addTableHeader = (yPos: number) => {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Date', 20, yPos);
      pdf.text('Description', 50, yPos);
      pdf.text('Amount (₹)', 140, yPos);
      pdf.text('Type', 170, yPos);
      pdf.setFont('helvetica', 'normal');

      yPos += 5;
      pdf.setLineWidth(0.2);
      pdf.line(20, yPos, pageWidth - 20, yPos); // Horizontal line under header
      return yPos + 5;
    };
  
    // Function to add footer
    const addFooter = (currentPage: number, totalPages: number) => {
      pdf.setFontSize(8);
      pdf.setTextColor(150);
      pdf.text(`Page ${currentPage} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      pdf.setTextColor(0);
    };
  
    // Initialize variables
    let yPos = 50;
    let currentPage = 1;
    let totalPages = 1; // Placeholder, will calculate later
  
    // Add initial header and table header
    addHeader(currentPage);
    yPos = addTableHeader(yPos);
  
    // Add transaction rows
    filteredTransactions.forEach((t) => {
      if (yPos > pageHeight - 30) { // Check for page break
        addFooter(currentPage, totalPages); // Temporary, will update later
        pdf.addPage();
        currentPage++;
        yPos = 20;
        addHeader(currentPage);
        yPos = addTableHeader(yPos);
      }

      pdf.setFontSize(10);
      pdf.text(format(new Date(t.created_at), 'yyyy-MM-dd'), 20, yPos);
      pdf.text(t.description || 'No description', 50, yPos);
      pdf.text(t.amount.toFixed(2), 140, yPos);
      pdf.text(t.type.charAt(0).toUpperCase() + t.type.slice(1), 170, yPos);

      yPos += 10;
    });
  
    // Add summary section
    if (yPos > pageHeight - 60) { // Check if enough space for summary
      addFooter(currentPage, totalPages); // Temporary
      pdf.addPage();
      currentPage++;
      yPos = 20;
      addHeader(currentPage);
    } else {
      yPos += 10;
      pdf.line(20, yPos, pageWidth - 20, yPos); // Separator line
      yPos += 10;
    }
  
    pdf.setFont('helvetica', 'bold');
    pdf.text('Summary:', 20, yPos);
    pdf.setFont('helvetica', 'normal');
    yPos += 10;
    pdf.text(`Total Income: ₹${totalIncome.toFixed(2)}`, 20, yPos);
    yPos += 10;
    pdf.text(`Total Expenses: ₹${totalExpense.toFixed(2)}`, 20, yPos);
    yPos += 10;
    pdf.text(`Balance: ₹${balance.toFixed(2)}`, 20, yPos);
  
    // Calculate total pages and update footers on all pages
    totalPages = currentPage;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      addFooter(i, totalPages);
    }
  
    // Save the PDF
    pdf.save(`Transactions-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || transaction.type === filterType
    const matchesAccount = filterAccount === 'all' || transaction.accounts.id === filterAccount
    
    const transactionDate = new Date(transaction.created_at)
    const matchesDateFrom = !dateFrom || transactionDate >= new Date(dateFrom)
    const matchesDateTo = !dateTo || transactionDate <= new Date(dateTo)
    
    return matchesSearch && matchesType && matchesAccount && matchesDateFrom && matchesDateTo
  })

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Track your income and expenses</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400 dark:text-gray-500" />
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
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="From date"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="To date"
          />
        </div>

        <div className="flex items-center space-x-2 mt-4">
          <button
            onClick={exportToExcel}
            className="flex items-center px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Download className="w-4 h-4 mr-1" />
            Excel
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <Download className="w-4 h-4 mr-1" />
            PDF
          </button>
        </div>
      </div>

      {/* Transactions List */}


      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        {filteredTransactions.length === 0 ? (
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
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
             {filteredTransactions.map((transaction) => {
              const isOld = isTransactionOld(transaction.created_at)
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
                         <button
                           onClick={() => handleEditTransaction(transaction)}
                          disabled={isOld}
                           className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                          title={isOld ? "Cannot edit transactions older than 1 month" : "Edit transaction"}
                         >
                           <Edit2 className="w-4 h-4" />
                         </button>
                         <button
                          onClick={() => deleteTransaction(transaction.id)}
                           disabled={isOld}
                           className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                           title={isOld ? "Cannot delete transactions older than 1 month" : "Delete transaction"}
                         >
                           <Trash2 className="w-4 h-4" />
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
                         <button
                           onClick={() => handleEditTransaction(transaction)}
                           disabled={isOld}
                           className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                           title={isOld ? "Cannot edit transactions older than 1 month" : "Edit transaction"}
                         >
                           <Edit2 className="w-4 h-4" />
                         </button>
                         <button
                           onClick={() => deleteTransaction(transaction.id)}
                           disabled={isOld}
                           className="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                           title={isOld ? "Cannot delete transactions older than 1 month" : "Delete transaction"}
                         >
                           <Trash2 className="w-4 h-4" />
                         </button>
                       </div>
                     </div>
                  </div>
                 </div>
              )
            })}
          </div>
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