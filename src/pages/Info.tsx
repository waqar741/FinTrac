import { useState } from 'react'
import {
    Activity,
    CreditCard,
    Target,
    Users,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    CheckCircle,
    XCircle,
    ArrowLeft
} from 'lucide-react'
import { Link } from 'react-router-dom'
import SEO from '../components/SEO'

// FAQ Data
const faqs = [
    {
        question: 'Is my financial data secure?',
        answer: 'Yes, Traxos uses industry-standard encryption to protect your financial data and personal information. We never share your data with third parties.'
    },
    {
        question: 'Can I track debts with multiple people?',
        answer: 'Absolutely! Our Debts & Credits feature allows you to track individual debts and credits with friends, family, or colleagues easily.'
    },
    {
        question: 'How does the AI financial assistant work?',
        answer: "Traxos features an integrated AI assistant that can answer questions about your spending, help set goals, and provide financial insights based on your transaction history."
    },
    {
        question: 'Is Traxos free to use?',
        answer: 'Traxos offers a comprehensive free tier for personal use. We also have premium plans for advanced features and larger groups.'
    },
    {
        question: 'Can I export my transaction history?',
        answer: 'Yes, you can export your transaction data in CSV or PDF format from the Settings page for your own records or analysis.'
    }
]

// Step by Step Guide
const guideSteps = [
    {
        title: 'Dashboard',
        description: 'Your financial command center. See your total balance, recent activity, and quick summaries at a glance. Use this to get a daily health check of your finances.',
        icon: Activity,
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
        title: 'Transactions',
        description: 'Log every expense and income here. Categorize them (e.g., Food, Rent, Salary) to track where your money goes. Regular logging is key to accurate insights.',
        icon: CreditCard,
        color: 'text-green-500',
        bg: 'bg-green-50 dark:bg-green-900/20'
    },
    {
        title: 'Saving Goals',
        description: 'Dreaming of a new car or vacation? Create a goal, set a target amount, and contribute regularly. Watch the progress bar fill up as you save!',
        icon: Target,
        color: 'text-purple-500',
        bg: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
        title: 'Debts & Credits',
        description: 'Never forget who owes you pizza money. Add people and track individual debts. Record payments to settle up and keep relationships stress-free.',
        icon: Users,
        color: 'text-orange-500',
        bg: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
        title: 'AI Assistant',
        description: 'Stuck? Ask the AI! "How much did I spend on coffee?" or "Suggest a budget." It uses your data to give personalized, intelligent answers.',
        icon: MessageSquare,
        color: 'text-pink-500',
        bg: 'bg-pink-50 dark:bg-pink-900/20'
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
    // Accordion State for FAQs
    const [openIndex, setOpenIndex] = useState<number | null>(0)

    const toggleFaq = (index: number) => {
        setOpenIndex(openIndex === index ? null : index)
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <SEO title="How it Works - Traxos" description="Learn how to use Traxos effectively. Step-by-step guides, FAQs, and tips." />

            {/* Header / Nav */}
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors">
                        <ArrowLeft className="w-5 h-5 mr-2" />
                        Back to Home
                    </Link>
                    <span className="font-bold text-xl text-gray-900 dark:text-white">Traxos Guide</span>
                    <div className="w-20"></div> {/* Spacer for centering */}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12 space-y-16 animate-in fade-in duration-500">

                {/* Hero Section */}
                <div className="text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Master Your Finances with <span className="text-green-600">Traxos</span>
                    </h1>
                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        A simple, step-by-step guide to getting the most out of your personal finance tracker.
                    </p>
                </div>

                {/* Step-by-Step Guide */}
                <section>
                    <div className="flex items-center space-x-3 mb-8 justify-center">
                        <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1 max-w-[100px]"></div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white uppercase tracking-wider text-center">Step-by-Step Guide</h2>
                        <div className="h-px bg-gray-300 dark:bg-gray-700 flex-1 max-w-[100px]"></div>
                    </div>

                    <div className="space-y-6">
                        {guideSteps.map((step, index) => (
                            <div
                                key={index}
                                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center gap-6 hover:shadow-md transition-shadow"
                            >
                                <div className={`p-4 rounded-xl shrink-0 ${step.bg}`}>
                                    <step.icon className={`w-8 h-8 ${step.color}`} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center">
                                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-bold px-2 py-0.5 rounded mr-3">STEP {index + 1}</span>
                                        {step.title}
                                    </h3>
                                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                        {step.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Dos and Don'ts */}
                <section className="grid md:grid-cols-2 gap-8">
                    {/* Dos */}
                    <div className="bg-green-50 dark:bg-green-900/10 rounded-3xl p-8 border border-green-100 dark:border-green-900/30">
                        <div className="flex items-center space-x-3 mb-6">
                            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-500" />
                            <h3 className="text-2xl font-bold text-green-900 dark:text-green-100">Do's</h3>
                        </div>
                        <ul className="space-y-4">
                            {dos.map((item, i) => (
                                <li key={i} className="flex items-start">
                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2.5 mr-3 shrink-0"></span>
                                    <span className="text-green-800 dark:text-green-200 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Don'ts */}
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-3xl p-8 border border-red-100 dark:border-red-900/30">
                        <div className="flex items-center space-x-3 mb-6">
                            <XCircle className="w-8 h-8 text-red-600 dark:text-red-500" />
                            <h3 className="text-2xl font-bold text-red-900 dark:text-red-100">Don'ts</h3>
                        </div>
                        <ul className="space-y-4">
                            {donts.map((item, i) => (
                                <li key={i} className="flex items-start">
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2.5 mr-3 shrink-0"></span>
                                    <span className="text-red-800 dark:text-red-200 font-medium">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center space-x-3 mb-8">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                            <HelpCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Frequently Asked Questions
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div
                                key={index}
                                className={`border rounded-xl transition-all duration-200 overflow-hidden ${openIndex === index
                                    ? 'border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-900/10'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-green-200 dark:hover:border-green-800'
                                    }`}
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full text-left px-6 py-4 flex items-center justify-between focus:outline-none"
                                >
                                    <span className={`font-semibold ${openIndex === index
                                        ? 'text-green-700 dark:text-green-400'
                                        : 'text-gray-900 dark:text-gray-200'
                                        }`}>
                                        {faq.question}
                                    </span>
                                    {openIndex === index ? (
                                        <ChevronUp className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400" />
                                    )}
                                </button>
                                {openIndex === index && (
                                    <div className="px-6 pb-4 animate-in slide-in-from-top-2 duration-200">
                                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                            {faq.answer}
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Footer Call to Action */}
                <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                        Ready to get started?
                    </p>
                    <Link
                        to="/signup"
                        className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
                    >
                        Create Free Account
                    </Link>
                </div>
            </main>
        </div>
    )
}
