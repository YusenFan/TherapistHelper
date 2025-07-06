import Link from 'next/link'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/">
              <h1 className="text-xl font-semibold text-therapy-navy cursor-pointer">
                Therapist Helper AI
              </h1>
            </Link>
          </div>
          
          <nav className="flex space-x-8">
            <Link 
              href="/" 
              className="text-therapy-navy hover:text-therapy-coral transition-colors font-medium"
            >
              Dashboard
            </Link>
            <Link 
              href="/clients" 
              className="text-therapy-navy hover:text-therapy-coral transition-colors font-medium"
            >
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
  )
} 