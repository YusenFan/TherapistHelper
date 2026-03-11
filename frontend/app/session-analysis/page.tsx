'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import TranscriptPanel from '@/components/session-analysis/TranscriptPanel'
import SummaryPanel from '@/components/session-analysis/SummaryPanel'
import HelperPanel from '@/components/session-analysis/HelperPanel'
import { apiClient, Session, ClientListItem } from '@/lib/api'

export default function SessionAnalysis() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session')

  const [session, setSession] = useState<Session | null>(null)
  const [client, setClient] = useState<ClientListItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        setError('No session ID provided')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        const sessionData = await apiClient.getSession(sessionId)
        setSession(sessionData)

        if (sessionData?.client_id) {
          const clientInfo = await apiClient.getClient(sessionData.client_id)
          setClient(clientInfo)
        }

        if (sessionData?.client_id) {
          const clientInfo = await apiClient.getClient(sessionData.client_id)
          setClient(clientInfo)
        }
      } catch (err) {
        console.error('Error fetching session:', err)
        setError('Failed to load session data')
      } finally {
        setLoading(false)
      }
    }

    fetchSession()
  }, [sessionId])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // Parse transcript from session
  const transcript = session?.transcript
    ? JSON.parse(session.transcript)
    : []

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading session data...</div>
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Session not found'}
          </h2>
          <p className="text-gray-600 mb-4">
            The session you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Session Sub-Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-therapy-navy">
                {client?.full_name || 'Unknown Client'}
              </h1>
              <p className="text-gray-600 mt-1 text-lg">
                Session: {formatDate(session.session_date)}
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="px-6 py-3 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium">
                Export Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Three-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-240px)]">
          {/* Left Column - Transcript */}
          <div className="lg:col-span-1">
            <TranscriptPanel transcript={transcript} />
          </div>

          {/* Center Column - AI Summary & Insights */}
          <div className="lg:col-span-1">
            <SummaryPanel
              summary={session.summary || 'No summary available'}
              keyThemes={session.analysis?.themes as string[] || []}
              actionableInsights={session.analysis?.insights as string[] || []}
            />
          </div>

          {/* Right Column - Session Helper */}
          <div className="lg:col-span-1">
            <HelperPanel
              suggestedQuestions={session.analysis?.questions as string[] || []}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
