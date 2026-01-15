import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';

export default function Navbar() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { isDark, setTheme } = useTheme();
    const location = useLocation();

    const toggleTheme = () => {
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="container mx-auto px-6 py-4 flex justify-between items-center">
                {/* Logo with hover animation */}
                <a href="/" className="flex items-center space-x-2 group">
                    <svg
                        className="w-8 h-8 text-green-600 group-hover:scale-110 transition-transform duration-300"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M21 12a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3"
                        />
                    </svg>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors duration-300">
                        Traxos
                    </span>
                </a>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 items-center space-x-8">
                    <a href="/" className="text-gray-600 dark:text-gray-300 hover:text-green-500 transition-all duration-300 hover:scale-105">Home</a>
                    <a href={location.pathname === '/' ? '#features' : '/#features'} className="text-gray-600 dark:text-gray-300 hover:text-green-500 transition-all duration-300 hover:scale-105">Features</a>
                    <a href="/info" className="text-gray-600 dark:text-gray-300 hover:text-green-500 transition-all duration-300 hover:scale-105">How it Works</a>
                    <a href={location.pathname === '/' ? '#about' : '/#about'} className="text-gray-600 dark:text-gray-300 hover:text-green-500 transition-all duration-300 hover:scale-105">About</a>
                </nav>

                {/* Action Buttons */}
                <div className="hidden md:flex items-center space-x-4">
                    {/* Theme Toggle with animation */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-300 hover:scale-110"
                        aria-label="Toggle theme"
                    >
                        {isDark ? (
                            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        )}
                    </button>

                    <a href="/login" className="text-gray-600 dark:text-gray-300 font-medium hover:text-green-500 transition-all duration-300 hover:scale-105">Sign In</a>
                    <a href="/signup" className="bg-gradient-to-r from-green-500 to-green-400 text-white font-medium px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                        Start for Free
                    </a>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300"
                >
                    {isMobileMenuOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Menu with slide animation */}
            {isMobileMenuOpen && (
                <div className="md:hidden px-6 pb-4 space-y-4 animate-slideDown">
                    <a href="/" className="block text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors py-2 transform hover:translate-x-2 duration-300">Home</a>
                    <a href={location.pathname === '/' ? '#features' : '/#features'} className="block text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors py-2 transform hover:translate-x-2 duration-300">Features</a>
                    <a href="/info" className="block text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors py-2 transform hover:translate-x-2 duration-300">How it Works</a>
                    <a href={location.pathname === '/' ? '#about' : '/#about'} className="block text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors py-2 transform hover:translate-x-2 duration-300">About</a>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                        {/* Mobile Theme Toggle */}
                        <div className="flex items-center justify-center space-x-2 py-2">
                            <span className="text-sm text-gray-600 dark:text-gray-300">Theme:</span>
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                aria-label="Toggle theme"
                            >
                                {isDark ? (
                                    <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                        <a href="/login" className="block text-center text-gray-600 dark:text-gray-300 font-medium hover:text-green-500 transition-colors">Sign In</a>
                        <a href="/signup" className="block text-center bg-gradient-to-r from-green-500 to-green-400 text-white font-medium px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition-all duration-300 transform hover:scale-105">
                            Start for Free
                        </a>
                    </div>
                </div>
            )}
        </header>
    );
}
