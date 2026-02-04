import { useState } from 'react'
import { ChevronLeft, ChevronRight, Trash2, Loader, X } from 'lucide-react'
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek
} from 'date-fns'

interface Transaction {
    id: string
    user_id: string
    amount: number
    type: 'income' | 'expense' | 'transfer'
    description: string
    category: string
    is_recurring: boolean
    recurring_frequency: string | null
    created_at: string
    account_id: string
    goal_id: string | null
    from_account_id?: string
    to_account_id?: string
    accounts?: {
        id: string
        name: string
        color: string
        balance: number
    }
}

interface Goal {
    id: string
    name: string
    current_amount: number
    target_amount: number
}

interface CalendarViewProps {
    transactions: Transaction[]
    formatCurrency: (amount: number) => string
    formatDate: (date: string | Date) => string
    goals: Goal[]
    setShowModal: (show: boolean) => void
    initiateDeleteTransaction: (transaction: Transaction) => void
    isTransactionOld: (date: string) => boolean
    deletingTransactionId: string | null
}

export default function CalendarView({
    transactions,
    formatCurrency,
    goals,
    setShowModal,
    initiateDeleteTransaction,
    isTransactionOld,
    deletingTransactionId
}: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [showDayModal, setShowDayModal] = useState(false)

    // Get calendar days
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    // Group transactions by date
    const transactionsByDate = transactions.reduce((acc, t) => {
        const dateKey = format(new Date(t.created_at), 'yyyy-MM-dd')
        if (!acc[dateKey]) acc[dateKey] = []
        acc[dateKey].push(t)
        return acc
    }, {} as Record<string, Transaction[]>)

    // Calculate daily totals
    const getDayTotal = (date: Date) => {
        const dateKey = format(date, 'yyyy-MM-dd')
        const dayTransactions = transactionsByDate[dateKey] || []

        let income = 0
        let expense = 0

        dayTransactions.forEach(t => {
            if (t.type === 'income') income += t.amount
            else if (t.type === 'expense') expense += t.amount
        })

        return { income, expense, net: income - expense, count: dayTransactions.length }
    }

    // Get transactions for selected date
    const getSelectedDateTransactions = () => {
        if (!selectedDate) return []
        const dateKey = format(selectedDate, 'yyyy-MM-dd')
        return transactionsByDate[dateKey] || []
    }

    const handleDayClick = (date: Date) => {
        setSelectedDate(date)
        const dateKey = format(date, 'yyyy-MM-dd')
        if (transactionsByDate[dateKey]?.length > 0) {
            setShowDayModal(true)
        }
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div className="space-y-4">
            {/* Calendar Header */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {format(currentMonth, 'MMMM yyyy')}
                    </h2>
                    <button
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                </div>

                {/* Week Headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-2">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                    {calendarDays.map((day, index) => {
                        const { income, expense, count } = getDayTotal(day)
                        const isCurrentMonth = isSameMonth(day, currentMonth)
                        const isToday = isSameDay(day, new Date())
                        const hasTransactions = count > 0

                        return (
                            <button
                                key={index}
                                onClick={() => handleDayClick(day)}
                                className={`
                  relative p-1 sm:p-2 min-h-[60px] sm:min-h-[80px] rounded-lg text-left transition-colors
                  ${isCurrentMonth ? 'bg-gray-50 dark:bg-gray-700/50' : 'bg-gray-100/50 dark:bg-gray-800/50'}
                  ${isToday ? 'ring-2 ring-green-500 ring-inset' : ''}
                  ${hasTransactions ? 'hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer' : 'cursor-default'}
                `}
                            >
                                <span className={`
                  text-xs sm:text-sm font-medium
                  ${isCurrentMonth ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'}
                  ${isToday ? 'text-green-600 dark:text-green-400' : ''}
                `}>
                                    {format(day, 'd')}
                                </span>

                                {hasTransactions && isCurrentMonth && (
                                    <div className="mt-1 space-y-0.5">
                                        {income > 0 && (
                                            <div className="text-[10px] sm:text-xs text-green-600 dark:text-green-400 truncate">
                                                +{formatCurrency(income)}
                                            </div>
                                        )}
                                        {expense > 0 && (
                                            <div className="text-[10px] sm:text-xs text-red-600 dark:text-red-400 truncate">
                                                -{formatCurrency(expense)}
                                            </div>
                                        )}
                                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                                            {count} txn{count !== 1 ? 's' : ''}
                                        </div>
                                    </div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Day Detail Modal */}
            {showDayModal && selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-2xl">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                            </h3>
                            <button
                                onClick={() => setShowDayModal(false)}
                                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-3">
                            {getSelectedDateTransactions().map(transaction => {
                                const isOld = isTransactionOld(transaction.created_at)
                                const isDeleting = deletingTransactionId === transaction.id
                                const goal = transaction.goal_id ? goals.find(g => g.id === transaction.goal_id) : null

                                return (
                                    <div
                                        key={transaction.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <div
                                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: transaction.type === 'transfer' ? '#3B82F6' : (transaction.accounts?.color || '#9CA3AF') }}
                                                />
                                                <p className="font-medium text-gray-900 dark:text-white truncate">
                                                    {transaction.description}
                                                </p>
                                            </div>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {transaction.category}
                                                </span>
                                                {goal && (
                                                    <span className="text-xs px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded">
                                                        Goal: {goal.name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center space-x-2 ml-2">
                                            <span className={`font-semibold ${transaction.type === 'income' ? 'text-green-600' :
                                                transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
                                                }`}>
                                                {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
                                                {formatCurrency(transaction.amount)}
                                            </span>

                                            {!isOld && (
                                                <button
                                                    onClick={() => initiateDeleteTransaction(transaction)}
                                                    disabled={isDeleting}
                                                    className="p-1 text-gray-400 hover:text-red-600 rounded"
                                                >
                                                    {isDeleting ? (
                                                        <Loader className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}

                            {getSelectedDateTransactions().length === 0 && (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                                    No transactions on this day
                                </p>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => {
                                    setShowDayModal(false)
                                    setShowModal(true)
                                }}
                                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
                            >
                                Add Transaction
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
