import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvdXItcHJvamVjdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQ1MTkyMDAwLCJleHAiOjE5NjA3NjgwMDB9.placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      budgets: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'master' | 'sub'
          parent_id: string | null
          allocated_amount: number
          current_balance: number
          color: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type?: 'master' | 'sub'
          parent_id?: string | null
          allocated_amount?: number
          current_balance?: number
          color?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'master' | 'sub'
          parent_id?: string | null
          allocated_amount?: number
          current_balance?: number
          color?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          budget_id: string
          amount: number
          type: 'income' | 'expense'
          description: string
          category: string
          is_recurring: boolean
          recurring_frequency: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          budget_id: string
          amount: number
          type: 'income' | 'expense'
          description: string
          category?: string
          is_recurring?: boolean
          recurring_frequency?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          budget_id?: string
          amount?: number
          type?: 'income' | 'expense'
          description?: string
          category?: string
          is_recurring?: boolean
          recurring_frequency?: string | null
          created_at?: string
        }
      }
      debts_credits: {
        Row: {
          id: string
          user_id: string
          person_name: string
          amount: number
          type: 'debt' | 'credit'
          description: string
          due_date: string | null
          is_settled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          person_name: string
          amount: number
          type: 'debt' | 'credit'
          description: string
          due_date?: string | null
          is_settled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          person_name?: string
          amount?: number
          type?: 'debt' | 'credit'
          description?: string
          due_date?: string | null
          is_settled?: boolean
          created_at?: string
        }
      }
    }
  }
}