'use client'

import { useEffect, useState } from 'react'
import { apiClient, type Client, type NoteTemplate } from '@/lib/api'
import { NOTE_FORMATS } from '@/lib/noteFormats'
import { FALLBACK_DEFAULT_NOTE_TEMPLATE } from '@/lib/templatePreferences'

interface Props {
  open: boolean
  onClose: () => void
  onContinue: (params: URLSearchParams) => void
}

const DURATIONS = [15, 30, 45, 50, 60, 75, 90]

export default function WriteDictateModal({ open, onClose, onContinue }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [templates, setTemplates] = useState<NoteTemplate[]>([])

  const now = new Date()
  const [clientId, setClientId] = useState('')
  const [template, setTemplate] = useState('')
  const [date, setDate] = useState(now.toISOString().slice(0, 10))
  const [time, setTime] = useState(now.toTimeString().slice(0, 5))
  const [duration, setDuration] = useState(50)

  useEffect(() => {
    if (!open) return
    apiClient.getUserSettings()
      .then((settings) => {
        const preferred = settings.default_note_template && settings.default_note_template !== 'upheal'
          ? settings.default_note_template
          : FALLBACK_DEFAULT_NOTE_TEMPLATE
        setTemplate((current) => current || preferred)
      })
      .catch(() => setTemplate((current) => current || FALLBACK_DEFAULT_NOTE_TEMPLATE))
    apiClient.getClients().then(setClients).catch(() => {})
    apiClient.getTemplates().then(setTemplates).catch(() => {})
  }, [open])

  if (!open) return null

  const canContinue = !!template

  const handleContinue = () => {
    const params = new URLSearchParams()
    if (clientId) params.set('client_id', clientId)
    if (template) params.set('template', template)
    if (date) params.set('date', date)
    if (time) params.set('time', time)
    if (duration) params.set('duration', String(duration))
    onContinue(params)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-start justify-between px-6 pt-6 pb-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-therapy-navy">Write or dictate</h2>
            <p className="text-sm text-gray-500 mt-1">Set details to start your note, AI assistance optional.</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1" aria-label="Close">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
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
          <button className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Help
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-therapy-navy bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleContinue}
              disabled={!canContinue}
              className="px-4 py-2 text-sm font-medium text-white bg-therapy-coral rounded-lg hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
