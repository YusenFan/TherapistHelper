'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'

interface MainLayoutProps {
  children: React.ReactNode
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(true) // Collapsed by default as per design

  return (
    <div className="min-h-screen bg-therapy-gray">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      
      {/* Main content area */}
      <div className={`transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      } pb-16 lg:pb-0`}>
        {children}
      </div>
    </div>
  )
} 