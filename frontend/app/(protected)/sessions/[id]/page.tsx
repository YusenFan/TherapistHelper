'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { apiClient, type ClientListItem, type Session, type SessionNote } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type NoteFormat = 'Free' | 'BIRP' | 'DAP' | 'SOAP'
type SessionType = 'individual' | 'couple' | 'family' | 'group'

interface SessionAnalysis {
  note_format: NoteFormat
  session_status: 'draft' | 'finalized'
  behavior: string
  intervention: string
  response: string
  plan: string
  data: string
  assessment: string
  subjective: string
  objective: string
  free_text: string
  homework_assigned: string
  private_notes: string
}

const defaultAnalysis: SessionAnalysis = {
  note_format: 'Free',
  session_status: 'draft',
  behavior: '',
  intervention: '',
  response: '',
  plan: '',
  data: '',
  assessment: '',
  subjective: '',
  objective: '',
  free_text: '',
  homework_assigned: '',
  private_notes: '',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toLocalDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

// ─── Detail form ─────────────────────────────────────────────────────────────

function SessionDetailForm() {
  const router = useRouter()
  const { id: sessionId } = useParams() as { id: string }

  const [client, setClient] = useState<ClientListItem | null>(null)
  const [noteId, setNoteId] = useState<string | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Session header
  const [sessionDate, setSessionDate] = useState('')
  const [sessionType, setSessionType] = useState<SessionType>('individual')

  // Note format
  const [noteFormat, setNoteFormat] = useState<NoteFormat>('Free')

  // Analysis fields
  const [analysis, setAnalysis] = useState<SessionAnalysis>(defaultAnalysis)

  // Microphone / recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)

  // Form state
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Load session
  useEffect(() => {
    if (!sessionId) {
      setFetchError('No session ID provided')
      setLoadingSession(false)
      return
    }
    const load = async () => {
      try {
        const s: Session = await apiClient.getSession(sessionId)

        // Parse date & time from session_date ISO string
        const dt = new Date(s.session_date)
        setSessionDate(toLocalDateString(dt))
        setSessionType((s.session_type as SessionType) || 'individual')

        // Load session note
        const note: SessionNote | null = await apiClient.getSessionNote(sessionId)
        if (note) {
          setNoteId(note.id)
          const fmtMap: Record<string, NoteFormat> = { free: 'Free', birp: 'BIRP', dap: 'DAP', soap: 'SOAP' }
          const fmt: NoteFormat = fmtMap[(note.note_format || '').toLowerCase()] || 'Free'
          setNoteFormat(fmt)
          setAnalysis(prev => ({
            ...prev,
            note_format: fmt,
            session_status: note.is_finalized ? 'finalized' : 'draft',
            free_text: note.free_content || '',
            behavior: note.birp_behavior || '',
            intervention: note.birp_intervention || '',
            response: note.birp_response || '',
            plan: note.birp_plan || note.dap_plan || note.soap_plan || '',
            data: note.dap_data || '',
            assessment: note.dap_assessment || note.soap_assessment || '',
            subjective: note.soap_subjective || '',
            objective: note.soap_objective || '',
          }))
        }

        // Load client info
        if (s.client_id) {
          const c = await apiClient.getClient(s.client_id)
          setClient(c as unknown as ClientListItem)
        }
      } catch (err) {
        console.error(err)
        setFetchError('Failed to load session')
      } finally {
        setLoadingSession(false)
      }
    }
    load()
  }, [sessionId])

  const updateAnalysis = useCallback(<K extends keyof SessionAnalysis>(key: K, value: SessionAnalysis[K]) => {
    setAnalysis(prev => ({ ...prev, [key]: value }))
  }, [])

  // ── Microphone ────────────────────────────────────────────────────────────

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setIsTranscribing(true)
        try {
          const text = await apiClient.speechToText(blob)
          if (text) {
            setAnalysis(prev => ({
              ...prev,
              free_text: prev.free_text ? `${prev.free_text}\n${text}` : text,
            }))
          }
        } catch {
          // silently ignore
        } finally {
          setIsTranscribing(false)
        }
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch {
      // user denied mic
    }
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async (status: 'draft' | 'finalized') => {
    if (!sessionId) return
    setIsSaving(true)
    setSaveError('')
    setSaveSuccess(false)
    const finalAnalysis: SessionAnalysis = {
      ...analysis,
      note_format: noteFormat,
      session_status: status,
    }
    try {
      await apiClient.updateSession(sessionId, {
        session_date: new Date(`${sessionDate}T00:00:00`).toISOString(),
        session_type: sessionType,
        status: status === 'finalized' ? 'completed' : 'draft',
      })

      // Save note content to session_notes collection
      const noteFormatLower = noteFormat.toLowerCase() as 'free' | 'birp' | 'dap' | 'soap'
      const notePayload = {
        note_format: noteFormatLower,
        is_finalized: status === 'finalized',
        free_content: noteFormat === 'Free' ? finalAnalysis.free_text : undefined,
        birp_behavior: noteFormat === 'BIRP' ? finalAnalysis.behavior : undefined,
        birp_intervention: noteFormat === 'BIRP' ? finalAnalysis.intervention : undefined,
        birp_response: noteFormat === 'BIRP' ? finalAnalysis.response : undefined,
        birp_plan: noteFormat === 'BIRP' ? finalAnalysis.plan : undefined,
        dap_data: noteFormat === 'DAP' ? finalAnalysis.data : undefined,
        dap_assessment: noteFormat === 'DAP' ? finalAnalysis.assessment : undefined,
        dap_plan: noteFormat === 'DAP' ? finalAnalysis.plan : undefined,
        soap_subjective: noteFormat === 'SOAP' ? finalAnalysis.subjective : undefined,
        soap_objective: noteFormat === 'SOAP' ? finalAnalysis.objective : undefined,
        soap_assessment: noteFormat === 'SOAP' ? finalAnalysis.assessment : undefined,
        soap_plan: noteFormat === 'SOAP' ? finalAnalysis.plan : undefined,
      }

      if (noteId) {
        await apiClient.updateSessionNote(noteId, notePayload)
      } else {
        // No note yet — create one
        const session = await apiClient.getSession(sessionId)
        const newNote = await apiClient.createSessionNote({
          session_id: sessionId,
          client_id: session.client_id,
          ...notePayload,
        })
        setNoteId(newNote.id)
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save session.')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loadingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-therapy-coral" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{fetchError}</h2>
          <p className="text-gray-600 mb-4">The session could not be loaded.</p>
          <button onClick={() => router.back()} className="text-therapy-coral hover:underline text-sm">Go back</button>
        </div>
      </div>
    )
  }

  const backHref = client ? `/sessions?client_id=${client.id}` : '/sessions'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <button
            onClick={() => router.push(backHref)}
            className="text-therapy-coral hover:opacity-80 transition-opacity text-sm inline-flex items-center mb-2"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Sessions
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-therapy-navy">Session Record</h1>
            <div className="flex items-center space-x-3">
              {saveSuccess && (
                <span className="text-sm text-green-600 font-medium flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Saved
                </span>
              )}
              <button
                onClick={() => handleSave('draft')}
                disabled={isSaving}
                className="px-5 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                Save Draft
              </button>
              <button
                onClick={() => handleSave('finalized')}
                disabled={isSaving}
                className="px-5 py-2 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium disabled:opacity-50 flex items-center space-x-1.5"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Saving…</span>
                  </>
                ) : (
                  <span>Finalize Session</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">

        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800 flex items-start">
            <svg className="w-4 h-4 mr-2 mt-0.5 shrink-0 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            {saveError}
          </div>
        )}

        {/* ── 1. Session Details ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-therapy-navy mb-5">Session Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Client (read-only) */}
            {client && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-therapy-navy mb-1">Client</label>
                <div className="flex items-center space-x-3 px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="w-8 h-8 bg-therapy-coral rounded-full flex items-center justify-center shrink-0">
                    <span className="text-white text-xs font-bold">
                      {client.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-therapy-navy">{client.full_name}</p>
                    <p className="text-xs text-gray-500">{client.approximate_age ? `${client.approximate_age} y/o` : ''}{client.approximate_age && client.gender_identity ? ' · ' : ''}{client.gender_identity || ''}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-therapy-navy mb-1">Session Date</label>
              <input
                type="date"
                value={sessionDate}
                onChange={e => setSessionDate(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent text-sm"
              />
            </div>

            {/* Session type */}
            <div>
              <label className="block text-sm font-medium text-therapy-navy mb-1">Session Type</label>
              <select
                value={sessionType}
                onChange={e => setSessionType(e.target.value as SessionType)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent text-sm"
              >
                <option value="individual">Individual</option>
                <option value="couple">Couple</option>
                <option value="family">Family</option>
                <option value="group">Group</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 2. Session Notes ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-therapy-navy mb-5">Session Notes</h2>

          {/* FREE TEXT */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-therapy-navy">Free Notes</label>
              <span className="text-xs text-gray-400">Speak or type · then convert to a format below if needed</span>
            </div>
            <div className="relative">
              <textarea
                rows={9}
                value={analysis.free_text}
                onChange={e => updateAnalysis('free_text', e.target.value)}
                placeholder="Start typing or press the microphone button to dictate your session notes..."
                className="w-full px-4 py-3 pr-14 border border-gray-200 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent resize-none text-sm bg-gray-50 focus:bg-white transition-colors"
              />
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isTranscribing}
                title={isRecording ? 'Stop recording' : 'Start voice dictation'}
                className={`absolute bottom-3 right-3 p-2.5 rounded-full transition-all shadow-sm ${
                  isRecording
                    ? 'bg-red-500 text-white animate-pulse'
                    : isTranscribing
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-white text-gray-500 hover:bg-therapy-coral hover:text-white border border-gray-200'
                }`}
              >
                {isTranscribing ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
            </div>
            {isRecording && (
              <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Recording… tap mic button to stop and transcribe
              </div>
            )}
          </div>

          {/* FORMAT SELECTOR */}
          <div className="border-t border-gray-100 pt-5">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="text-sm font-medium text-therapy-navy">Structured Format</span>
              <div className="flex gap-2">
                {(['Free', 'BIRP', 'DAP', 'SOAP'] as NoteFormat[]).map(fmt => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setNoteFormat(fmt)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      noteFormat === fmt
                        ? 'bg-therapy-coral text-white'
                        : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {fmt === 'Free' ? 'None' : fmt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* BIRP fields */}
          {noteFormat === 'BIRP' && (
            <div className="mt-5 space-y-4">
              {([
                { key: 'behavior', label: 'Behavior', hint: 'What did the client present? Mood, affect, reported symptoms, significant events this week.' },
                { key: 'intervention', label: 'Intervention', hint: 'What therapeutic techniques or interventions did you use?' },
                { key: 'response', label: 'Response', hint: 'How did the client respond to the interventions? Engagement, insight, resistance.' },
                { key: 'plan', label: 'Plan', hint: 'Next steps, goals for next session, referrals, adjustments to treatment plan.' },
              ] as const).map(({ key, label, hint }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-therapy-navy mb-1">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-therapy-coral bg-opacity-15 text-therapy-coral text-xs font-bold mr-1.5">
                      {label[0]}
                    </span>
                    {label}
                  </label>
                  <p className="text-xs text-gray-400 mb-1.5 ml-7">{hint}</p>
                  <textarea
                    rows={4}
                    value={analysis[key]}
                    onChange={e => updateAnalysis(key, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent resize-none text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              ))}
            </div>
          )}

          {/* DAP fields */}
          {noteFormat === 'DAP' && (
            <div className="mt-5 space-y-4">
              {([
                { key: 'data', label: 'Data', hint: 'Objective and subjective information: what the client reported, observed behaviors, mood.' },
                { key: 'assessment', label: 'Assessment', hint: 'Clinical interpretation: formulation, progress toward goals, clinical impressions.' },
                { key: 'plan', label: 'Plan', hint: 'Next steps, homework, referrals, treatment plan changes.' },
              ] as const).map(({ key, label, hint }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-therapy-navy mb-1">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-therapy-coral bg-opacity-15 text-therapy-coral text-xs font-bold mr-1.5">
                      {label[0]}
                    </span>
                    {label}
                  </label>
                  <p className="text-xs text-gray-400 mb-1.5 ml-7">{hint}</p>
                  <textarea
                    rows={4}
                    value={analysis[key]}
                    onChange={e => updateAnalysis(key, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent resize-none text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              ))}
            </div>
          )}

          {/* SOAP fields */}
          {noteFormat === 'SOAP' && (
            <div className="mt-5 space-y-4">
              {([
                { key: 'subjective', label: 'Subjective', hint: "Client's own report: what they said, felt, or presented verbally." },
                { key: 'objective', label: 'Objective', hint: "Observable data: appearance, psychomotor behaviour, test scores, observable affect." },
                { key: 'assessment', label: 'Assessment', hint: 'Clinical interpretation: progress, diagnosis considerations, formulation.' },
                { key: 'plan', label: 'Plan', hint: 'Next steps, medications, homework, referrals, next session focus.' },
              ] as const).map(({ key, label, hint }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-therapy-navy mb-1">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-therapy-coral bg-opacity-15 text-therapy-coral text-xs font-bold mr-1.5">
                      {label[0]}
                    </span>
                    {label}
                  </label>
                  <p className="text-xs text-gray-400 mb-1.5 ml-7">{hint}</p>
                  <textarea
                    rows={4}
                    value={analysis[key]}
                    onChange={e => updateAnalysis(key, e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent resize-none text-sm bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── 3. Homework ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-therapy-navy mb-5">Homework</h2>
          <div>
            <label className="block text-sm font-medium text-therapy-navy mb-1">Homework Assigned This Session</label>
            <textarea
              rows={3}
              value={analysis.homework_assigned}
              onChange={e => updateAnalysis('homework_assigned', e.target.value)}
              placeholder="Describe any homework or between-session tasks assigned..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent resize-none text-sm bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* ── 4. Private Process Notes ── */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-600">Private Process Notes</p>
              <p className="text-xs text-gray-400 mt-0.5">Not part of the official clinical record. Personal impressions, hypotheses, countertransference reactions.</p>
            </div>
          </div>
          <textarea
            rows={4}
            value={analysis.private_notes}
            onChange={e => updateAnalysis('private_notes', e.target.value)}
            placeholder="Your private clinical impressions, hypotheses, or personal reactions..."
            className="w-full px-4 py-3 border border-dashed border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-400 focus:border-transparent resize-none text-sm bg-gray-50 focus:bg-white transition-colors"
          />
        </div>

        {/* Bottom actions */}
        <div className="flex items-center justify-between pb-8">
          <button
            onClick={() => router.push(backHref)}
            className="text-sm text-gray-500 hover:text-therapy-navy"
          >
            Cancel
          </button>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleSave('draft')}
              disabled={isSaving}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSave('finalized')}
              disabled={isSaving}
              className="px-6 py-2.5 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Finalize Session
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}

// ─── Page export ─────────────────────────────────────────────────────────────

export default function SessionDetailPage() {
  return <SessionDetailForm />
}
