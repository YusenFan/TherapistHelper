'use client'

import { useState, useMemo } from 'react'

// Types for session data
interface SessionData {
  id: number
  clientId: number
  date: string
  time: string
  duration: string
  summary: string
  status: 'completed' | 'in-progress' | 'missing-info' | 'flagged'
  tags: string[]
  transcript?: string
  notes?: string
}

interface ClientData {
  id: number
  name: string
  initials: string
  sessionCount: number
  lastSession: string
  avatar?: string
}

// Mock data for demonstration
const mockClients: ClientData[] = [
  {
    id: 1,
    name: "Emily Chen",
    initials: "EC",
    sessionCount: 12,
    lastSession: "2025-01-15"
  },
  {
    id: 2,
    name: "Michael Rodriguez",
    initials: "MR",
    sessionCount: 8,
    lastSession: "2025-01-14"
  },
  {
    id: 3,
    name: "Sarah Johnson",
    initials: "SJ",
    sessionCount: 15,
    lastSession: "2025-01-13"
  },
  {
    id: 4,
    name: "David Park",
    initials: "DP",
    sessionCount: 6,
    lastSession: "2025-01-12"
  },
  {
    id: 5,
    name: "Anna Williams",
    initials: "AW",
    sessionCount: 10,
    lastSession: "2025-01-11"
  },
  {
    id: 6,
    name: "Robert Thompson",
    initials: "RT",
    sessionCount: 4,
    lastSession: "2025-01-10"
  }
]

const mockSessions: SessionData[] = [
  // Emily Chen sessions
  {
    id: 1,
    clientId: 1,
    date: "2025-01-15",
    time: "10:00 AM",
    duration: "50 min",
    summary: "Discussed anxiety management techniques and workplace stress. Client reported significant improvement in sleep patterns.",
    status: "completed",
    tags: ["Anxiety", "Work Stress", "Sleep Issues"]
  },
  {
    id: 2,
    clientId: 1,
    date: "2025-01-08",
    time: "10:00 AM",
    duration: "50 min",
    summary: "Cognitive behavioral therapy session focusing on thought pattern recognition. Homework review showed good progress.",
    status: "completed",
    tags: ["CBT", "Thought Patterns", "Progress"]
  },
  {
    id: 3,
    clientId: 1,
    date: "2025-01-01",
    time: "10:00 AM",
    duration: "50 min",
    summary: "New Year goal setting session. Client expressed motivation to continue therapy and implement coping strategies.",
    status: "missing-info",
    tags: ["Goal Setting", "Motivation"]
  },
  // Michael Rodriguez sessions
  {
    id: 4,
    clientId: 2,
    date: "2025-01-14",
    time: "2:00 PM",
    duration: "45 min",
    summary: "PTSD therapy session with EMDR techniques. Client showed reduced distress when discussing traumatic memories.",
    status: "completed",
    tags: ["PTSD", "EMDR", "Trauma"]
  },
  {
    id: 5,
    clientId: 2,
    date: "2025-01-07",
    time: "2:00 PM",
    duration: "45 min",
    summary: "Grounding techniques practice. Client successfully used 5-4-3-2-1 method during anxiety episode this week.",
    status: "flagged",
    tags: ["Grounding", "Anxiety", "Crisis Management"]
  },
  // Sarah Johnson sessions
  {
    id: 6,
    clientId: 3,
    date: "2025-01-13",
    time: "3:30 PM",
    duration: "60 min",
    summary: "Family therapy session discussing boundary setting with teenagers. Made significant progress on communication strategies.",
    status: "completed",
    tags: ["Family Therapy", "Boundaries", "Communication"]
  },
  {
    id: 7,
    clientId: 3,
    date: "2025-01-06",
    time: "3:30 PM",
    duration: "60 min",
    summary: "Individual session on parental stress and self-care. Client committed to weekly self-care activities.",
    status: "in-progress",
    tags: ["Parental Stress", "Self-Care"]
  },
  // David Park sessions
  {
    id: 8,
    clientId: 4,
    date: "2025-01-12",
    time: "11:00 AM",
    duration: "50 min",
    summary: "Depression treatment using mindfulness-based cognitive therapy. Client showed improved mood regulation.",
    status: "completed",
    tags: ["Depression", "Mindfulness", "MBCT"]
  },
  // Anna Williams sessions
  {
    id: 9,
    clientId: 5,
    date: "2025-01-11",
    time: "4:00 PM",
    duration: "50 min",
    summary: "Addiction recovery support session. Client celebrated 90 days sober and discussed relapse prevention strategies.",
    status: "completed",
    tags: ["Addiction Recovery", "Sobriety", "Relapse Prevention"]
  },
  // Robert Thompson sessions
  {
    id: 10,
    clientId: 6,
    date: "2025-01-10",
    time: "9:00 AM",
    duration: "50 min",
    summary: "Initial assessment for relationship counseling. Identified key areas for improvement in communication patterns.",
    status: "missing-info",
    tags: ["Initial Assessment", "Relationship", "Communication"]
  }
]

