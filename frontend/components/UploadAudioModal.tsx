'use client'

import { useEffect, useRef, useState } from 'react'
import { apiClient, type Client, type NoteTemplate } from '@/lib/api'
import { NOTE_FORMATS } from '@/lib/noteFormats'
import { FALLBACK_DEFAULT_NOTE_TEMPLATE } from '@/lib/templatePreferences'

interface Props {
  open: boolean
  initialClientId?: string
  initialDate?: string
  initialTime?: string
  initialDuration?: number
  initialTemplate?: string
  onClose: () => void
  onContinue: (params: URLSearchParams, transcript: string) => void
}

const DURATIONS = [15, 30, 45, 50, 60, 75, 90]

const LANGUAGES: { value: string; label: string }[] = [
  { value: 'multi', label: 'Auto-detect (mixed OK)' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'zh', label: 'Chinese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'hi', label: 'Hindi' },
]

function localDate(d: Date) {
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export default function UploadAudioModal({
  open,
  initialClientId,
  initialDate,
  initialTime,
  initialDuration,
  initialTemplate,
  onClose,
  onContinue,
}: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [templates, setTemplates] = useState<NoteTemplate[]>([])

  const now = new Date()
  const [clientId, setClientId] = useState('')
  const [template, setTemplate] = useState('')
  const [date, setDate] = useState(localDate(now))
  const [time, setTime] = useState(now.toTimeString().slice(0, 5))
  const [duration, setDuration] = useState(50)
  const [language, setLanguage] = useState('multi')

  const [file, setFile] = useState<File | null>(null)
  const [transcribing, setTranscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!open) return
    apiClient.getUserSettings()
      .then((settings) => {
        const preferred = settings.default_note_template || FALLBACK_DEFAULT_NOTE_TEMPLATE
        setTemplate((current) => current || preferred)
      })
      .catch(() => setTemplate((current) => current || FALLBACK_DEFAULT_NOTE_TEMPLATE))
    apiClient.getClients().then(setClients).catch(() => {})
    apiClient.getTemplates().then(setTemplates).catch(() => {})
  }, [open])

  useEffect(() => {
    if (!open) return
    const current = new Date()
    setClientId(initialClientId ?? '')
    setDate(initialDate ?? localDate(current))
    setTime(initialTime ?? current.toTimeString().slice(0, 5))
    setDuration(initialDuration ?? 50)
    setTemplate(initialTemplate ?? '')
  }, [open, initialClientId, initialDate, initialTime, initialDuration, initialTemplate])

  useEffect(() => {
    if (!open) {
      setFile(null)
      setError(null)
      setTranscribing(false)
    }
  }, [open])

  if (!open) return null

  const canContinue = !!template && !!file && !transcribing

  const handleFile = (f: File | null) => {
    setError(null)
    if (!f) { setFile(null); return }
    if (!f.type.startsWith('audio/') && !/\.(mp3|wav|m4a|webm|ogg|flac|aac|mp4)$/i.test(f.name)) {
      setError('Please choose an audio file (mp3, wav, m4a, webm, ogg, flac, aac).')
      return
    }
    setFile(f)
  }

  const handleContinue = async () => {
    if (!file || !template) return
    setTranscribing(true)
    setError(null)
    try {
      const { transcript } = await apiClient.transcribeAudio(file, language, {
        diarize: true,
        filename: file.name,
      })
      const params = new URLSearchParams()
      if (clientId) params.set('client_id', clientId)
      if (template) params.set('template', template)
      if (date) params.set('date', date)
      if (time) params.set('time', time)
      if (duration) params.set('duration', String(duration))
      onContinue(params, transcript || '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Transcription failed')
    } finally {
      setTranscribing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-therapy-navy">Upload session recording</h2>
            <p className="text-sm text-gray-500 mt-1">
              We&apos;ll transcribe it and separate the two speakers automatically.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">{error}</div>
          )}

          {/* Audio file */}
          <div>
            <label className="block text-sm font-semibold text-therapy-navy mb-1.5">
              Audio file <span className="text-red-500">*</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.m4a,.webm,.ogg,.flac,.aac,.mp4"
              onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 py-2.5 border border-dashed border-gray-300 rounded-lg text-sm text-left hover:bg-gray-50 flex items-center justify-between"
            >
              <span className={file ? 'text-therapy-navy' : 'text-gray-500'}>
                {file ? file.name : 'Click to choose an audio file…'}
              </span>
              {file && (
                <span className="text-xs text-gray-400">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </span>
              )}
            </button>
          </div>

          {/* Client */}
          <div>
            <label className="block text-sm font-semibold text-therapy-navy mb-1.5">Client</label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-therapy-coral"
            >
              <option value="">Anonymous individual</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Note template */}
          <div>
            <label className="block text-sm font-semibold text-therapy-navy mb-1.5">
              Note template <span className="text-red-500">*</span>
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-therapy-coral"
            >
              <option value="">Select an option</option>
              {NOTE_FORMATS.map((f) => (
                <option key={f.key} value={f.key}>{f.label}</option>
              ))}
              {templates.map((t) => (
                <option key={t.id} value={`template:${t.id}`}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-sm font-semibold text-therapy-navy mb-1.5">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-therapy-coral"
            >
              {LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>

          {/* Date / Time / Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-semibold text-therapy-navy mb-1.5">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-therapy-coral"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-therapy-navy mb-1.5">Time</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-therapy-coral"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-therapy-navy mb-1.5">Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-therapy-coral"
              >
                {DURATIONS.map((d) => <option key={d} value={d}>{d} mins</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50">
          <span className="text-xs text-gray-500">
            {transcribing ? 'Transcribing…' : 'Audio is processed for transcription only.'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={transcribing}
              className="px-4 py-2 text-sm font-medium text-therapy-navy bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="px-4 py-2 text-sm font-medium text-white bg-therapy-coral rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {transcribing ? 'Transcribing…' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
