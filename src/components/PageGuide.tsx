import { useState, useRef, useEffect } from 'react'
import { HelpCircle, X, Lightbulb } from 'lucide-react'

interface PageGuideProps {
    title: string
    description: string
    tips?: string[]
}

export default function PageGuide({ title, description, tips }: PageGuideProps) {
    const [isOpen, setIsOpen] = useState(false)
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isOpen])

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 rounded-xl text-gray-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-all duration-200 group"
                title="Page Guide"
                aria-label="Show Page Guide"
            >
                <HelpCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </button>

            {/* Modal Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    {/* Modal Content */}
                    <div
                        ref={modalRef}
                        className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700"
                    >
                        {/* Header */}
                        <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700 flex justify-between items-start">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-white dark:bg-gray-700 rounded-xl shadow-sm">
                                    <HelpCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                        {title} Guide
                                    </h3>
                                    <p className="text-xs text-green-600 dark:text-green-400 font-medium uppercase tracking-wide">
                                        Quick Info
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-6">
                            {/* Description */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                    About this Page
                                </h4>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">
                                    {description}
                                </p>
                            </div>

                            {/* Tips */}
                            {tips && tips.length > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-2xl p-5 border border-amber-100 dark:border-amber-900/20">
                                    <div className="flex items-center space-x-2 mb-3">
                                        <Lightbulb className="w-4 h-4 text-amber-500" />
                                        <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">
                                            Pro Tips
                                        </h4>
                                    </div>
                                    <ul className="space-y-2">
                                        {tips.map((tip, index) => (
                                            <li key={index} className="flex items-start text-sm text-amber-800 dark:text-amber-200">
                                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1.5 mr-2 shrink-0"></span>
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Action */}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full py-2.5 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white font-medium rounded-xl transition-colors text-sm"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
