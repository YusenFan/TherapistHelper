'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import GoogleCalendar, { type CalendarSessionPreset } from '@/components/GoogleCalendar'
import WriteDictateModal from '@/components/WriteDictateModal'
import UploadAudioModal from '@/components/UploadAudioModal'

export default function DashboardPage() {
  const router = useRouter()
  const [modalOpen, setModalOpen] = useState(false)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [calendarPreset, setCalendarPreset] = useState<CalendarSessionPreset | null>(null)

  const handleWriteDictate = () => {
    setCalendarPreset(null)
    setModalOpen(true)
  }

  const handleContinue = (params: URLSearchParams) => {
    setModalOpen(false)
    setCalendarPreset(null)
    const qs = params.toString()
    router.push(qs ? `/sessions/new?${qs}` : '/sessions/new')
  }

  const handleUpload = () => {
    setCalendarPreset(null)
    setUploadOpen(true)
  }

  const handleUploadContinue = (params: URLSearchParams, transcript: string) => {
    setUploadOpen(false)
    setCalendarPreset(null)
    try {
      sessionStorage.setItem('pendingTranscript', transcript)
    } catch {}
    const qs = params.toString()
    router.push(qs ? `/sessions/new?${qs}` : '/sessions/new')
  }

  const paramsFromCalendarPreset = (preset: CalendarSessionPreset) => {
    const params = new URLSearchParams()
    if (preset.clientId) params.set('client_id', preset.clientId)
    if (preset.template) params.set('template', preset.template)
    if (preset.date) params.set('date', preset.date)
    if (preset.time) params.set('time', preset.time)
    if (preset.duration) params.set('duration', String(preset.duration))
    return params
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="shrink-0 bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <h1 className="text-3xl font-bold text-therapy-navy">Dashboard</h1>
          <p className="text-gray-600 mt-1">Start a new note or review your schedule.</p>
        </div>
      </div>

      <main className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
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

        <GoogleCalendar
          onStartSession={(mode, preset) => {
            if (mode === 'write') {
              const qs = paramsFromCalendarPreset(preset).toString()
              router.push(qs ? `/sessions/new?${qs}` : '/sessions/new')
            } else {
              setCalendarPreset(preset)
              setUploadOpen(true)
            }
          }}
        />
      </main>

      <WriteDictateModal
        open={modalOpen}
        initialClientId={calendarPreset?.clientId}
        initialDate={calendarPreset?.date}
        initialTime={calendarPreset?.time}
        initialDuration={calendarPreset?.duration}
        onClose={() => {
          setModalOpen(false)
          setCalendarPreset(null)
        }}
        onContinue={handleContinue}
      />

      <UploadAudioModal
        open={uploadOpen}
        initialClientId={calendarPreset?.clientId}
        initialDate={calendarPreset?.date}
        initialTime={calendarPreset?.time}
        initialDuration={calendarPreset?.duration}
        initialTemplate={calendarPreset?.template}
        onClose={() => {
          setUploadOpen(false)
          setCalendarPreset(null)
        }}
        onContinue={handleUploadContinue}
      />
    </div>
  )
}
