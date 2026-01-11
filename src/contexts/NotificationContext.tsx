import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './AuthContext'
import { format, isToday, isTomorrow, isPast, parseISO, differenceInDays } from 'date-fns'

export interface Notification {
    id: string
    title: string
    message: string
    type: 'warning' | 'info' | 'success'
    date: string
    isRead: boolean
    link?: string
}

interface NotificationContextType {
    notifications: Notification[]
    unreadCount: number
    markAsRead: (id: string) => void
    markAllAsRead: () => void
    refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user, profile } = useAuth()
    const [notifications, setNotifications] = useState<Notification[]>([])

    const unreadCount = notifications.filter(n => !n.isRead).length

    useEffect(() => {
        if (user) {
            refreshNotifications()
            // Optional: Set up an interval to check periodically
            const interval = setInterval(refreshNotifications, 1000 * 60 * 60) // Check every hour
            return () => clearInterval(interval)
        }
    }, [user, profile])

    const refreshNotifications = async () => {
        if (!user) return

        // Check user preference
        if (profile?.notifications_enabled === false) {
            setNotifications([])
            return
        }

        try {
            // 1. Fetch Debts AND Credits
            const { data: debtsAndCredits } = await supabase
                .from('debts_credits')
                .select('*')
                .eq('user_id', user.id)
                .in('type', ['debt', 'credit'])
                .eq('is_settled', false)
                .not('due_date', 'is', null)

            // 2. Fetch Goals
            const { data: goals } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true) // Assuming there is an is_active flag as seen in dashboard
                .not('deadline', 'is', null)

            const generatedNotifications: Notification[] = []
            const readIds = getReadIds()

            // Process Debts & Credits
            debtsAndCredits?.forEach(item => {
                if (!item.due_date) return
                const dueDate = parseISO(item.due_date)
                const id = `${item.type}-${item.id}`

                if (isPast(dueDate) || isToday(dueDate) || isTomorrow(dueDate)) {
                    let title = ''
                    let message = ''
                    let type: 'warning' | 'info' | 'success' = 'info'

                    if (item.type === 'debt') {
                        if (isPast(dueDate) && !isToday(dueDate)) {
                            title = 'Overdue Debt'
                            message = `You owe ${item.person_name} ${item.amount}. Due was ${format(dueDate, 'MMM d')}.`
                            type = 'warning'
                        } else if (isToday(dueDate)) {
                            title = 'Debt Due Today'
                            message = `Payment to ${item.person_name} (${item.amount}) is due today.`
                            type = 'warning'
                        } else {
                            title = 'Upcoming Debt'
                            message = `Payment to ${item.person_name} (${item.amount}) is due tomorrow.`
                            type = 'info'
                        }
                    } else {
                        // Credit Logic
                        if (isPast(dueDate) && !isToday(dueDate)) {
                            title = 'Overdue Credit'
                            message = `${item.person_name} is late paying you ${item.amount}. Due was ${format(dueDate, 'MMM d')}.`
                            type = 'warning'
                        } else if (isToday(dueDate)) {
                            title = 'Payment Expected Today'
                            message = `${item.person_name} owes you ${item.amount} today.`
                            type = 'success'
                        } else {
                            title = 'Incoming Payment'
                            message = `${item.person_name} owes you ${item.amount} tomorrow.`
                            type = 'info'
                        }
                    }

                    generatedNotifications.push({
                        id,
                        title,
                        message,
                        type,
                        date: new Date().toISOString(),
                        isRead: readIds.includes(id),
                        link: '/app/debts-credits'
                    })
                }
            })

            // Process Goals
            goals?.forEach((goal: any) => {
                if (!goal.deadline) return
                const deadline = parseISO(goal.deadline)
                const id = `goal-${goal.id}`

                const diff = differenceInDays(deadline, new Date())

                if (diff <= 3 && diff >= 0) {
                    generatedNotifications.push({
                        id,
                        title: 'Goal Deadline Approaching',
                        message: `Goal "${goal.name}" deadline is in ${diff === 0 ? 'today' : diff + ' days'}.`,
                        type: 'info',
                        date: new Date().toISOString(),
                        isRead: readIds.includes(id),
                        link: '/app/goals'
                    })
                }
            })

            setNotifications(generatedNotifications)

        } catch (error) {
            console.error("Error checking notifications", error)
        }
    }

    const getReadIds = (): string[] => {
        try {
            const stored = localStorage.getItem('traxos_read_notifications')
            return stored ? JSON.parse(stored) : []
        } catch {
            return []
        }
    }

    const markAsRead = (id: string) => {
        const currentRead = getReadIds()
        if (!currentRead.includes(id)) {
            const newRead = [...currentRead, id]
            localStorage.setItem('traxos_read_notifications', JSON.stringify(newRead))

            setNotifications(prev => prev.map(n =>
                n.id === id ? { ...n, isRead: true } : n
            ))
        }
    }

    const markAllAsRead = () => {
        const allIds = notifications.map(n => n.id)
        const currentRead = getReadIds()
        const uniqueIds = Array.from(new Set([...currentRead, ...allIds]))
        localStorage.setItem('traxos_read_notifications', JSON.stringify(uniqueIds))

        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    }

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications }}>
            {children}
        </NotificationContext.Provider>
    )
}

export const useNotifications = () => {
    const context = useContext(NotificationContext)
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider')
    }
    return context
}
