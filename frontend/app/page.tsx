'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { apiClient, Session, ClientListItem } from '@/lib/api'

export default function Dashboard() {
  const { user } = useAuth()
  const [totalClients, setTotalClients] = useState<number | null>(null)
  const [totalHours, setTotalHours] = useState<number | null>(null)
  const [recentSessions, setRecentSessions] = useState<(Session & { clientName: string })[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const [clientStats, sessionStats, sessions] = await Promise.all([
          fetch(`${API}/api/v1/clients/stats/count`).then(r => r.json()).catch(() => null),
          fetch(`${API}/api/v1/sessions/stats/totals`).then(r => r.json()).catch(() => null),
          apiClient.getSessions().catch(() => []),
        ])

        if (clientStats) setTotalClients(clientStats.total_clients)
        if (sessionStats) setTotalHours(sessionStats.total_hours)

        // Get recent sessions with client names
        if (sessions && sessions.length > 0) {
          const clientIds = Array.from(new Set(sessions.slice(0, 10).map(s => s.client_id)))
          const clients = await Promise.all(
            clientIds.map(id => apiClient.getClient(id).catch(() => null))
          )

          const sessionsWithClients = sessions
            .slice(0, 10)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .map(session => {
              const client = clients.find(c => c?.id === session.client_id)
              return {
                ...session,
                clientName: client?.full_name || 'Unknown Client',
              }
            })
          setRecentSessions(sessionsWithClients)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
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
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading...</div>
            ) : recentSessions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                No recent sessions found. Start a new session to see activity here.
              </div>
            ) : (
              recentSessions.map((session) => (
                <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <h3 className="text-lg font-semibold text-therapy-navy">{session.clientName}</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(session.session_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </span>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-gray-500">{session.duration_minutes} min</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium bg-therapy-blue bg-opacity-20 text-therapy-blue`}>
                          {session.session_type}
                        </span>
                      </div>
            
                    </div>
                    <div className="ml-6 flex space-x-2">
                      <Link
                        href={`/sessions/${session.id}`}
                        className="px-4 py-2 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
