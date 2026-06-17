'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { apiClient, type Session, type Client } from '@/lib/api'
import { formatLabel } from '@/lib/noteFormats'

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [clientsById, setClientsById] = useState<Record<string, Client>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([apiClient.getSessions(), apiClient.getClients()])
      .then(([s, c]) => {
        setSessions(s)
        setClientsById(Object.fromEntries(c.map(x => [x.id, x])))
      })
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load sessions'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-therapy-navy">Sessions</h1>
            <p className="text-gray-600 mt-1">All session notes across your clients</p>
          </div>
          <Link href="/sessions/new" className="px-5 py-2.5 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 font-medium">
            + New Session
          </Link>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading && <p className="text-gray-500">Loading…</p>}
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

        {!loading && !error && sessions.length === 0 && (
          <p className="text-gray-500">No sessions yet.</p>
        )}

        {!loading && !error && sessions.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 divide-y">
            {sessions.map(s => (
              <Link key={s.id} href={`/sessions/${s.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                <div className="min-w-0">
                  <p className="font-medium text-therapy-navy">
                    {clientsById[s.client_id]?.name ?? 'Unknown client'}
                    <span className="text-gray-400 font-normal"> · {new Date(s.session_date).toLocaleDateString()}</span>
                  </p>
                  <p className="text-sm text-gray-500 truncate max-w-xl">{s.summary || 'No summary'}</p>
                </div>
                <span className="text-xs font-medium text-gray-400 flex-shrink-0 ml-4">{formatLabel(s.note_format)}</span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
