'use client'

import { Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import SessionEditor from '@/components/SessionEditor'
import { type Session } from '@/lib/api'

function NewSessionInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const clientId = searchParams.get('client_id') || undefined

  const handleSaved = (s: Session) => router.push(`/sessions/${s.id}`)

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-therapy-navy">New Session</h1>
        </div>
      </div>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <SessionEditor fixedClientId={clientId} onSaved={handleSaved} />
      </main>
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
