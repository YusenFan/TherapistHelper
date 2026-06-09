'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import { useAuth } from '@/lib/auth-context'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    }
  }, [user, loading, router])

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
