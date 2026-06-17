'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiClient, type ClientInput } from '@/lib/api'
import ClientForm from '@/components/ClientForm'

export default function NewClientPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: ClientInput) => {
    setSubmitting(true)
    setError(null)
    try {
      const client = await apiClient.createClient(data)
      router.push(`/clients/${client.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create client')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-therapy-navy">New Client</h1>
        </div>
      </div>
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 mb-4 max-w-2xl">{error}</div>}
        <ClientForm submitting={submitting} submitLabel="Create Client" onSubmit={handleSubmit} onCancel={() => router.push('/clients')} />
      </main>
    </div>
  )
}
