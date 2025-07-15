import Link from 'next/link'

// Mock data for demonstration
const clients = [
  {
    id: 1,
    name: "John Doe",
    age: 34,
    gender: "Male",
    occupation: "Software Engineer",
    lastSession: "July 5, 2025",
    totalSessions: 8,
    status: "Active",
    riskLevel: "Low",
    photo: "JD"
  },
  {
    id: 2,
    name: "Sarah Johnson",
    age: 28,
    gender: "Female", 
    occupation: "Teacher",
    lastSession: "July 4, 2025",
    totalSessions: 12,
    status: "Active",
    riskLevel: "Medium",
    photo: "SJ"
  },
  {
    id: 3,
    name: "Michael Chen",
    age: 42,
    gender: "Male",
    occupation: "Marketing Director",
    lastSession: "July 3, 2025",
    totalSessions: 3,
    status: "New",
    riskLevel: "Low",
    photo: "MC"
  },
  {
    id: 4,
    name: "Emily Rodriguez",
    age: 31,
    gender: "Female",
    occupation: "Nurse",
    lastSession: "June 28, 2025",
    totalSessions: 15,
    status: "Active",
    riskLevel: "High",
    photo: "ER"
  }
]

export default function ClientsPage() {
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-therapy-navy">Client Database</h1>
              <p className="text-gray-600 mt-1 text-lg">Manage your client profiles and session history</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="w-80 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Link 
                href="/clients/new"
                className="px-6 py-3 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>New Client</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-therapy-blue bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-therapy-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-therapy-navy">{clients.length}</p>
                <p className="text-gray-600 text-sm">Total Clients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-therapy-green bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-therapy-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-therapy-navy">{clients.filter(c => c.status === 'Active').length}</p>
                <p className="text-gray-600 text-sm">Active Cases</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-therapy-coral bg-opacity-20 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-therapy-coral" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-therapy-navy">{clients.filter(c => c.status === 'New').length}</p>
                <p className="text-gray-600 text-sm">New Clients</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-therapy-navy">{clients.filter(c => c.riskLevel === 'High').length}</p>
                <p className="text-gray-600 text-sm">High Risk</p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-therapy-coral rounded-full flex items-center justify-center mr-3">
                    <span className="text-white font-medium">{client.photo}</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-therapy-navy">{client.name}</h3>
                    <p className="text-gray-600 text-sm">{client.age} years • {client.gender}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  client.status === 'Active' 
                    ? 'bg-therapy-green bg-opacity-20 text-therapy-green'
                    : client.status === 'New'
                    ? 'bg-therapy-blue bg-opacity-20 text-therapy-blue'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {client.status}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Occupation:</span>
                  <span className="text-therapy-navy font-medium">{client.occupation}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Last Session:</span>
                  <span className="text-therapy-navy font-medium">{client.lastSession}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Sessions:</span>
                  <span className="text-therapy-navy font-medium">{client.totalSessions}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Risk Level:</span>
                  <span className={`font-medium ${
                    client.riskLevel === 'High' 
                      ? 'text-red-600'
                      : client.riskLevel === 'Medium'
                      ? 'text-yellow-600'
                      : 'text-therapy-green'
                  }`}>
                    {client.riskLevel}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Link 
                  href={`/clients/${client.id}`}
                  className="flex-1 px-4 py-2 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium text-center"
                >
                  View Profile
                </Link>
                <Link 
                  href={`/clients/${client.id}/edit`}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-center"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
} 