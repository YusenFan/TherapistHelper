'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { apiClient, Session, ClientListItem } from '@/lib/api'

interface SessionWithClient extends Session {
  clientName: string
  clientInitials: string
}

export default function SessionsPage() {
  const [clients, setClients] = useState<ClientListItem[]>([])
  const [sessions, setSessions] = useState<SessionWithClient[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [clientsData, sessionsData] = await Promise.all([
          apiClient.getClients(),
          apiClient.getSessions(),
        ])

        setClients(clientsData)

        // Map sessions with client info
        const sessionsWithClients = sessionsData
          .map(session => {
            const client = clientsData.find(c => c.id === session.client_id)
            return {
              ...session,
              clientName: client?.full_name || 'Unknown Client',
              clientInitials: client?.full_name
                ?.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || '??',
            }
          })
          .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())

        setSessions(sessionsWithClients)
      } catch (error) {
        console.error('Error fetching sessions data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    return clients.filter(client =>
      client.full_name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [clients, searchQuery])

  // Filter sessions by selected client
  const clientSessions = useMemo(() => {
    if (!selectedClientId) return sessions
    return sessions.filter(session => session.client_id === selectedClientId)
  }, [sessions, selectedClientId])

  const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden mr-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-therapy-navy">Session Records</h1>
                <p className="text-gray-600 mt-1 text-lg">
                  {selectedClient
                    ? `${selectedClient.full_name} - ${clientSessions.length} sessions`
                    : `${sessions.length} total sessions`
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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

      <div className="flex max-w-7xl mx-auto">
        {/* Client Sidebar */}
        <div className={`${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative lg:flex z-20 w-80 h-[calc(100vh-120px)] transition-transform duration-300 ease-in-out`}>
          <div className="w-full bg-white border-r border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-therapy-navy">Clients</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="lg:hidden p-1 rounded-md text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">{filteredClients.length} clients</p>
            </div>

            <div className="overflow-y-auto h-full">
              {loading ? (
                <div className="p-6 text-center text-gray-500">Loading...</div>
              ) : filteredClients.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No clients found</div>
              ) : (
                filteredClients.map((client) => {
                  const sessionCount = sessions.filter(s => s.client_id === client.id).length
                  const lastSession = sessions
                    .filter(s => s.client_id === client.id)
                    .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime())[0]

                  return (
                    <button
                      key={client.id}
                      onClick={() => {
                        setSelectedClientId(client.id)
                        setSidebarOpen(false)
                      }}
                      className={`w-full p-4 text-left border-b border-gray-100 transition-colors hover:bg-gray-50 ${
                        selectedClientId === client.id
                          ? 'bg-therapy-blue bg-opacity-20 border-r-4 border-therapy-coral'
                          : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-therapy-coral rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-white">
                            {client.full_name
                              ?.split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2) || '??'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-therapy-navy truncate">{client.full_name}</p>
                          <p className="text-xs text-gray-500">
                            {sessionCount} session{sessionCount !== 1 ? 's' : ''}
                          </p>
                          {lastSession && (
                            <p className="text-xs text-gray-400">
                              Last: {formatDate(lastSession.session_date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-10"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-gray-500">Loading sessions...</div>
            ) : clientSessions.length === 0 ? (
              <div className="flex items-center justify-center h-[calc(100vh-180px)]">
                <div className="text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  <h3 className="text-xl font-medium text-gray-900 mb-2">
                    {selectedClient ? 'No Sessions Yet' : 'Select a Client'}
                  </h3>
                  <p className="text-gray-600">
                    {selectedClient
                      ? `No sessions recorded for ${selectedClient.full_name} yet.`
                      : 'Choose a client from sidebar to view their session history.'
                    }
                  </p>
                </div>
              </div>
            ) : (
              <div className={
                viewMode === 'cards'
                  ? 'grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6'
                  : 'space-y-4'
              }>
                {clientSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow ${
                      viewMode === 'list' ? 'p-4' : 'p-6'
                    }`}
                  >
                    <div className={`flex ${viewMode === 'list' ? 'items-center justify-between' : 'flex-col'}`}>
                      <div className={viewMode === 'list' ? 'flex-1' : ''}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-therapy-navy">
                              {formatDate(session.session_date)}
                            </span>
                            <span className="text-sm text-gray-500">
                              {formatTime(session.session_date)}
                            </span>
                          </div>
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-therapy-blue bg-opacity-20 text-therapy-blue">
                            {session.session_type}
                          </span>
                        </div>

                        <p className="text-sm text-gray-600 mb-3 overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          maxHeight: '2.5rem'
                        }}>
                          {session.summary || session.notes || 'No notes available'}
                        </p>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-gray-500">
                            Duration: {session.duration_minutes} min
                          </span>
                        </div>
                      </div>

                      <div className={`flex ${viewMode === 'list' ? 'ml-4 space-x-2' : 'space-x-2 pt-3 border-t border-gray-100'}`}>
                        <Link
                          href={`/session-analysis?session=${session.id}`}
                          className="p-2 text-gray-600 hover:text-therapy-coral hover:bg-gray-50 rounded-lg transition-colors"
                          title="View Session"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
