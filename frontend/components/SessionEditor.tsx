'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { apiClient, type Client, type NoteTemplate, type Session, type SessionInput } from '@/lib/api'
import { CUSTOM_FORMAT_KEY, NOTE_FORMATS, formatLabel } from '@/lib/noteFormats'

interface Props {
  initial?: Session
  fixedClientId?: string
  initialFormat?: string
  initialDate?: string
  initialTime?: string
  initialDuration?: number
  onSaved: (session: Session) => void
  onDelete?: () => void
}

const LANGUAGES: { value: string; label: string }[] = [
  { value: 'multi', label: 'Auto-detect' },
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

function resolveFormat(formatKey: string | undefined, templates: NoteTemplate[]):
  { format: string; sections: string[]; templateId?: string; label: string } {
  if (!formatKey) return { format: '', sections: [], label: 'Progress note' }
  if (formatKey.startsWith('template:')) {
    const id = formatKey.slice('template:'.length)
    const t = templates.find(x => x.id === id)
    if (t) return {
      format: t.base_format || CUSTOM_FORMAT_KEY,
      sections: t.sections,
      templateId: t.id,
      label: t.name,
    }
    return { format: '', sections: [], label: 'Progress note' }
  }
  const f = NOTE_FORMATS.find(x => x.key === formatKey)
  if (f) return { format: f.key, sections: f.sections, label: f.label }
  return { format: formatKey, sections: [], label: formatLabel(formatKey) }
}

export default function SessionEditor({
  initial,
  fixedClientId,
  initialFormat,
  initialDate,
  initialTime,
  initialDuration,
  onSaved,
  onDelete,
}: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [templates, setTemplates] = useState<NoteTemplate[]>([])

  const [clientId, setClientId] = useState(initial?.client_id ?? fixedClientId ?? '')
  const [date, setDate] = useState(initialDate ?? (initial?.session_date ?? new Date().toISOString()).slice(0, 10))
  const [time, setTime] = useState(initialTime ?? new Date().toTimeString().slice(0, 5))
  const [duration, setDuration] = useState<number>(initialDuration ?? 50)
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [content, setContent] = useState<Record<string, string>>(initial?.note_content ?? {})
  const [sections, setSections] = useState<string[]>(
    initial?.note_content ? Object.keys(initial.note_content) : []
  )
  const [noteFormat, setNoteFormat] = useState(initial?.note_format ?? initialFormat ?? '')
  const [templateId, setTemplateId] = useState<string | undefined>(initial?.template_id)
  const [noteLabel, setNoteLabel] = useState<string>('Progress note')

  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [language, setLanguage] = useState('multi')
  const [recording, setRecording] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    apiClient.getClients().then(setClients).catch(() => {})
    apiClient.getTemplates().then(setTemplates).catch(() => {})
  }, [])

  useEffect(() => {
    if (initial || !initialFormat) return
    const r = resolveFormat(initialFormat, templates)
    if (!r.sections.length && initialFormat.startsWith('template:') && !templates.length) return
    setNoteFormat(r.format)
    setTemplateId(r.templateId)
    setNoteLabel(r.label)
    setSections(r.sections)
    setContent(prev => {
      const next: Record<string, string> = {}
      r.sections.forEach(s => { next[s] = prev[s] ?? '' })
      return next
    })
  }, [initialFormat, templates, initial])

  useEffect(() => {
    if (initial?.note_format) {
      const r = resolveFormat(initial.template_id ? `template:${initial.template_id}` : initial.note_format, templates)
      setNoteLabel(r.label)
    }
  }, [initial, templates])

  const client = useMemo(() => clients.find(c => c.id === clientId), [clients, clientId])

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' })
        if (blob.size === 0) return
        setTranscribing(true)
        try {
          const { transcript } = await apiClient.transcribeAudio(blob, language)
          if (transcript) {
            setSummary(prev => prev ? `${prev.trim()}\n${transcript}` : transcript)
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Transcription failed')
        } finally {
          setTranscribing(false)
        }
      }
      mediaRecorderRef.current = mr
      mr.start()
      setRecording(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Microphone access denied')
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }

  const handleGenerate = async () => {
    if (!summary.trim()) { setError('Please enter or dictate a session summary first.'); return }
    if (sections.length === 0) { setError('No template selected.'); return }
    setGenerating(true)
    setError(null)
    try {
      const { note_content } = await apiClient.generateNote({
        summary,
        note_format: noteFormat,
        sections,
      })
      setContent(prev => ({ ...prev, ...note_content }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate notes')
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!clientId) { setError('Please select a client.'); return }
    setSaving(true)
    setError(null)
    const sessionDate = new Date(`${date}T${time || '00:00'}`)
    const payload: SessionInput = {
      client_id: clientId,
      session_date: sessionDate.toISOString(),
      summary: summary.trim() || undefined,
      note_format: noteFormat || undefined,
      note_content: sections.length ? content : undefined,
      template_id: templateId,
    }
    try {
      const saved = initial
        ? await apiClient.updateSession(initial.id, payload)
        : await apiClient.createSession(payload)
      onSaved(saved)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save session')
    } finally {
      setSaving(false)
    }
  }

  const wordCount = summary.trim() ? summary.trim().split(/\s+/).length : 0

  const sessionDateLabel = useMemo(() => {
    try {
      const d = new Date(`${date}T${time || '00:00'}`)
      const dateStr = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      const timeStr = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      const end = new Date(d.getTime() + duration * 60 * 1000)
      const endStr = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
      return { dateStr, timeStr, endStr }
    } catch {
      return { dateStr: '', timeStr: '', endStr: '' }
    }
  }, [date, time, duration])

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ===================== LEFT: note editor ===================== */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 space-y-6">
          {/* Meta header */}
          <div className="grid grid-cols-2 gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase mb-1">Client</div>
              {client ? (
                <div className="text-sm font-semibold text-therapy-navy">{client.name}</div>
              ) : (
                <select
                  className="w-full text-sm text-therapy-blue bg-transparent border-0 p-0 focus:outline-none focus:ring-0"
                  value={clientId}
                  onChange={e => setClientId(e.target.value)}
                  disabled={!!fixedClientId || !!initial}
                >
                  <option value="">Assign client</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              )}
            </div>
            <div>
              <div className="text-[11px] font-semibold tracking-wider text-gray-500 uppercase mb-1">Session</div>
              <div className="text-sm font-semibold text-therapy-navy">
                Session on {sessionDateLabel.dateStr}
              </div>
              <div className="text-xs text-gray-500 mt-0.5">
                {sessionDateLabel.timeStr} – {sessionDateLabel.endStr}, {duration} minutes
              </div>
            </div>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-3xl font-bold text-therapy-navy">{noteLabel || 'Progress note'}</h2>
          </div>

          {/* Sections */}
          {sections.length === 0 ? (
            <div className="text-sm text-gray-500 italic">
              No template selected. Go back and pick one from the Write or dictate dialog.
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map(section => (
                <div key={section}>
                  <label className="block text-base font-bold text-therapy-navy mb-2">{section}</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent text-sm"
                    rows={4}
                    value={content[section] ?? ''}
                    onChange={e => setContent(prev => ({ ...prev, [section]: e.target.value }))}
                    placeholder={`Enter ${section.toLowerCase()}…`}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2.5 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50"
            >
              {saving ? 'Saving…' : initial ? 'Save changes' : 'Create session'}
            </button>
            {onDelete && (
              <button onClick={onDelete} className="px-5 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium">
                Delete
              </button>
            )}
          </div>
        </div>

        {/* ===================== RIGHT: generate from summary ===================== */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4 lg:sticky lg:top-6">
            <div>
              <h3 className="text-xl font-bold text-therapy-navy">Generate from summary</h3>
              <p className="text-sm text-gray-500 mt-1">
                Write or dictate key points from your session, and let our AI draft your note.
              </p>
            </div>

            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <textarea
                className="w-full px-4 py-3 text-sm focus:outline-none resize-none min-h-[280px]"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder={'Remember to include:\n\n• Presented issues and topics\n• Client presentations\n• Therapeutic interventions\n• Assessment and plan\n• Overall therapy progress'}
              />
              <div className="flex items-center justify-between px-3 py-2 border-t border-gray-100 bg-gray-50">
                <span className={`text-xs px-2 py-1 rounded-full ${wordCount === 0 ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                  {wordCount} words
                </span>
                <div className="flex items-center gap-2">
                  <select
                    value={language}
                    onChange={e => setLanguage(e.target.value)}
                    disabled={recording || transcribing}
                    className="text-xs px-2 py-1 border border-gray-200 rounded-md bg-white"
                  >
                    {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </select>
                  {!recording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={transcribing}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-white text-therapy-navy disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      {transcribing ? 'Transcribing…' : 'Dictate'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 animate-pulse"
                    >
                      ■ Stop
                    </button>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating || !summary.trim() || sections.length === 0}
              className="w-full px-4 py-3 bg-therapy-coral text-white rounded-xl hover:bg-opacity-90 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generating ? 'Generating…' : 'Generate note'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
