'use client'

import { useState } from 'react'
import Link from 'next/link'

// Mock data - in real app this would come from API based on params.id
const clientData = {
  id: 1,
  name: "John Doe",
  age: 34,
  gender: "Male",
  occupation: "Software Engineer",
  phone: "(555) 123-4567",
  email: "john.doe@email.com",
  emergencyContact: "Jane Doe (Wife) - (555) 987-6543",
  insuranceProvider: "Blue Cross Blue Shield",
  policyNumber: "BC123456789",
  status: "Active",
  riskLevel: "Low",
  startDate: "March 15, 2025",
  lastSession: "July 5, 2025",
  totalSessions: 8,
  photo: "JD",
  
  // AI-Generated Background
  aiBackground: {
    keyTraits: ["High achiever", "Perfectionist tendencies", "Strong family support", "Career-focused"],
    riskFactors: ["Work-related stress", "Difficulty setting boundaries", "Mild anxiety patterns"],
    goals: ["Improve work-life balance", "Develop stress management skills", "Strengthen family relationships"],
    therapeuticApproach: "Cognitive Behavioral Therapy (CBT) with mindfulness techniques"
  },
  
  // Session History
  sessions: [
    {
      id: 8,
      date: "July 5, 2025",
      duration: "50 min",
      type: "Regular Session",
      summary: "Discussed work stress and family relationships. Client reported improved boundary-setting with manager.",
      mood: "Improving",
      nextGoals: ["Practice saying no to extra projects", "Schedule family time"]
    },
    {
      id: 7,
      date: "June 28, 2025", 
      duration: "50 min",
      type: "Regular Session",
      summary: "Continued work on stress management techniques. Client completed homework assignments successfully.",
      mood: "Stable",
      nextGoals: ["Apply breathing techniques at work", "Use boundary-setting scripts"]
    },
    {
      id: 6,
      date: "June 21, 2025",
      duration: "45 min", 
      type: "Regular Session",
      summary: "Introduced mindfulness exercises for workplace stress. Client engaged well with techniques.",
      mood: "Receptive",
      nextGoals: ["Daily 10-minute mindfulness practice", "Identify stress triggers"]
    }
  ]
}

interface ClientProfileProps {
  params: {
    id: string
  }
}

export default function ClientProfile({ params }: ClientProfileProps) {
  const [activeTab, setActiveTab] = useState('overview')

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
                  <span className="text-white text-xl font-medium">{clientData.photo}</span>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-therapy-navy">{clientData.name}</h1>
                  <div className="flex items-center space-x-4 mt-1">
                    <span className="text-gray-600">{clientData.age} years • {clientData.gender}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      clientData.status === 'Active' 
                        ? 'bg-therapy-green bg-opacity-20 text-therapy-green'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {clientData.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      clientData.riskLevel === 'High' 
                        ? 'bg-red-100 text-red-600'
                        : clientData.riskLevel === 'Medium'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-therapy-green bg-opacity-20 text-therapy-green'
                    }`}>
                      {clientData.riskLevel} Risk
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="px-6 py-3 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium">
                Schedule Session
              </button>
              <button className="px-6 py-3 border border-therapy-blue text-therapy-navy rounded-lg hover:bg-therapy-blue hover:bg-opacity-10 transition-colors font-medium">
                Generate Agenda
              </button>
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
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Occupation</label>
                    <p className="text-therapy-navy">{clientData.occupation}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-therapy-navy">{clientData.phone}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-therapy-navy">{clientData.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Emergency Contact</label>
                    <p className="text-therapy-navy">{clientData.emergencyContact}</p>
                  </div>
                  
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Insurance Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Provider</label>
                    <p className="text-therapy-navy">{clientData.insuranceProvider}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Policy Number</label>
                    <p className="text-therapy-navy">{clientData.policyNumber}</p>
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
                    <span className="text-therapy-navy font-medium">{clientData.startDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Session</span>
                    <span className="text-therapy-navy font-medium">{clientData.lastSession}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Sessions</span>
                    <span className="text-therapy-navy font-medium">{clientData.totalSessions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Current Status</span>
                    <span className="text-therapy-navy font-medium">{clientData.status}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Goals & Progress</h3>
                <div className="space-y-3">
                  {clientData.aiBackground.goals.map((goal, index) => (
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
          <div className="space-y-6">
            {clientData.sessions.map((session) => (
              <div key={session.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center space-x-4 mb-2">
                      <h3 className="text-lg font-semibold text-therapy-navy">Session #{session.id}</h3>
                      <span className="text-gray-500">{session.date}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-500">{session.duration}</span>
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
                    <p className="text-gray-600 leading-relaxed mb-4">{session.summary}</p>
                    {session.nextGoals.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-therapy-navy mb-2">Next Session Goals:</h4>
                        <ul className="space-y-1">
                          {session.nextGoals.map((goal, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <div className="w-1.5 h-1.5 bg-therapy-coral rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-600">{goal}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Link 
                      href={`/session-analysis?session=${session.id}`}
                      className="px-4 py-2 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
                    >
                      View Analysis
                    </Link>
                    <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                      Export Notes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'insights' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Key Traits</h3>
                <div className="flex flex-wrap gap-2">
                  {clientData.aiBackground.keyTraits.map((trait, index) => (
                    <span key={index} className="px-3 py-2 bg-therapy-blue bg-opacity-20 text-therapy-navy rounded-full text-sm font-medium">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Risk Factors</h3>
                <div className="space-y-3">
                  {clientData.aiBackground.riskFactors.map((factor, index) => (
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
                  {clientData.aiBackground.goals.map((goal, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-therapy-green rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-therapy-navy text-sm">{goal}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-therapy-navy mb-4">Therapeutic Approach</h3>
                <p className="text-therapy-navy leading-relaxed">{clientData.aiBackground.therapeuticApproach}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'edit' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-therapy-navy mb-6">Edit Profile</h3>
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <p>Profile editing form will be implemented here</p>
              <p className="text-sm mt-2">This would include all the fields from the overview section in an editable form</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 