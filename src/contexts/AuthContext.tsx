// import { createContext, useContext, useEffect, useState } from 'react'
// import { User } from '@supabase/supabase-js'
// import { supabase } from '../lib/supabase'

// interface AuthContextType {
//   user: User | null
//   profile: any | null
//   loading: boolean
//   signIn: (email: string, password: string) => Promise<void>
//   signUp: (email: string, password: string, fullName: string) => Promise<void>
//   signOut: () => Promise<void>
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined)

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<User | null>(null)
//   const [profile, setProfile] = useState<any | null>(null)
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setUser(session?.user ?? null)
//       if (session?.user) {
//         fetchProfile(session.user.id)
//       }
//       setLoading(false)
//     })

//     const {
//       data: { subscription },
//     } = supabase.auth.onAuthStateChange((_event, session) => {
//       setUser(session?.user ?? null)
//       if (session?.user) {
//         fetchProfile(session.user.id)
//       } else {
//         setProfile(null)
//       }
//       setLoading(false)
//     })

//     return () => subscription.unsubscribe()
//   }, [])

//   const fetchProfile = async (userId: string) => {
//     try {
//       const { data, error } = await supabase
//         .from('profiles')
//         .select('*')
//         .eq('id', userId)
//         .maybeSingle()

//       if (error) {
//         console.error('Error fetching profile:', error)
//         setProfile(null)
//       } else if (data) {
//         setProfile(data)
//       } else {
//         setProfile(null)
//       }
//     } catch (error) {
//       console.error('Error fetching profile:', error)
//       setProfile(null)
//     }
//   }

//   const signIn = async (email: string, password: string) => {
//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password,
//     })
//     if (error) throw error
//   }

//   const signUp = async (email: string, password: string, fullName: string) => {
//     if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'your_supabase_url') {
//       throw new Error('Supabase is not configured. Please set up your Supabase credentials in the .env file.')
//     }

//     const { error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: { full_name: fullName }
//       }
//     })
//     if (error) throw error
//   }

//   const signOut = async () => {
//     if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'your_supabase_url') {
//       throw new Error('Supabase is not configured. Please set up your Supabase credentials in the .env file.')
//     }
    
//     const { error } = await supabase.auth.signOut()
//     if (error) throw error
//   }

//   const value = {
//     user,
//     profile,
//     loading,
//     signIn,
//     signUp,
//     signOut,
//   }

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }

// export function useAuth() {
//   const context = useContext(AuthContext)
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider')
//   }
//   return context
// }


import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: any | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      // 🔑 Try refreshing session on app mount
      const { data, error } = await supabase.auth.refreshSession()
      if (error || !data.session) {
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setUser(data.session.user ?? null)
      if (data.session.user) {
        fetchProfile(data.session.user.id)
      }
      setLoading(false)
    }

    initAuth()

    // 🔑 Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setUser(null)
        // 🔑 Redirect when session is invalid
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
      } else if (data) {
        setProfile(data)
      } else {
        setProfile(null)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfile(null)
    }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'your_supabase_url') {
      throw new Error('Supabase is not configured. Please set up your Supabase credentials in the .env file.')
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName }
      }
    })
    if (error) throw error
  }

  const signOut = async () => {
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL === 'your_supabase_url') {
      throw new Error('Supabase is not configured. Please set up your Supabase credentials in the .env file.')
    }

    const { error } = await supabase.auth.signOut()
    if (error) throw error
    // 🔑 redirect after manual logout
    window.location.href = '/login'
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
