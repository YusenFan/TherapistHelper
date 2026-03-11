'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { account, ID } from './appwrite'
import type { Models } from 'appwrite'

interface AuthContextType {
  user: Models.User<Models.Preferences> | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const u = await account.get()
        setUser(u)
        // Try to create/refresh JWT for backend API calls
        try {
          const jwt = await account.createJWT()
          localStorage.setItem('token', jwt.jwt)
        } catch (err) {
          console.error('Failed to create JWT:', err)
          localStorage.removeItem('token')
        }
      } catch (err) {
        // Not logged in or session expired
        setUser(null)
        localStorage.removeItem('token')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    // Create new email/password session directly
    await account.createEmailPasswordSession(email, password)
    const u = await account.get()
    setUser(u)

    // Generate JWT for backend authentication
    try {
      const jwt = await account.createJWT()
      localStorage.setItem('token', jwt.jwt)
    } catch (err) {
      console.error('Failed to create JWT:', err)
    }
  }

  const register = async (email: string, password: string, name: string) => {
    await account.create(ID.unique(), email, password, name)
    await account.createEmailPasswordSession(email, password)
    const u = await account.get()
    setUser(u)
    // Generate JWT for backend authentication
    try {
      const jwt = await account.createJWT()
      localStorage.setItem('token', jwt.jwt)
    } catch (err) {
      console.error('Failed to create JWT:', err)
    }
  }

  const logout = async () => {
    await account.deleteSession('current')
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
