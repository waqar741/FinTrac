import { useState, useRef, useEffect } from 'react'
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isToday,
} from 'date-fns'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { useDateFormat } from '../hooks/useDateFormat'

interface DatePickerProps {
    value: string // 'yyyy-MM-dd' format as used by the app state
    onChange: (date: string) => void
    placeholder?: string
    className?: string
    minDate?: string // 'yyyy-MM-dd' format
}

export default function DatePicker({ value, onChange, placeholder = 'Select date', className = '', minDate }: DatePickerProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { formatDate } = useDateFormat()
    const containerRef = useRef<HTMLDivElement>(null)

    // Parse initial value or default to today for calendar view
    const initialDate = value ? new Date(value) : new Date()
    const [currentMonth, setCurrentMonth] = useState(initialDate)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))
    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))

    const onDateClick = (day: Date) => {
        onChange(format(day, 'yyyy-MM-dd'))
        setIsOpen(false)
    }

    // Generate calendar days
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(monthStart)
    const startDate = startOfWeek(monthStart)
    const endDate = endOfWeek(monthEnd)

    const calendarDays = eachDayOfInterval({
        start: startDate,
        end: endDate
    })

    const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                className="relative cursor-pointer group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-hover:text-green-500 transition-colors" />
                <input
                    type="text"
                    readOnly
                    value={value ? formatDate(value) : ''}
                    placeholder={placeholder}
                    className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white cursor-pointer"
                />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-[60] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 min-w-[280px] animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); prevMonth() }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <h2 className="font-semibold text-gray-900 dark:text-white">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h2>
                        <button
                            onClick={(e) => { e.stopPropagation(); nextMonth() }}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>

                    {/* Week days */}
                    <div className="grid grid-cols-7 mb-2">
                        {weekDays.map(day => (
                            <div key={day} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day) => {
                            const dateStr = format(day, 'yyyy-MM-dd')
                            const isSelected = value === dateStr
                            const isCurrentMonth = isSameMonth(day, currentMonth)
                            const isTodayDate = isToday(day)
                            const isDisabled = minDate ? dateStr < minDate : false

                            return (
                                <button
                                    key={day.toString()}
                                    onClick={(e) => { e.stopPropagation(); !isDisabled && onDateClick(day) }}
                                    disabled={isDisabled}
                                    className={`
                    h-8 w-8 rounded-lg flex items-center justify-center text-sm transition-all
                    ${isDisabled ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-50' :
                                            !isCurrentMonth ? 'text-gray-300 dark:text-gray-600' : 'text-gray-700 dark:text-gray-300'}
                    ${isSelected
                                            ? 'bg-green-600 text-white font-medium hover:bg-green-700'
                                            : !isDisabled && 'hover:bg-gray-100 dark:hover:bg-gray-700'}
                    ${isTodayDate && !isSelected ? 'ring-1 ring-green-600 text-green-600 dark:text-green-400 font-medium' : ''}
                  `}
                                >
                                    {format(day, 'd')}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>
    )
}
