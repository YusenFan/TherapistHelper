'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { apiClient, type Client, type Session, type ClientInput } from '@/lib/api'
import { clientTypeLabel, formatLabel } from '@/lib/noteFormats'
import ClientForm from '@/components/ClientForm'

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const clientId = params.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(searchParams.get('tab') === 'edit')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, s] = await Promise.all([
        apiClient.getClient(clientId),
        apiClient.getClientSessions(clientId).catch(() => []),
      ])
      setClient(c)
      setSessions(s)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load client')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => { load() }, [load])

  const handleUpdate = async (data: ClientInput) => {
    setSaving(true)
    try {
      const updated = await apiClient.updateClient(clientId, data)
      setClient(updated)
      setEditing(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to update client')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this client and all their sessions reference? This cannot be undone.')) return
    await apiClient.deleteClient(clientId)
    router.push('/clients')
  }

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>
  if (error && !client) return <div className="p-8 text-red-700">{error}</div>
  if (!client) return null

  const Field = ({ label, value }: { label: string; value?: React.ReactNode }) => (
    <div>
      <dt className="text-sm text-gray-500">{label}</dt>
      <dd className="text-therapy-navy mt-0.5">{value || '—'}</dd>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Link href="/clients" className="text-gray-400 hover:text-therapy-navy">←</Link>
            <h1 className="text-3xl font-bold text-therapy-navy">{client.name}</h1>
            {client.high_risk && <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">High risk</span>}
          </div>
          {!editing && (
            <div className="flex gap-2">
              <button onClick={() => setEditing(true)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">Edit</button>
              <button onClick={handleDelete} className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium">Delete</button>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

        {editing ? (
          <ClientForm initial={client} submitting={saving} submitLabel="Save Changes" onSubmit={handleUpdate} onCancel={() => setEditing(false)} />
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <Field label="Pronouns" value={client.pronouns} />
              <Field label="Date of birth" value={client.date_of_birth} />
              <Field label="Type" value={clientTypeLabel(client.client_type)} />
              <Field label="High risk" value={client.high_risk ? 'Yes' : 'No'} />
              <Field label="Primary diagnosis" value={client.primary_diagnosis} />
              <Field label="Other diagnoses" value={client.other_diagnoses?.length ? client.other_diagnoses.join(', ') : undefined} />
            </dl>
            {client.extra_info && (
              <div className="mt-5">
                <dt className="text-sm text-gray-500">Extra info</dt>
                <dd className="text-therapy-navy mt-0.5 whitespace-pre-wrap">{client.extra_info}</dd>
              </div>
            )}
          </div>
        )}

        {/* Sessions */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-therapy-navy">Sessions</h2>
            <Link href={`/sessions/new?client_id=${clientId}`} className="px-4 py-2 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 font-medium">
              + New Session
            </Link>
          </div>
          {sessions.length === 0 ? (
            <p className="text-gray-500">No sessions yet.</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 divide-y">
              {sessions.map(s => (
                <Link key={s.id} href={`/sessions/${s.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-therapy-navy">{new Date(s.session_date).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500 truncate max-w-md">{s.summary || 'No summary'}</p>
                  </div>
                  <span className="text-xs font-medium text-gray-400">{formatLabel(s.note_format)}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
