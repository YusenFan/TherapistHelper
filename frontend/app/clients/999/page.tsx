'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

// Mock data for the newly created client
const newClientData = {
  id: 999,
  name: "New Client",
  age: 0,
  gender: "Not specified",
  occupation: "To be determined",
  phone: "To be added",
  email: "To be added",
  emergencyContact: "To be added",
  insuranceProvider: "To be determined",
  policyNumber: "To be assigned",
  status: "New",
  riskLevel: "To be assessed",
  startDate: new Date().toLocaleDateString(),
  lastSession: "Not yet scheduled",
  totalSessions: 0,
  photo: "NC",
  
  // AI-Generated Background
  aiBackground: {
    keyTraits: ["New client", "Assessment pending"],
    riskFactors: ["To be evaluated during intake"],
    goals: ["Complete initial assessment", "Establish treatment goals"],
    therapeuticApproach: "To be determined based on initial consultation"
  },
  
  // Session History
  sessions: []
}

export default function NewClientProfile() {
  const [activeTab, setActiveTab] = useState('overview')
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (searchParams.get('created') === 'true') {
      setShowSuccessMessage(true)
      // Hide success message after 5 seconds
      const timer = setTimeout(() => setShowSuccessMessage(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const tabs = [
    { id: 'overview', name: 'Overview', icon: 'overview' },
    { id: 'sessions', name: 'Sessions', icon: 'sessions' },
    { id: 'insights', name: 'AI Insights', icon: 'insights' },
    { id: 'edit', name: 'Edit Profile', icon: 'edit' }
  ]

  const getTabIcon = (iconName: string) => {
    switch (iconName) {
      case 'overview':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        )
      case 'sessions':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        )
      case 'insights':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        )
      case 'edit':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-therapy-green bg-opacity-20 border border-therapy-green rounded-lg p-4 shadow-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-therapy-green mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-therapy-green font-medium">Client profile created successfully!</p>
          </div>
        </div>
      )}

      {/* Client Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link 
                href="/clients"
                className="text-therapy-coral hover:text-therapy-coral-dark transition-colors"
              >
                ← Back to Clients
              </Link>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-therapy-coral rounded-full flex items-center justify-center">
                  <span className="text-white text-xl font-medium">{newClientData.photo}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-therapy-navy">{newClientData.name}</h1>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-gray-600">{newClientData.age} years • {newClientData.gender}</span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-therapy-blue bg-opacity-20 text-therapy-blue">
                      {newClientData.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      {newClientData.riskLevel}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="px-6 py-3 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium">
                Schedule First Session
              </button>
              <Link 
                href="/clients/999/edit"
                className="px-6 py-3 border border-therapy-blue text-therapy-navy rounded-lg hover:bg-therapy-blue hover:bg-opacity-10 transition-colors font-medium"
              >
                Complete Profile
              </Link>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mt-6 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-therapy-coral text-therapy-coral'
                      : 'border-transparent text-gray-500 hover:text-therapy-navy hover:border-gray-300'
                  }`}
                >
                  {getTabIcon(tab.icon)}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Personal Information */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-therapy-navy">Personal Information</h3>
                  <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                    Incomplete Profile
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Occupation</label>
                    <p className="text-gray-400 italic">{newClientData.occupation}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-400 italic">{newClientData.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-400 italic">{newClientData.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                    <p className="text-gray-400 italic">{newClientData.emergencyContact}</p>
                  </div>
        
                </div>
                <div className="mt-6 p-4 bg-therapy-blue bg-opacity-10 rounded-lg">
                  <p className="text-therapy-navy text-sm">
                    👋 <strong>Welcome!</strong> This is a new client profile. Complete the remaining information to finish the setup.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Insurance Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Provider</label>
                    <p className="text-gray-400 italic">{newClientData.insuranceProvider}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Policy Number</label>
                    <p className="text-gray-400 italic">{newClientData.policyNumber}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Treatment Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date</span>
                    <span className="text-therapy-navy font-medium">{newClientData.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Session</span>
                    <span className="text-gray-400 italic">{newClientData.lastSession}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Sessions</span>
                    <span className="text-therapy-navy font-medium">{newClientData.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Status</span>
                    <span className="text-therapy-navy font-medium">{newClientData.status}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Next Steps</h3>
                <div className="space-y-3">
                  {newClientData.aiBackground.goals.map((goal, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-therapy-coral rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-therapy-navy text-sm">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <h3 className="text-lg font-semibold text-therapy-navy mb-2">No Sessions Yet</h3>
            <p className="text-gray-600 mb-4">This client hasn't had any therapy sessions yet.</p>
            <button className="px-6 py-3 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium">
              Schedule First Session
            </button>
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Key Traits</h3>
                <div className="flex flex-wrap gap-2">
                  {newClientData.aiBackground.keyTraits.map((trait, index) => (
                    <span key={index} className="px-3 py-2 bg-therapy-blue bg-opacity-20 text-therapy-navy rounded-full text-sm font-medium">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Risk Factors</h3>
                <div className="space-y-3">
                  {newClientData.aiBackground.riskFactors.map((factor, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-therapy-navy text-sm">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Treatment Goals</h3>
                <div className="space-y-3">
                  {newClientData.aiBackground.goals.map((goal, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-therapy-green rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-therapy-navy text-sm">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Therapeutic Approach</h3>
                <p className="text-therapy-navy leading-relaxed">{newClientData.aiBackground.therapeuticApproach}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-therapy-navy mb-6">Complete Profile</h3>
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p>Complete profile editing form would be implemented here</p>
              <p className="text-sm mt-2">This would allow editing of all client information including contact details, insurance, and background notes</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 