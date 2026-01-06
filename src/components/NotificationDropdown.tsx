import { Link } from 'react-router-dom'
import { useNotifications, Notification } from '../contexts/NotificationContext'
import { Bell, Check, Info, AlertTriangle, ExternalLink } from 'lucide-react'
import { parseISO, formatDistanceToNow } from 'date-fns'

interface NotificationDropdownProps {
    isOpen: boolean
    onClose: () => void
}

export default function NotificationDropdown({ isOpen, onClose }: NotificationDropdownProps) {
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
    // Click outside is now handled by the parent (Layout.tsx) to prevent conflict with the toggle button


    if (!isOpen) return null

    const getIcon = (type: Notification['type']) => {
        switch (type) {
            case 'warning':
                return <AlertTriangle className="w-5 h-5 text-red-500" />
            case 'success':
                return <Check className="w-5 h-5 text-green-500" />
            case 'info':
            default:
                return <Info className="w-5 h-5 text-blue-500" />
        }
    }

    // Filter to show active notifications (those NOT in read list if we wanted to hide them)
    // But context logic handled "isRead" property. 
    // Let's show all, but grey out read ones.
    // Sort: Unread first, then by date.
    const sortedNotifications = [...notifications].sort((a, b) => {
        if (a.isRead === b.isRead) {
            return new Date(b.date).getTime() - new Date(a.date).getTime()
        }
        return a.isRead ? 1 : -1
    })

    // Limit height and add scroll
    return (
        <div
            className="fixed inset-x-4 top-20 md:fixed md:inset-auto md:absolute md:right-0 md:top-full md:mt-2 w-auto md:w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
        >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllAsRead}
                        className="text-xs text-green-600 dark:text-green-400 hover:text-green-700 font-medium"
                    >
                        Mark all read
                    </button>
                )}
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
                {sortedNotifications.length === 0 ? (
                    <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {sortedNotifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative group ${notification.isRead ? 'opacity-60' : 'bg-white dark:bg-gray-800'}`}
                            >
                                {!notification.isRead && (
                                    <div className="absolute top-4 right-4 animate-pulse">
                                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    </div>
                                )}

                                <div className="flex gap-3">
                                    <div className="flex-shrink-0 mt-1">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {notification.title}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-words">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                                            {formatDistanceToNow(parseISO(notification.date), { addSuffix: true })}
                                        </p>

                                        <div className="flex items-center gap-3 mt-3">
                                            {notification.link && (
                                                <Link
                                                    to={notification.link}
                                                    onClick={() => {
                                                        markAsRead(notification.id)
                                                        onClose()
                                                    }}
                                                    className="text-xs font-medium text-green-600 dark:text-green-400 hover:underline flex items-center"
                                                >
                                                    View Details <ExternalLink className="w-3 h-3 ml-1" />
                                                </Link>
                                            )}
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => markAsRead(notification.id)}
                                                    className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                                >
                                                    Dismiss
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