export default function SessionsPage() {
  const [selectedClientId, setSelectedClientId] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Filter clients based on search
  const filteredClients = useMemo(() => {
    return mockClients.filter(client =>
      client.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [searchQuery])

  // Get sessions for selected client
  const clientSessions = useMemo(() => {
    if (!selectedClientId) return []
    
    let sessions = mockSessions.filter(session => session.clientId === selectedClientId)
    
    // Apply status filter
    if (statusFilter !== 'all') {
      sessions = sessions.filter(session => session.status === statusFilter)
    }
    
    // Apply date filter
    if (dateRange !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateRange) {
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3)
          break
      }
      
      sessions = sessions.filter(session => new Date(session.date) >= filterDate)
    }
    
    // Apply tag filter
    if (tagFilter !== 'all') {
      sessions = sessions.filter(session => 
        session.tags.some(tag => tag.toLowerCase().includes(tagFilter.toLowerCase()))
      )
    }
    
    // Sort by date (newest first)
    return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [selectedClientId, statusFilter, dateRange, tagFilter])

  // Get all unique tags for filter dropdown
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    mockSessions.forEach(session => {
      session.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getStatusColor = (status: SessionData['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'missing-info':
        return 'bg-yellow-100 text-yellow-800'
      case 'flagged':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: SessionData['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in-progress':
        return 'In Progress'
      case 'missing-info':
        return 'Missing Info'
      case 'flagged':
        return 'Flagged'
      default:
        return status
    }
  }

  const selectedClient = selectedClientId ? mockClients.find(c => c.id === selectedClientId) : null

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
                    ? `${selectedClient.name} - ${clientSessions.length} sessions`
                    : 'Select a client to view session history'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search clients, sessions, or keywords..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                </svg>
              </button>
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
              {filteredClients.map((client) => (
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
                      <span className="text-sm font-medium text-white">{client.initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-therapy-navy truncate">{client.name}</p>
                      <p className="text-xs text-gray-500">
                        {client.sessionCount} sessions
                      </p>
                      <p className="text-xs text-gray-400">
                        Last: {formatDate(client.lastSession)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
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
          {selectedClient ? (
            <>
              {/* Filters Bar */}
              <div className="bg-white border-b border-gray-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-therapy-coral focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="completed">Completed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="missing-info">Missing Info</option>
                      <option value="flagged">Flagged</option>
                    </select>

                    {/* Date Range Filter */}
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-therapy-coral focus:border-transparent"
                    >
                      <option value="all">All Time</option>
                      <option value="week">Past Week</option>
                      <option value="month">Past Month</option>
                      <option value="quarter">Past Quarter</option>
                    </select>

                    {/* Tag Filter */}
                    <select
                      value={tagFilter}
                      onChange={(e) => setTagFilter(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-therapy-coral focus:border-transparent"
                    >
                      <option value="all">All Tags</option>
                      {allTags.map(tag => (
                        <option key={tag} value={tag}>{tag}</option>
                      ))}
                    </select>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">View:</span>
                    <button
                      onClick={() => setViewMode('cards')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'cards' 
                          ? 'bg-therapy-coral text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-lg transition-colors ${
                        viewMode === 'list' 
                          ? 'bg-therapy-coral text-white' 
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sessions Content */}
              <div className="p-6">
                {clientSessions.length > 0 ? (
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
                                  {formatDate(session.date)}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {session.time}
                                </span>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
                                {getStatusText(session.status)}
                              </span>
                            </div>
                            
                                                         <p className="text-sm text-gray-600 mb-3 overflow-hidden" style={{
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical',
                               maxHeight: '2.5rem'
                             }}>
                               {session.summary}
                             </p>
                            
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-gray-500">
                                Duration: {session.duration}
                              </span>
                            </div>
                            
                            {session.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-3">
                                {session.tags.map((tag, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-therapy-blue bg-opacity-20 text-therapy-navy rounded-full text-xs"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className={`flex ${viewMode === 'list' ? 'ml-4 space-x-2' : 'space-x-2 pt-3 border-t border-gray-100'}`}>
                            <button className="p-2 text-gray-600 hover:text-therapy-coral hover:bg-gray-50 rounded-lg transition-colors" title="View Transcript">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button className="p-2 text-gray-600 hover:text-therapy-coral hover:bg-gray-50 rounded-lg transition-colors" title="Edit Notes">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button className="p-2 text-gray-600 hover:text-therapy-coral hover:bg-gray-50 rounded-lg transition-colors" title="Download Summary">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </button>
                            <button className="p-2 text-gray-600 hover:text-therapy-coral hover:bg-gray-50 rounded-lg transition-colors" title="Open in Template">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No sessions found</h3>
                    <p className="text-gray-600">
                      {statusFilter !== 'all' || dateRange !== 'all' || tagFilter !== 'all' 
                        ? 'Try adjusting your filters to see more sessions.'
                        : `No sessions recorded for ${selectedClient.name} yet.`
                      }
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[calc(100vh-180px)]">
              <div className="text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <h3 className="text-xl font-medium text-gray-900 mb-2">Select a Client</h3>
                <p className="text-gray-600">
                  Choose a client from the sidebar to view their session history and records.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 