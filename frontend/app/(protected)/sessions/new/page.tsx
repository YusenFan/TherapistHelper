'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import SessionEditor from '@/components/SessionEditor'
import SyncEHRModal from '@/components/SyncEHRModal'
import { apiClient, type Client, type Session } from '@/lib/api'

function NewSessionInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client_id') || undefined
  const template = searchParams.get('template') || undefined
  const date = searchParams.get('date') || undefined
  const time = searchParams.get('time') || undefined
  const durationParam = searchParams.get('duration')
  const duration = durationParam ? Number(durationParam) : undefined

  const [client, setClient] = useState<Client | null>(null)
  const [savedSession, setSavedSession] = useState<Session | null>(null)
  const [defaultEhr, setDefaultEhr] = useState<string | null>(null)
  const [initialSummary] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    try {
      const pending = sessionStorage.getItem('pendingTranscript')
      if (pending) {
        sessionStorage.removeItem('pendingTranscript')
        return pending
      }
    } catch {}
    return undefined
  })

  useEffect(() => {
    if (!clientId) return
    apiClient.getClient(clientId).then(setClient).catch(() => {})
  }, [clientId])

  useEffect(() => {
    apiClient.getUserSettings()
      .then(s => setDefaultEhr(s.default_ehr ?? 'therapynotes'))
      .catch(() => setDefaultEhr('therapynotes'))
  }, [])

  const handleSaved = (s: Session) => setSavedSession(s)

  const handleModalClose = () => {
    const id = savedSession?.id
    setSavedSession(null)
    if (id) router.push(`/sessions/${id}`)
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <Link href="/sessions" className="text-gray-400 hover:text-therapy-navy text-lg">←</Link>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/sessions" className="text-gray-500 hover:text-therapy-navy">Dashboard</Link>
            <span className="text-gray-300">/</span>
            <span className="text-therapy-navy font-medium">New session</span>
            {client && <>
              <span className="text-gray-300">/</span>
              <span className="text-gray-500">{client.name}</span>
            </>}
          </div>
        </div>
      </div>
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <SessionEditor
          fixedClientId={clientId}
          initialFormat={template}
          initialDate={date}
          initialTime={time}
          initialDuration={duration}
          initialSummary={initialSummary}
          onSaved={handleSaved}
        />
      </main>

      <SyncEHRModal
        open={!!savedSession}
        ehr={defaultEhr}
        onClose={handleModalClose}
      />
    </div>
  )
}

export default function NewSessionPage() {
  return (
    <Suspense fallback={<div className="p-8 text-gray-500">Loading…</div>}>
      <NewSessionInner />
    </Suspense>
  )
}
