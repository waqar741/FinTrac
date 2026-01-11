

export default function Footer() {
    return (
        <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-6 py-12">
                <div className="flex justify-center">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 max-w-2xl">
                        <div className="text-center sm:text-left">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Product</h3>
                            <nav className="mt-4 space-y-3">
                                <a href="/#features" className="block text-gray-600 dark:text-gray-400 hover:text-green-500 transition-all duration-300 transform hover:translate-x-1">
                                    Features
                                </a>
                                <a href="/students" className="block text-gray-600 dark:text-gray-400 hover:text-green-500 transition-all duration-300 transform hover:translate-x-1">
                                    For Students
                                </a>
                                <a href="/freelancers" className="block text-gray-600 dark:text-gray-400 hover:text-green-500 transition-all duration-300 transform hover:translate-x-1">
                                    For Freelancers
                                </a>
                                <a href="#" className="block text-gray-600 dark:text-gray-400 hover:text-green-500 transition-all duration-300 transform hover:translate-x-1">
                                    Security
                                </a>
                            </nav>
                        </div>

                        <div className="text-center sm:text-left">
                            <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Legal</h3>
                            <nav className="mt-4 space-y-3">
                                <a href="#" className="block text-gray-600 dark:text-gray-400 hover:text-green-500 transition-all duration-300 transform hover:translate-x-1">
                                    Privacy Policy
                                </a>
                                <a href="#" className="block text-gray-600 dark:text-gray-400 hover:text-green-500 transition-all duration-300 transform hover:translate-x-1">
                                    Terms of Service
                                </a>
                            </nav>
                        </div>
                    </div>
                </div>

                {/* Developer Social Links */}
                <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">&copy; 2025 Traxos. All rights reserved.</p>

                        {/* Social Media Links with animations */}
                        <div className="flex space-x-4 mt-4 md:mt-0">
                            <a
                                href="https://linkedin.com/in/shaikh-waquar"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 transform hover:scale-110"
                                aria-label="LinkedIn"
                            >
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Developer Credit */}
                    <div className="mt-4 text-center md:text-left">
                        <p className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
                            Developed with ❤️ by Waqar Shaikh
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
