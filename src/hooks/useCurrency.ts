import { useAuth } from '../contexts/AuthContext'

export function useCurrency() {
    const { profile } = useAuth()

    const currencyCode = profile?.currency || 'INR'

    const formatCurrency = (amount: number) => {
        const localeMap: { [key: string]: string } = {
            'INR': 'en-IN',
            'USD': 'en-US',
            'EUR': 'de-DE', // or en-IE
            'GBP': 'en-GB',
            'JPY': 'ja-JP',
            'AUD': 'en-AU',
            'CAD': 'en-CA',
        }
        const locale = localeMap[currencyCode] || 'en-US'

        return new Intl.NumberFormat(locale, {
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
