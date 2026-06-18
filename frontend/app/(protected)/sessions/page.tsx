'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GoogleCalendar from '@/components/GoogleCalendar'
import WriteDictateModal from '@/components/WriteDictateModal'
import UploadAudioModal from '@/components/UploadAudioModal'

export default function DashboardPage() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)

  const handleWriteDictate = () => setModalOpen(true)

  const handleContinue = (params: URLSearchParams) => {
    setModalOpen(false)
    const qs = params.toString()
    router.push(qs ? `/sessions/new?${qs}` : '/sessions/new')
  }

  const handleUpload = () => setUploadOpen(true)

  const handleUploadContinue = (params: URLSearchParams, transcript: string) => {
    setUploadOpen(false)
    try {
      sessionStorage.setItem('pendingTranscript', transcript)
    } catch {}
    const qs = params.toString()
    router.push(qs ? `/sessions/new?${qs}` : '/sessions/new')
  }

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-therapy-navy">Dashboard</h1>
          <p className="text-gray-600 mt-1">Start a new note or review your schedule.</p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={handleWriteDictate}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-4 bg-therapy-coral text-white rounded-xl font-medium hover:bg-opacity-90 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            Write / Dictate
          </button>

          <button
            type="button"
            onClick={handleUpload}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-4 bg-white text-therapy-navy border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload
          </button>
        </div>

        <GoogleCalendar />
      </main>

      <WriteDictateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onContinue={handleContinue}
      />

      <UploadAudioModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onContinue={handleUploadContinue}
      />
    </div>
  )
}
