import { useAuth } from '../contexts/AuthContext'

export function useCurrency() {
    const { profile } = useAuth()

    const currencyCode = profile?.currency || 'INR'

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 0,
        }).format(amount)
    }

    return {
        currency: currencyCode,
        formatCurrency
    }
}
