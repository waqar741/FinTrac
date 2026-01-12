import { useState, useCallback } from 'react'

// --- Types ---
interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
}
declare var window: Window;

export interface VoiceTransactionData {
    amount: number
    person_name: string
    type: 'debt' | 'credit'
    description: string
}

export function useVoiceTransaction() {
    const [isListening, setIsListening] = useState(false)
    const [voiceData, setVoiceData] = useState<VoiceTransactionData | null>(null)
    const [error, setError] = useState<string | null>(null)

    const parseVoiceCommand = (text: string): VoiceTransactionData => {
        const lowerText = text.toLowerCase()
        let amount = 0
        let person_name = ''
        let type: 'debt' | 'credit' = 'debt'
        let description = text

        // 1. Extract Amount
        const amountMatch = text.match(/[\d,]+(\.\d{1,2})?/)
        if (amountMatch) {
            amount = parseFloat(amountMatch[0].replace(/,/g, ''))
        }

        // 2. Determine Type (Who owes whom?)
        // "Owe" -> I owe them (Debt)
        // "Owes me", "Credit" -> They owe me (Credit)
        if (lowerText.includes('owes me') || lowerText.includes('credit') || lowerText.includes('receive')) {
            type = 'credit'
        } else if (lowerText.includes('owe') || lowerText.includes('debt') || lowerText.includes('pay')) {
            type = 'debt'
        }

        // 3. Extract Person Name
        const words = text.split(' ')
        const keywords = ['owe', 'owes', 'me', 'credit', 'debt', 'for', 'to', 'pay', 'rupees', 'rs', 'amount']

        for (const word of words) {
            const cleanWord = word.toLowerCase().replace(/[^a-z]/g, '')
            if (!keywords.includes(cleanWord) && isNaN(Number(word.replace(/,/g, ''))) && word.length > 2) {
                // Assume this might be the name. Capitalize it.
                person_name = word.charAt(0).toUpperCase() + word.slice(1)
                break
            }
        }

        // Fallback if empty name
        if (!person_name) person_name = 'Unknown'

        // 4. Description
        description = text.charAt(0).toUpperCase() + text.slice(1)

        return { amount, person_name, type, description }
    }

    const startListening = useCallback(() => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            setError('Voice recognition is not supported in this browser.')
            return
        }

        setError(null)
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
        const recognition = new SpeechRecognition()

        recognition.continuous = false
        recognition.interimResults = false
        recognition.lang = 'en-US'

        recognition.onstart = () => setIsListening(true)

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript
            console.log('Voice Input:', transcript)
            const parsed = parseVoiceCommand(transcript)
            setVoiceData(parsed)
            setIsListening(false)
        }

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error)
            setError(event.error)
            setIsListening(false)
        }

        recognition.onend = () => setIsListening(false)

        try {
            recognition.start()
        } catch (err) {
            console.error("Failed to start recognition", err)
            setIsListening(false)
        }
    }, [])

    const resetVoiceData = useCallback(() => {
        setVoiceData(null)
        setError(null)
    }, [])

    return {
        isListening,
        voiceData,
        error,
        startListening,
        resetVoiceData
    }
}
