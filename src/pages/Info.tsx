import { useState } from 'react'
import {
    Activity,
    CreditCard,
    Target,
    Users,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    CheckCircle,
    XCircle
} from 'lucide-react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

// FAQ Data
const faqs = [
    {
        question: 'Is my financial data secure?',
        answer: 'Yes, Traxos uses industry-standard encryption to protect your financial data and personal information. We never share your data with third parties.'
    },
    {
        question: 'Can I use Traxos as a debt manager for my business?',
        answer: 'Absolutely! Our Debts & Credits feature acts as a powerful debt manager, allowing you to track individual debts and credits with friends, family, or clients easily.'
    },
    {
        question: 'How does the AI financial assistant work?',
        answer: "Traxos features an integrated AI assistant that can answer questions about your spending, help set goals, and provide financial insights based on your transaction history."
    },
    {
        question: 'Is Traxos the best free alternative to Splitwise?',
        answer: 'Traxos offers a comprehensive free tier that many users find to be a superior free alternative to Splitwise for tracking shared expenses and debts without complex subscriptions.'
    },
    {
        question: 'Can I export my transaction history?',
        answer: 'Yes, you can export your transaction data in CSV or PDF format from the Settings page for your own records or analysis.'
    },
    {
        question: 'How does the Online AI Model process my data?',
        answer: (
            <span>
                Your data is strictly masked before processing to ensure privacy. For detailed technical information, you can view our{' '}
                <a
                    href="/docs/Traxos-Technical-Data-Processing-Guide.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-green-400 hover:underline font-medium"
                >
                    AI Data Processing Documentation
                </a>.
            </span>
        )
    }
]

// Detailed Guide Steps for Zig-Zag Layout
const guideSteps = [
    {
        title: 'Dashboard',
        description: 'Your financial command center. The Dashboard aggregates all your data to give you a real-time health check. View your total current balance, analyze monthly spending trends, and spot recent activity immediately upon logging in.',
        icon: Activity,
    },
    {
        title: 'Transactions',
        description: 'Precision is key. Log every expense and income source with ease. Assign specific categories (like Food, Rent, or Salary) and add notes. Consistent logging allows the system to generate accurate reports on where your money is actually going.',
        icon: CreditCard,
    },
    {
        title: 'Saving Goals',
        description: 'Turn dreams into reality. Whether it\'s a new laptop, a vacation, or an emergency fund, create specific goals with target amounts. Traxos visualizes your progress bars, motivating you to contribute regularly until you reach 100%.',
        icon: Target,
    },
    {
        title: 'Debts & Credits',
        description: 'Stop awkward money conversations. Keep a precise ledger of who owes you (Credits) and who you owe (Debts). You can manage multiple people, record partial payments, and settle up cleanly without relying on memory.',
        icon: Users,
    },
    {
        title: 'AI Assistant',
        description: 'Your personal financial analyst. Stuck on how to budget? Wondering how much you spent on coffee last month? Just ask the AI in plain English. It analyzes your unique data to provide personalized insights and actionable advice.',
        icon: MessageSquare,
    }
]

// Dos and Don'ts
const dos = [
    'Log transactions daily for accuracy.',
    'Set realistic saving goals.',
    'Use categories consistently.',
    'Check your dashboard weekly.',
    'Settle debts promptly.'
]

const donts = [
    'Share your password with anyone.',
    'Ignore small expenses; they add up!',
    'Set goals you can\'t reach.',
    'Forget to update debt payments.',
    'Mix business and personal expenses.'
]

export default function Info() {
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <SEO title="How it Works - Traxos" description="Master your finances with Traxos." />

            {/* Header / Nav */}
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 py-12 space-y-24">

                {/* Hero / Header Section matching image */}
                <div className="text-center space-y-6 animate-in fade-in duration-700">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Master Your Finances with <span className="text-green-600">Traxos</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        A simple, step-by-step guide to getting the most out of your personal finance tracker.
                    </p>
                </div>

                {/* Detailed Zig-Zag Steps */}
                <section className="space-y-20 md:space-y-32">
                    {guideSteps.map((step, index) => (
                        <div
                            key={index}
                            className={`flex flex-col md:flex-row items-center gap-8 md:gap-16 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''
                                }`}
                        >
                            {/* Text Side */}
                            <div className="flex-1 space-y-4 text-center md:text-left">
                                <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {step.title}
                                </h3>
                                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
                                    {step.description}
                                </p>
                            </div>

                            {/* Icon/Visual Side */}
                            <div className="flex-1 flex justify-center">
                                <div className="w-48 h-48 md:w-64 md:h-64 rounded-3xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center transform hover:scale-105 transition-transform duration-300">
                                    <step.icon className="w-20 h-20 md:w-28 md:h-28 text-green-600 dark:text-green-500 opacity-90" />
                                </div>
                            </div>
                        </div>
                    ))}
                </section>

                {/* Dos and Don'ts - CARDS (Preserved layout) */}
                <section className="grid md:grid-cols-2 gap-8">
                    {/* Dos */}
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-3xl p-8 border border-green-100 dark:border-green-900/30 shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
                            <h3 className="text-2xl font-bold text-green-900 dark:text-green-100">Do's</h3>
                        </div>
                        <ul className="space-y-4">
                            {dos.map((item, i) => (
                                <li key={i} className="flex items-start">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2.5 mr-3 shrink-0"></span>
                                    <span className="text-green-800 dark:text-green-200 font-medium text-lg">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Don'ts */}
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-8 border border-red-100 dark:border-red-900/30 shadow-sm">
                        <div className="flex items-center space-x-3 mb-6">
                            <XCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
                            <h3 className="text-2xl font-bold text-red-900 dark:text-red-100">Don'ts</h3>
                        </div>
                        <ul className="space-y-4">
                            {donts.map((item, i) => (
                                <li key={i} className="flex items-start">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2.5 mr-3 shrink-0"></span>
                                    <span className="text-red-800 dark:text-red-200 font-medium text-lg">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* Simple FAQ Section */}
                <section className="max-w-3xl mx-auto pt-8">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-2">
                        {/* FAQPage Schema */}
                        <script type="application/ld+json">
                            {JSON.stringify({
                                "@context": "https://schema.org",
                                "@type": "FAQPage",
                                "mainEntity": faqs.map(faq => ({
                                    "@type": "Question",
                                    "name": faq.question,
                                    "acceptedAnswer": {
                                        "@type": "Answer",
                                        "text": typeof faq.answer === 'string' ? faq.answer : "Your data is strictly masked before processing to ensure privacy. For detailed technical information, you can view our AI Data Processing Documentation."
                                    }
                                }))
                            })}
                        </script>

                        {faqs.map((faq, index) => (
                            <div key={index} className="border-b border-gray-200 dark:border-gray-800 last:border-0">
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full text-left py-5 flex items-center justify-between focus:outline-none group"
                                >
                                    <h3 className={`font-medium text-lg transition-colors ${openIndex === index
                                        ? 'text-green-600 dark:text-green-400'
                                        : 'text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white'
                                        }`}>
                                        {faq.question}
                                    </h3>
                                    {openIndex === index ? (
                                        <ChevronUp className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                                {openIndex === index && (
                                    <div className="pb-6 pr-4 animate-in slide-in-from-top-1 duration-200">
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base">
                                            {faq.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer CTA */}
                <div className="text-center pt-8 pb-12">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Ready to take control?</p>
                    <Link
                        to="/signup"
                        className="inline-flex items-center justify-center px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Get Started Free
                    </Link>
                </div>

            </main>
            <Footer />
        </div>
    )
}