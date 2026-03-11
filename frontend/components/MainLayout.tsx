'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Sidebar from './Sidebar'
import { useAuth } from '@/lib/auth-context'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/login'

  useEffect(() => {
    if (!loading && !user && !isLoginPage) {
      router.replace('/login')
    }
  }, [user, loading, isLoginPage, router])

  // Login page renders without sidebar
  if (isLoginPage) {
    return <>{children}</>
  }

  // Show spinner while checking auth
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-therapy-gray">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-therapy-coral" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-therapy-gray">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      <div className={`transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      } pb-16 lg:pb-0`}>
        {children}
      </div>
    </div>
  )
}
