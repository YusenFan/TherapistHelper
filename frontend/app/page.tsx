'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'

// Mock data for demonstration
const recentSessions = [
  {
    id: 1,
    clientName: "John Doe",
    date: "July 5, 2025",
    duration: "50 min",
    summary: "Discussed work stress and family relationships. Client reported improved boundary-setting with manager.",
    mood: "Improving"
  },
  {
    id: 2,
    clientName: "Sarah Johnson",
    date: "July 4, 2025",
    duration: "45 min",
    summary: "Continued cognitive behavioral therapy for anxiety. Client completed homework assignments successfully.",
    mood: "Stable"
  },
  {
    id: 3,
    clientName: "Michael Chen",
    date: "July 3, 2025",
    duration: "60 min",
    summary: "Initial consultation for depression symptoms. Established treatment goals and discussed medication options.",
    mood: "Initial Assessment"
  }
]

export default function Dashboard() {
  const { user } = useAuth()
  const [totalClients, setTotalClients] = useState<number | null>(null)
  const [totalHours, setTotalHours] = useState<number | null>(null)

  useEffect(() => {
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    Promise.all([
      fetch(`${API}/api/v1/clients/stats/count`).then(r => r.json()).catch(() => null),
      fetch(`${API}/api/v1/sessions/stats/totals`).then(r => r.json()).catch(() => null),
    ]).then(([clientStats, sessionStats]) => {
      if (clientStats) setTotalClients(clientStats.total_clients)
      if (sessionStats) setTotalHours(sessionStats.total_hours)
    })
  }, [])

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-therapy-navy">Dashboard</h1>
              <p className="text-gray-600 mt-1 text-lg">Welcome back, {user?.name || user?.email || 'Doctor'}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search clients, sessions..."
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-therapy-coral bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-therapy-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Clients</p>
                <p className="text-3xl font-bold text-therapy-navy">
                  {totalClients === null ? '—' : totalClients}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-therapy-blue bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-therapy-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Hours</p>
                <p className="text-3xl font-bold text-therapy-navy">
                  {totalHours === null ? '—' : totalHours}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-therapy-navy mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/sessions/new" className="group">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-therapy-coral transition-all duration-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-therapy-coral bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-therapy-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-therapy-navy group-hover:text-therapy-coral transition-colors">New Session</h3>
                    <p className="text-gray-600 text-sm">Start a new therapy session</p>
                  </div>
                </div>
              </div>
            </Link>

           
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-therapy-navy">Recent Activity</h2>
            <Link href="/sessions" className="text-therapy-coral hover:text-therapy-coral-dark font-medium">
              View all sessions →
            </Link>
          </div>

          <div className="space-y-4">
            {recentSessions.map((session) => (
              <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4 mb-3">
                      <h3 className="text-lg font-semibold text-therapy-navy">{session.clientName}</h3>
                      <span className="text-sm text-gray-500">{session.date}</span>
                      <span className="text-sm text-gray-500">•</span>
                      <span className="text-sm text-gray-500">{session.duration}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        session.mood === 'Improving'
                          ? 'bg-therapy-green bg-opacity-20 text-therapy-green'
                          : session.mood === 'Stable'
                          ? 'bg-therapy-blue bg-opacity-20 text-therapy-blue'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {session.mood}
                      </span>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{session.summary}</p>
                  </div>
                  <div className="ml-6 flex space-x-2">
                    <Link
                      href={`/session-analysis?session=${session.id}`}
                      className="px-4 py-2 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
                    >
                      View Details
                    </Link>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      Export
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
