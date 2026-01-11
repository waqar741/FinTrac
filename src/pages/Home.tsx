import { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import SEO from '../components/SEO';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
    const { isDark } = useTheme();
    const [isMasked, setIsMasked] = useState(false);
    const [activeImage, setActiveImage] = useState(0);
    const [aiMode, setAiMode] = useState<'rule' | 'online'>('rule');

    const dashboardImages = [
        { light: '/image/image.png', dark: '/image/dark.png', title: 'Traxos financial dashboard showing total balance and recent activity' },
        { light: '/image/transaction-light.png', dark: '/image/transaction-dark.png', title: 'Detailed transaction history view with categories and filtering' },
        { light: '/image/analytic-light.png', dark: '/image/analytic-dark.png', title: 'Traxos financial analytics dashboard displaying bar chart of monthly expenses and savings rate' },
        { light: '/image/debt-light.png', dark: '/image/debt-dark.png', title: 'Debt and credit management interface for tracking personal loans' }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setIsMasked(prev => !prev);
        }, 3000);

        const imageTimer = setInterval(() => {
            setActiveImage(prev => (prev + 1) % dashboardImages.length);
        }, 5000);

        return () => {
            clearInterval(timer);
            clearInterval(imageTimer);
        };
    }, []);

    return (
        <div className="bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 antialiased">
            <SEO title="Traxos: Free Personal Finance & Expense Manager" description="Traxos - Free Personal Finance Tracker" />
            <Navbar />

            <main>
                {/* Hero Section */}
                <section className="bg-gray-50 dark:bg-gray-900">
                    <div className="container mx-auto px-6 py-12 md:py-32 text-center">
                        <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white leading-tight">
                            Achieve Financial Clarity,{' '}
                            <span className="bg-gradient-to-r from-green-500 to-green-400 bg-clip-text text-transparent">
                                Completely Free.
                            </span>
                        </h1>
                        <p className="mt-6 max-w-3xl mx-auto text-lg md:text-xl text-gray-600 dark:text-gray-300 animate-fadeInUp delay-200">
                            Track expenses, manage budgets, and achieve your financial goals with our intelligent personal finance platform.
                        </p>
                        <div className="mt-10 flex justify-center animate-fadeInUp delay-400">
                            <a
                                href="/login"
                                className="bg-gradient-to-r from-green-500 to-green-400 text-white font-bold text-lg px-8 py-4 rounded-lg shadow-xl hover:opacity-90 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl animate-pulse-slow"
                            >
                                Start for Free &rarr;
                            </a>
                        </div>
                        <div className="mt-20 animate-fadeInUp delay-600">
                            <div className="group relative max-w-4xl mx-auto hover:scale-[1.02] transition-transform duration-500">
                                {/* Glow Effect */}
                                <div className="absolute -inset-1 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl opacity-20 group-hover:opacity-40 blur-lg transition duration-500"></div>

                                <div className="relative overflow-hidden rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                                    {dashboardImages.map((img, index) => (
                                        <div
                                            key={index}
                                            className={`transition-opacity duration-1000 ease-in-out ${index === activeImage ? 'opacity-100 relative' : 'opacity-0 absolute inset-0'}`}
                                            style={{
                                                display: index === activeImage ? 'block' : 'none'
                                            }}
                                        >
                                            <img
                                                src={isDark ? img.dark : img.light}
                                                alt={img.title}
                                                className="w-full h-auto rounded-xl"
                                            />
                                        </div>
                                    ))}
                                </div>
                                {/* Dots */}
                                <div className="flex justify-center mt-6 space-x-3">
                                    {dashboardImages.map((_, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setActiveImage(index)}
                                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === activeImage ? 'bg-green-500 w-6' : 'bg-gray-300 dark:bg-gray-600'}`}
                                            aria-label={`View image ${index + 1}`}
                                        />
                                    ))}
                                </div>
                                <div className="mt-4 text-gray-500 dark:text-gray-400 font-medium text-center">
                                    {dashboardImages[activeImage].title}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section id="features" className="py-20 md:py-28">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-16 animate-fadeInUp">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Everything You Need to Succeed</h2>
                            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                                Powerful features to help you take control of your finances.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 auto-rows-[1fr]">
                            {/* Feature 1: Smart Transactions (Wide) */}
                            <div className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border border-gray-100 dark:border-gray-700 hover:border-green-500/30 dark:hover:border-green-500/30 transition-all duration-300 group overflow-hidden relative h-full shadow-sm hover:shadow-xl">
                                <div className="absolute top-0 right-0 -mr-8 -mt-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                </div>
                                <div className="mb-6 w-fit p-3 bg-green-100 dark:bg-green-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Smart Transactions</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    Log income and expenses with ease. Set up <span className="text-gray-900 dark:text-white font-medium">recurring transactions</span> for subscriptions and salary.
                                    Need reports? <span className="text-green-600 dark:text-green-400 font-medium">Export to PDF & Excel</span> instantly for your records.
                                </p>
                            </div>

                            {/* Feature 2: Unified Accounts (Tall/Standard) */}
                            <div className="md:col-span-1 p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group h-full hover:-translate-y-1">
                                <div className="mb-6 w-fit p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Unified Accounts</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                    Bank, Cash, Savings - manage them all in one unified dashboard with real-time balance tracking.
                                </p>
                            </div>

                            {/* Feature 3: Debts & Settlements */}
                            <div className="md:col-span-1 p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group h-full hover:-translate-y-1">
                                <div className="mb-6 w-fit p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.124-1.283-.356-1.857M7 20v-2c0-.653.124-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Debts & Settlements</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                    Track "Who Owes You" vs "You Owe". Settle debts easily with <span className="font-semibold text-gray-900 dark:text-white">linked transaction records</span>.
                                </p>
                            </div>

                            {/* Feature 4: Savings Goals */}
                            <div className="md:col-span-2 p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group h-full hover:-translate-y-1">
                                <div className="mb-6 w-fit p-3 bg-purple-100 dark:bg-purple-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Savings Goals</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                    Visualize your dreams. Contribute directly from your accounts and watch your progress bar grow.
                                </p>
                            </div>

                            {/* Feature 5: Budget Checks */}
                            <div className="md:col-span-2 p-8 rounded-3xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group h-full hover:-translate-y-1">
                                <div className="mb-6 w-fit p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                                    <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z"></path></svg>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Budget Health</h3>
                                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                    Instant analysis of your savings rate and debt-to-income ratios to keep you financially healthy.
                                </p>
                            </div>

                        </div>
                    </div>
                </section>

                {/* Dedicated AI Section */}
                <section id="ai" className="py-20 bg-gray-50 dark:bg-gray-800/30">
                    <div className="container mx-auto px-6">
                        <div className="text-center mb-12 animate-fadeInUp">
                            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">Dual AI Architecture</h2>
                            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400 mb-8">
                                Choose between rule-based privacy or advanced online intelligence.
                            </p>

                            {/* Toggle Switch */}
                            <div className="inline-flex bg-gray-200 dark:bg-gray-700 p-1 rounded-full relative">
                                <div
                                    className={`absolute w-1/2 h-full top-0 left-0 bg-white dark:bg-gray-600 rounded-full shadow-sm transition-transform duration-300 ease-in-out ${aiMode === 'online' ? 'translate-x-full' : 'translate-x-0'}`}
                                ></div>
                                <button
                                    onClick={() => setAiMode('rule')}
                                    className={`relative z-10 px-6 py-2 rounded-full font-medium text-sm transition-colors duration-300 ${aiMode === 'rule' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}
                                >
                                    Rule-Based (Secure)
                                </button>
                                <button
                                    onClick={() => setAiMode('online')}
                                    className={`relative z-10 px-6 py-2 rounded-full font-medium text-sm transition-colors duration-300 ${aiMode === 'online' ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}
                                >
                                    Online (Masked)
                                </button>
                            </div>
                        </div>

                        <div className="max-w-4xl mx-auto space-y-16">
                            {/* AI Content Block (Single Column) */}
                            <div className="animate-fadeInUp relative">
                                {/* Content Swapper */}
                                {aiMode === 'rule' ? (
                                    <div className="flex flex-col md:flex-row items-center gap-12 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-green-100 dark:border-green-900/30 animate-scaleIn">
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                                                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Rule-Based AI</h3>
                                            </div>
                                            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                                                Our default engine runs <span className="font-semibold text-green-600 dark:text-green-400">securely in your browser</span>.
                                                It uses strict logic rules to categorize transactions and answer queries instantly, ensuring your financial data <span className="font-semibold text-gray-900 dark:text-white">never leaves your device</span> for AI processing.
                                            </p>
                                            <ul className="space-y-3">
                                                {['Zero latency responses', 'No external AI data sharing', 'Total privacy guaranteed'].map((item, i) => (
                                                    <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                                        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="flex-1 flex justify-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-green-500/20 blur-3xl rounded-full"></div>
                                                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                                    <img
                                                        src={isDark ? '/image/rule-ai-dark.png' : '/image/rule-ai-light.png'}
                                                        alt="Rule Based AI Bot"
                                                        className="w-80 h-auto object-cover"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col md:flex-row items-center gap-12 bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-purple-100 dark:border-purple-900/30 animate-scaleIn">
                                        <div className="flex-1 space-y-6">
                                            <div className="flex items-center gap-4">
                                                <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                                                    <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                                </div>
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Advanced Online AI</h3>
                                            </div>
                                            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                                                Need deeper insights? Enable our Online Model. We use <span className="font-semibold text-purple-600 dark:text-purple-400">advanced tokenization</span> to
                                                mask your personal data before it leaves your device. The AI sees structure, not identity.
                                            </p>
                                            <ul className="space-y-3">
                                                {['Complex pattern recognition', 'Context-aware financial advice', 'Strictly anonymized data tokens'].map((item, i) => (
                                                    <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                                                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                        {item}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="flex-1 flex justify-center">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-purple-500/20 blur-3xl rounded-full"></div>
                                                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                                                    <img
                                                        src={isDark ? '/image/online-ai-dark1.png' : '/image/online-ai-light.png'}
                                                        alt="Online AI Bot"
                                                        className="w-80 h-auto object-cover"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Privacy Demo Card */}
                            <div className="max-w-2xl mx-auto mt-16 animate-fadeInUp">
                                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 p-8 relative overflow-hidden text-center">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-purple-500"></div>
                                    <div className="mb-6 inline-flex p-4 rounded-full bg-gray-50 dark:bg-gray-900">
                                        <svg className="w-12 h-12 text-gray-700 dark:text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                    </div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">See Privacy in Action</h3>
                                    <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
                                        Watch how we transform your sensitive financial data into anonymous tokens before any online processing.
                                    </p>

                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 max-w-md mx-auto relative h-32 flex items-center justify-center">
                                        <div className={`transition-all duration-700 absolute w-full px-6 inset-0 flex flex-col justify-center ${isMasked ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Name</span>
                                                <span className="font-semibold text-gray-900 dark:text-white">Waqar Shaikh</span>
                                            </div>
                                            <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mb-2"></div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Balance</span>
                                                <span className="font-bold text-green-600 dark:text-green-400">₹50,000.00</span>
                                            </div>
                                            <div className="mt-2 text-xs text-center text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900/30 py-1 rounded">Raw Data (On Device)</div>
                                        </div>

                                        <div className={`transition-all duration-700 absolute w-full px-6 inset-0 flex flex-col justify-center ${!isMasked ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Token_ID</span>
                                                <span className="font-mono text-purple-600 dark:text-purple-400">[[PERSON_1]]</span>
                                            </div>
                                            <div className="w-full h-px bg-gray-200 dark:bg-gray-700 mb-2"></div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs font-mono text-gray-400 uppercase tracking-wider">Value_Token</span>
                                                <span className="font-mono text-purple-600 dark:text-purple-400">[[AMT_2]]</span>
                                            </div>
                                            <div className="mt-2 text-xs text-center text-purple-600 dark:text-purple-400 font-medium bg-purple-100 dark:bg-purple-900/30 py-1 rounded">Anonymized (Online Safe)</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* About Us Section */}
                <section id="about" className="py-20 md:py-28">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white animate-fadeInUp">Our Mission</h2>
                        <div className="max-w-4xl mx-auto mt-6 text-lg text-gray-600 dark:text-gray-400 leading-relaxed animate-fadeInUp delay-200">
                            <p className="transform hover:scale-105 transition-transform duration-300">
                                We're breaking down barriers to financial independence by providing comprehensive,
                                intuitive financial tools that are free for everyone, forever.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Final CTA Section */}
                <section className="py-20">
                    <div className="container mx-auto px-6">
                        <div className="bg-gradient-to-r from-green-500 to-green-400 rounded-2xl shadow-xl text-center py-16 px-8 transform hover:scale-105 transition-transform duration-500">
                            <h2 className="text-3xl md:text-4xl font-extrabold text-white animate-bounce-slow">Ready to Take Control?</h2>
                            <p className="mt-4 max-w-2xl mx-auto text-lg text-green-100 animate-fadeInUp">
                                Join thousands building a better financial future with Traxos.
                            </p>
                            <div className="mt-8 animate-fadeInUp delay-300">
                                <a
                                    href="/signup"
                                    className="bg-white text-green-600 font-bold text-lg px-8 py-4 rounded-lg shadow-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-110 hover:shadow-2xl inline-block"
                                >
                                    Get Started for Free &rarr;
                                </a>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            {/* Footer */}
            <Footer />

            {/* Animation Styles */}
            <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
        .animate-gradient {
          background: linear-gradient(-45deg, #10B981, #34D399, #10B981);
          background-size: 400% 400%;
          animation: gradient 3s ease infinite;
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 2s ease-in-out infinite;
        }
        .delay-200 {
          animation-delay: 200ms;
        }
        .delay-300 {
          animation-delay: 300ms;
        }
        .delay-400 {
          animation-delay: 400ms;
        }
        .delay-600 {
          animation-delay: 600ms;
        }
      `}</style>
        </div>
    );
};

export default Home;