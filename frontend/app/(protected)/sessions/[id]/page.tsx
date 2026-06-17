'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useParams } from 'next/navigation'
import { apiClient, type Session, type Client } from '@/lib/api'
import SessionEditor from '@/components/SessionEditor'

export default function SessionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params.id as string

  const [session, setSession] = useState<Session | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const s = await apiClient.getSession(sessionId)
      setSession(s)
      apiClient.getClient(s.client_id).then(setClient).catch(() => {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useEffect(() => { load() }, [load])

  const handleDelete = async () => {
    if (!confirm('Delete this session? This cannot be undone.')) return
    await apiClient.deleteSession(sessionId)
    router.push(client ? `/clients/${client.id}` : '/sessions')
  }

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>
  if (error && !session) return <div className="p-8 text-red-700">{error}</div>
  if (!session) return null

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center gap-3">
          <Link href={client ? `/clients/${client.id}` : '/sessions'} className="text-gray-400 hover:text-therapy-navy">←</Link>
          <div>
            <h1 className="text-2xl font-bold text-therapy-navy">
              Session · {new Date(session.session_date).toLocaleDateString()}
            </h1>
            {client && <p className="text-gray-600 text-sm">{client.name}</p>}
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <SessionEditor
          initial={session}
          onSaved={(s) => { setSession(s); }}
          onDelete={handleDelete}
        />
      </main>
    </div>
  )
}
