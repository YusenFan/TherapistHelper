'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { apiClient, type Client } from '@/lib/api'
import { clientTypeLabel } from '@/lib/noteFormats'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')

  useEffect(() => {
    apiClient.getClients()
      .then(setClients)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load clients'))
      .finally(() => setLoading(false))
  }, [])

  const initials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

  const filtered = clients.filter(c =>
    c.name?.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold text-therapy-navy">Clients</h1>
            <p className="text-gray-600 mt-1">Manage your client profiles</p>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search clients…"
              className="w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent"
            />
            <Link href="/clients/new" className="px-5 py-2.5 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 font-medium">
              + New Client
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {loading && <p className="text-gray-500">Loading clients…</p>}
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-16">
            <h3 className="text-xl font-semibold text-therapy-navy mb-2">No clients yet</h3>
            <p className="text-gray-600 mb-6">Add your first client to get started.</p>
            <Link href="/clients/new" className="inline-flex px-6 py-3 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 font-medium">
              Add First Client
            </Link>
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow block">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-therapy-coral rounded-full flex items-center justify-center mr-3">
                      <span className="text-white font-medium">{initials(client.name || '?')}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-therapy-navy">{client.name}</h3>
                      <p className="text-gray-600 text-sm">
                        {[clientTypeLabel(client.client_type), client.pronouns].filter(Boolean).join(' · ')}
                      </p>
                    </div>
                  </div>
                  {client.high_risk && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">High risk</span>
                  )}
                </div>
                {client.primary_diagnosis && (
                  <p className="text-sm text-gray-500 truncate">{client.primary_diagnosis}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
