import { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

const HomePage = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const features = [
    {
      icon: (
        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
        </svg>
      ),
      title: "Smart Analytics",
      description: "Get insights into your spending with beautiful tables and detailed reports."
    },
    {
      icon: (
        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
      ),
      title: "Savings Goals",
      description: "Set and track savings goals with progress visualization."
    },
    {
      icon: (
        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"></path>
        </svg>
      ),
      title: "Budget Management",
      description: "Create flexible budgets and get alerts when approaching limits."
    },
    {
      icon: (
        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path>
        </svg>
      ),
      title: "Multiple Accounts",
      description: "Manage all your accounts in one place with unified tracking."
    },
    {
      icon: (
        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
        </svg>
      ),
      title: "Debt Tracking",
      description: "Track money you owe and money owed to you with reminders."
    },
    {
      icon: (
        <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
      ),
      title: "AI Assistant",
      description: "Get instant answers about your finances with intelligent chat."
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 antialiased">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-2">
            <svg
              className="w-8 h-8 text-green-600" // Changed color
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
            <span className="text-2xl font-bold text-gray-900 dark:text-white">FinTrac</span>
          </a>

          {/* Desktop Navigation */}
          <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors">Features</a>
            <a href="#about" className="text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors">About</a>
          </nav>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Theme Toggle */}
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
            
            <a href="/login" className="text-gray-600 dark:text-gray-300 font-medium hover:text-green-500 transition-colors">Sign In</a>
            <a href="/signup" className="bg-gradient-to-r from-green-500 to-green-400 text-white font-medium px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition-opacity">
              Start for Free
            </a>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden px-6 pb-4 space-y-4">
            <a href="#features" className="block text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors py-2">Features</a>
            <a href="#about" className="block text-gray-600 dark:text-gray-300 hover:text-green-500 transition-colors py-2">About</a>
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
              <a href="/signup" className="block text-center bg-gradient-to-r from-green-500 to-green-400 text-white font-medium px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 transition-opacity">
                Start for Free
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        
        {/* Hero Section */}
          <section className="bg-gray-50 dark:bg-gray-900">
              <div className="container mx-auto px-6 py-20 md:py-32 text-center">
                <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  Achieve Financial Clarity,{' '}
                  <span className="bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent">
                    Completely Free.
                  </span>
                </h1>
                <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300">
                  Track expenses, manage budgets, and achieve your financial goals with our intelligent personal finance platform.
                </p>
                <div className="mt-10 flex justify-center">
                  <a 
                    href="/signup" 
                    className="bg-gradient-to-r from-green-500 to-green-400 text-white font-bold text-lg px-8 py-4 rounded-lg shadow-xl hover:opacity-90 transition-all duration-300 transform hover:scale-105"
                  >
                    Start for Free &rarr;
                  </a>
                </div>
                <div className="mt-20">
                  {/* Light Theme Image */}
                  <img 
                    src="/image/image.png" 
                    alt="FinTrac Dashboard - Light Theme"
                    className="mx-auto rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full dark:hidden"
                  />
                  {/* Dark Theme Image */}
                  <img 
                    src="/image/dark.png" 
                    alt="FinTrac Dashboard - Dark Theme"
                    className="mx-auto rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-4xl w-full hidden dark:block"
                  />
                </div>
              </div>
          </section>

        {/* Features Section */}
        <section id="features" className="py-20 md:py-28">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Everything You Need to Succeed</h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                Powerful features to help you take control of your finances.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className="bg-white dark:bg-gray-800 p-8 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    {feature.icon}
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-gray-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-gray-600 dark:text-gray-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* About Us Section */}
        <section id="about" className="py-20 md:py-28">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
            <div className="max-w-4xl mx-auto mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              <p>
                We're breaking down barriers to financial independence by providing comprehensive, 
                intuitive financial tools that are free for everyone, forever.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="bg-gradient-to-r from-green-500 to-green-400 rounded-2xl shadow-xl text-center py-16 px-8">
              <h2 className="text-3xl md:text-4xl font-extrabold text-white">Ready to Take Control?</h2>
              <p className="mt-4 max-w-2xl mx-auto text-lg text-green-100">
                Join thousands building a better financial future with FinTrac.
              </p>
              <div className="mt-8">
                <a 
                  href="/signup" 
                  className="bg-white text-green-600 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
                >
                  Get Started for Free &rarr;
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-6 py-12">
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 max-w-2xl">
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Product</h3>
                <nav className="mt-4 space-y-3">
                  <a href="#features" className="block text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors duration-200">
                    Features
                  </a>
                  <a href="#" className="block text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors duration-200">
                    Security
                  </a>
                </nav>
              </div>
              
              <div className="text-center sm:text-left">
                <h3 className="font-semibold text-gray-900 dark:text-white text-lg">Legal</h3>
                <nav className="mt-4 space-y-3">
                  <a href="#" className="block text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors duration-200">
                    Privacy Policy
                  </a>
                  <a href="#" className="block text-gray-600 dark:text-gray-400 hover:text-green-500 transition-colors duration-200">
                    Terms of Service
                  </a>
                </nav>
              </div>
            </div>
          </div>
          
          {/* Developer Social Links */}
          <div className="mt-12 border-t border-gray-200 dark:border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">&copy; 2025 FinTrac. All rights reserved.</p>
              
              {/* Social Media Links */}
              <div className="flex space-x-4 mt-4 md:mt-0">
                <a 
                  href="https://github.com/waqar741/fintrac" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  aria-label="GitHub"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.026A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.647.64.7 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.943.359.309.678.92.678 1.852 0 1.335-.012 2.415-.012 2.743 0 .267.18.58.688.482C19.138 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                  </svg>
                </a>
                
                <a 
                  href="https://linkedin.com/in/shaikh-waquar" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Developer Credit */}
            <div className="mt-4 text-center md:text-left">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Developed with ❤️ by Your Waqar Shaikh
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;