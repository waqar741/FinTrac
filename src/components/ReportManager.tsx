import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { format, subMonths, startOfMonth, endOfMonth, getYear, getMonth } from 'date-fns';
import MonthlyReportModal from './MonthlyReportModal';

interface Transaction {
    amount: number;
    type: 'income' | 'expense';
    category: string;
}

export default function ReportManager() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    useEffect(() => {
        if (!user) return;

        const checkAndGenerateReport = async () => {
            const today = new Date();
            // We want to report on the PREVIOUS month
            const lastMonthDate = subMonths(today, 1);

            const reportYear = getYear(lastMonthDate);
            const reportMonthIndex = getMonth(lastMonthDate); // 0-indexed (Jan=0, Dec=11)

            // Unique key for this user + month + year
            const reportKey = `traxos_report_viewed_${user.id}_${reportYear}_${reportMonthIndex}`;

            // 1. Check if already viewed
            const hasViewed = localStorage.getItem(reportKey);
            if (hasViewed) return;

            // 2. Fetch data for that full month
            const start = startOfMonth(lastMonthDate).toISOString();
            const end = endOfMonth(lastMonthDate).toISOString();

            const { data: transactions, error } = await supabase
                .from('transactions')
                .select('amount, type, category')
                .eq('user_id', user.id)
                .gte('created_at', start)
                .lte('created_at', end);

            if (error || !transactions || transactions.length === 0) {
                // No need to show report if no data, but maybe mark as viewed to stop checking?
                // Let's decide to mark it as viewed so we don't spam checks, or just ignore.
                // For now, if no data, we do nothing. user might add data later? 
                // Actually, if it's past the month, they might not add back-dated data often.
                // Let's safe mark as viewed to avoid useless API calls every refresh.
                if (transactions?.length === 0) {
                    localStorage.setItem(reportKey, 'true');
                }
                return;
            }

            // 3. Process Data
            let totalIncome = 0;
            let totalExpense = 0;
            const expensesByCategory: Record<string, number> = {};

            transactions.forEach((t: Transaction) => {
                const amt = Number(t.amount);
                if (t.type === 'income') {
                    totalIncome += amt;
                } else {
                    totalExpense += amt;
                    expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + amt;
                }
            });

            // Top 3 Categories
            const topCategories = Object.entries(expensesByCategory)
                .map(([category, amount]) => ({ category, amount }))
                .sort((a, b) => b.amount - a.amount)
                .slice(0, 3);

            const savingsRate = totalIncome > 0
                ? ((totalIncome - totalExpense) / totalIncome) * 100
                : 0;

            const monthName = format(lastMonthDate, 'MMMM');

            setReportData({
                month: monthName,
                year: reportYear,
                totalIncome,
                totalExpense,
                savingsRate,
                topCategories,
                transactionCount: transactions.length
            });

            setIsOpen(true);
        };

        checkAndGenerateReport();
    }, [user]);

    const handleClose = () => {
        setIsOpen(false);
        if (user && reportData) {
            // Calculate key again to save
            // NOTE: We rely on the reportData being from the calculated period in useEffect
            // But to be safe, we reconstruct the key logic or pass it. 
            // Re-calculating logic implies consistency with useEffect.
            const today = new Date();
            const lastMonthDate = subMonths(today, 1);
            const reportYear = getYear(lastMonthDate);
            const reportMonthIndex = getMonth(lastMonthDate);
            const reportKey = `traxos_report_viewed_${user.id}_${reportYear}_${reportMonthIndex}`;

            localStorage.setItem(reportKey, 'true');
        }
    };

    return (
        <MonthlyReportModal
            isOpen={isOpen}
            onClose={handleClose}
            data={reportData}
        />
    );
}
