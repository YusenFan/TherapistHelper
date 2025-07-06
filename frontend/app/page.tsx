import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-therapy-gray">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-therapy-navy">
                Therapist Helper AI
              </h1>
            </div>
            <nav className="flex space-x-8">
              <Link href="/" className="text-therapy-navy hover:text-therapy-coral transition-colors">
                Dashboard
              </Link>
              <Link href="/clients" className="text-therapy-navy hover:text-therapy-coral transition-colors">
                Clients
              </Link>
            </nav>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-therapy-blue rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-therapy-navy">DR</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-2xl font-semibold text-therapy-navy mb-6">Welcome to Therapist Helper AI</h2>
          <p className="text-gray-600 mb-8">
            Your AI-powered session assistant to enhance client engagement and streamline documentation.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link href="/session-analysis" className="bg-therapy-blue bg-opacity-20 p-6 rounded-lg border border-therapy-blue hover:bg-opacity-30 transition-all">
              <h3 className="text-lg font-medium text-therapy-navy mb-2">Session Analysis</h3>
              <p className="text-gray-600">View detailed analysis of your therapy sessions with AI-generated insights.</p>
            </Link>
            
            <div className="bg-therapy-green bg-opacity-20 p-6 rounded-lg border border-therapy-green">
              <h3 className="text-lg font-medium text-therapy-navy mb-2">Client Management</h3>
              <p className="text-gray-600">Manage your client database and session history.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 