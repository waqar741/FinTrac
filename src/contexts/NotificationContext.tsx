import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
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
            // 1. Fetch Debts
            const { data: debts } = await supabase
                .from('debts_credits')
                .select('*')
                .eq('user_id', user.id)
                .eq('type', 'debt')
                .eq('is_settled', false)
                .not('due_date', 'is', null)

            // 2. Fetch Goals
            const { data: goals } = await supabase
                .from('goals')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_active', true) // Assuming there is an is_active flag as seen in dashboard
                .not('deadline', 'is', null)

            const newNotifications: Notification[] = []
            const readIds = getReadIds()

            // Process Debts
            debts?.forEach(debt => {
                if (!debt.due_date) return
                const dueDate = parseISO(debt.due_date)
                const id = `debt-${debt.id}`

                if (readIds.includes(id)) return // Skip if already read/dismissed basically

                // Logic: Notify if Overdue, Today, or Tomorrow
                if (isPast(dueDate) && !isToday(dueDate)) {
                    newNotifications.push({
                        id,
                        title: 'Overdue Debt',
                        message: `You owe ${debt.person_name} ${debt.amount}. Due was ${format(dueDate, 'MMM d')}.`,
                        type: 'warning',
                        date: new Date().toISOString(),
                        isRead: false,
                        link: '/app/debts-credits'
                    })
                } else if (isToday(dueDate)) {
                    newNotifications.push({
                        id,
                        title: 'Debt Due Today',
                        message: `Payment to ${debt.person_name} (${debt.amount}) is due today.`,
                        type: 'warning',
                        date: new Date().toISOString(),
                        isRead: false,
                        link: '/app/debts-credits'
                    })
                } else if (isTomorrow(dueDate)) {
                    newNotifications.push({
                        id,
                        title: 'Upcoming Debt',
                        message: `Payment to ${debt.person_name} (${debt.amount}) is due tomorrow.`,
                        type: 'info',
                        date: new Date().toISOString(),
                        isRead: false,
                        link: '/app/debts-credits'
                    })
                }
            })

            // Process Goals (Deadlines)
            goals?.forEach((goal: any) => {
                if (!goal.deadline) return
                const deadline = parseISO(goal.deadline)
                const id = `goal-${goal.id}`

                if (readIds.includes(id)) return

                const diff = differenceInDays(deadline, new Date())

                if (diff <= 3 && diff >= 0) {
                    newNotifications.push({
                        id,
                        title: 'Goal Deadline Approaching',
                        message: `Goal "${goal.name}" deadline is in ${diff === 0 ? 'today' : diff + ' days'}.`,
                        type: 'info',
                        date: new Date().toISOString(),
                        isRead: false,
                        link: '/app/goals'
                    })
                }
            })

            setNotifications(_ => {
                // Merge with existing state logic if complicated, but here we rebuild from source + local storage "read" state
                // However, we want to keep them in the list but marked as read if they are in local storage?
                // Actually plan said "Dismissed notifications won't reappear". 
                // Better UX: Show them as "Read" until explicitly cleared? 
                // Simplest implementation consistent with plan: 
                //   - Generate list of ALL potential active notifications.
                //   - Check against localStorage for "read" status.
                //   - If in localStorage, either filter out OR mark isRead=true. 
                //   - Let's mark isRead=true so they stay in history until cleared/irrelevant.

                // Re-evaluating logic:
                // The "readIds" currently skips them. 
                // Let's change: generate all, then map isRead based on storage.

                const generatedNotifications: Notification[] = []

                debts?.forEach(debt => {
                    if (!debt.due_date) return
                    const dueDate = parseISO(debt.due_date)
                    const id = `debt-${debt.id}`

                    // Condition to show
                    if (isPast(dueDate) || isToday(dueDate) || isTomorrow(dueDate)) {
                        generatedNotifications.push({
                            id,
                            title: isPast(dueDate) && !isToday(dueDate) ? 'Overdue Debt' : 'Debt Due Soon',
                            message: `Pay ${debt.person_name} ${debt.amount}`,
                            type: isPast(dueDate) && !isToday(dueDate) ? 'warning' : 'info',
                            date: new Date().toISOString(),
                            isRead: readIds.includes(id),
                            link: '/app/debts-credits'
                        })
                    }
                })

                return generatedNotifications
            })

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
