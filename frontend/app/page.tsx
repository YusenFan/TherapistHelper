import Link from 'next/link'

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
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-therapy-navy">Dashboard</h1>
              <p className="text-gray-600 mt-1 text-lg">Welcome back, Dr. Smith</p>
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
        {/* Quick Actions Cards */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-therapy-navy mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/clients/new" className="group">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-therapy-coral transition-all duration-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-therapy-coral bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-therapy-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-therapy-navy group-hover:text-therapy-coral transition-colors">New Client</h3>
                    <p className="text-gray-600 text-sm">Create a new client profile</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/upload" className="group">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-therapy-blue transition-all duration-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-therapy-blue bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-therapy-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-therapy-navy group-hover:text-therapy-blue transition-colors">Upload Transcript</h3>
                    <p className="text-gray-600 text-sm">Upload session recording</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/agenda" className="group">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:border-therapy-green transition-all duration-200">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-therapy-green bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-therapy-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-therapy-navy group-hover:text-therapy-green transition-colors">Next Session Agenda</h3>
                    <p className="text-gray-600 text-sm">AI-generated session prep</p>
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