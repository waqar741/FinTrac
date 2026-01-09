import { AlertTriangle, X } from 'lucide-react'

interface ConfirmModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: React.ReactNode
    type?: 'danger' | 'info' | 'warning'
    confirmText?: string
    cancelText?: string
    isLoading?: boolean
    showCancel?: boolean
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'danger',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isLoading = false,
    showCancel = true
}: ConfirmModalProps) {
    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full shadow-2xl transform transition-all scale-100 opacity-100">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-full ${type === 'danger' ? 'bg-red-100 text-red-600' :
                                type === 'warning' ? 'bg-orange-100 text-orange-600' :
                                    'bg-blue-100 text-blue-600'
                                }`}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                        {message}
                    </p>

                    <div className="flex space-x-3 justify-end">
                        {showCancel && (
                            <button
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors"
                            >
                                {cancelText}
                            </button>
                        )}
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-4 py-2 text-white rounded-lg font-medium shadow-sm transition-colors flex items-center ${type === 'danger' ? 'bg-red-600 hover:bg-red-700 disabled:bg-red-400' :
                                type === 'warning' ? 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400' :
                                    'bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400'
                                }`}
                        >
                            {isLoading && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
