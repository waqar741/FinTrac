import { useAuth } from '../contexts/AuthContext'
import { format } from 'date-fns'

export function useDateFormat() {
    const { profile } = useAuth()

    const getDateFormat = () => {
        const pref = profile?.date_format || 'DD/MM/YYYY'

        // Map UI format strings to date-fns format tokens
        switch (pref) {
            case 'DD/MM/YYYY':
                return 'dd/MM/yyyy'
            case 'MM/DD/YYYY':
                return 'MM/dd/yyyy'
            case 'YYYY-MM-DD':
                return 'yyyy-MM-dd'
            default:
                return 'dd/MM/yyyy'
        }
    }

    const formatDate = (date: string | Date | null | undefined) => {
        if (!date) return ''
        try {
            return format(new Date(date), getDateFormat())
        } catch (error) {
            console.error('Error formatting date:', error)
            return ''
        }
    }

    return { formatDate, dateFormat: getDateFormat() }
}
