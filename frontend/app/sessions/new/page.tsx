'use client'

import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiClient, type ClientListItem, type Session } from '@/lib/api'

// ─── Types ──────────────────────────────────────────────────────────────────

type NoteFormat = 'Free' | 'BIRP' | 'DAP' | 'SOAP'
type SessionType = 'individual' | 'couple' | 'family' | 'group'
type HomeworkCompletion = 'completed' | 'partial' | 'not_completed' | 'na'
type RiskLevel = 'none' | 'low' | 'moderate' | 'high'
type Affect =
  | 'congruent' | 'flat' | 'labile' | 'anxious' | 'restricted'
  | 'expansive' | 'euphoric' | 'dysphoric' | 'irritable'

interface SessionAnalysis {
  note_format: NoteFormat
  session_status: 'draft' | 'finalized'
  // Mood & affect
  mood_rating: number
  affect: Affect | ''
  // Interventions
  interventions_used: string[]
  // BIRP fields
  behavior: string
  intervention: string
  response: string
  plan: string
  // DAP fields
  data: string
  assessment: string
  // SOAP fields
  subjective: string
  objective: string
  // Free text (always primary)
  free_text: string
  // Risk
  risk_level: RiskLevel
  suicidality_screened: boolean
  safety_plan_updated: boolean
  risk_notes: string
  // Homework
  homework_completion: HomeworkCompletion
  homework_assigned: string
  // Next session
  next_session_focus: string
  follow_up_actions: string
  // Private (not in official record)
  private_notes: string
  // Tags
  tags: string[]
}

const defaultAnalysis: SessionAnalysis = {
  note_format: 'Free',
  session_status: 'draft',
  mood_rating: 5,
  affect: '',
  interventions_used: [],
  behavior: '',
  intervention: '',
  response: '',
  plan: '',
  data: '',
  assessment: '',
  subjective: '',
  objective: '',
  free_text: '',
  risk_level: 'none',
  suicidality_screened: false,
  safety_plan_updated: false,
  risk_notes: '',
  homework_completion: 'na',
  homework_assigned: '',
  next_session_focus: '',
  follow_up_actions: '',
  private_notes: '',
  tags: [],
}

// ─── Constants ────────────────────────────────────────────────────────────────

const INTERVENTION_OPTIONS = [
  'CBT', 'DBT', 'EMDR', 'ACT', 'Motivational Interviewing',
  'Psychoeducation', 'Mindfulness', 'Solution-Focused', 'Person-Centred',
  'Narrative Therapy', 'Somatic', 'Gottman Method', 'Attachment-Based',
  'Psychodynamic', 'Exposure Therapy', 'Grounding Techniques', 'Other',
]

const AFFECT_OPTIONS: Affect[] = [
  'congruent', 'flat', 'labile', 'anxious', 'restricted',
  'expansive', 'euphoric', 'dysphoric', 'irritable',
]

const MOOD_LABELS: Record<number, string> = {
  1: 'Severely distressed', 2: 'Very distressed', 3: 'Distressed',
  4: 'Below baseline', 5: 'Neutral', 6: 'Slightly positive',
  7: 'Positive', 8: 'Good', 9: 'Very good', 10: 'Thriving',
}

const PREDEFINED_SESSION_TAGS = [
  'Anxiety', 'Depression', 'Trauma', 'Crisis', 'Progress', 'Homework Review',
  'Goal Setting', 'Assessment', 'Relapse', 'Breakthrough', 'Resistance',
  'Grief', 'Relationship Issues', 'Psychoeducation', 'Suicidality',
  'Termination', 'Referral', 'Medication Review', 'Boundary Work',
]

// ─── Helper ───────────────────────────────────────────────────────────────────

function toLocalDateString(date: Date) {
  return date.toISOString().split('T')[0]
}

function toLocalTimeString(date: Date) {
  return date.toTimeString().slice(0, 5)
}

function calcDurationMinutes(start: string, end: string): number {
  if (!start || !end) return 50
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const diff = (eh * 60 + em) - (sh * 60 + sm)
  return diff > 0 ? diff : 50
}

function buildNotesSummary(analysis: SessionAnalysis): string {
  const { note_format } = analysis
  if (note_format === 'BIRP') {
    return [
      analysis.behavior && `B: ${analysis.behavior}`,
      analysis.intervention && `I: ${analysis.intervention}`,
      analysis.response && `R: ${analysis.response}`,
      analysis.plan && `P: ${analysis.plan}`,
    ].filter(Boolean).join('\n\n')
  }
  if (note_format === 'DAP') {
    return [
      analysis.data && `D: ${analysis.data}`,
      analysis.assessment && `A: ${analysis.assessment}`,
      analysis.plan && `P: ${analysis.plan}`,
    ].filter(Boolean).join('\n\n')
  }
  if (note_format === 'SOAP') {
    return [
      analysis.subjective && `S: ${analysis.subjective}`,
      analysis.objective && `O: ${analysis.objective}`,
      analysis.assessment && `A: ${analysis.assessment}`,
      analysis.plan && `P: ${analysis.plan}`,
    ].filter(Boolean).join('\n\n')
  }
  return analysis.free_text
}

// ─── Previous session context panel ──────────────────────────────────────────

function PreviousSessionPanel({ session }: { session: Session }) {
  const [open, setOpen] = useState(false)
  const analysis = session.analysis as Record<string, unknown> | undefined

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium text-blue-800">Previous session context</span>
          <span className="text-xs text-blue-500">
            {new Date(session.session_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
        <svg className={`w-4 h-4 text-blue-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-3 text-sm">
          {!!analysis?.plan && (
            <div>
              <p className="font-medium text-blue-700 mb-1">Plan from last session</p>
              <p className="text-blue-800 whitespace-pre-wrap">{String(analysis.plan)}</p>
            </div>
          )}
          {!!analysis?.homework_assigned && (
            <div>
              <p className="font-medium text-blue-700 mb-1">Homework assigned</p>
              <p className="text-blue-800">{String(analysis.homework_assigned)}</p>
            </div>
          )}
          {!!analysis?.next_session_focus && (
            <div>
              <p className="font-medium text-blue-700 mb-1">Focus areas planned</p>
              <p className="text-blue-800">{String(analysis.next_session_focus)}</p>
            </div>
          )}
          {session.summary && (
            <div>
              <p className="font-medium text-blue-700 mb-1">Session summary</p>
              <p className="text-blue-800">{session.summary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Main form (wrapped in Suspense for useSearchParams) ──────────────────────

function NewSessionForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClientId = searchParams.get('client_id') || ''

  // Meta
  const now = new Date()
  const [clients, setClients] = useState<ClientListItem[]>([])
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState(preselectedClientId)
  const [prevSession, setPrevSession] = useState<Session | null>(null)
  const [loadingClients, setLoadingClients] = useState(true)

  // Session header
  const [sessionDate, setSessionDate] = useState(toLocalDateString(now))
  const [startTime, setStartTime] = useState(toLocalTimeString(now))
  const [endTime, setEndTime] = useState('')
  const [sessionType, setSessionType] = useState<SessionType>('individual')
  const [modality, setModality] = useState('')

  // Note format
  const [noteFormat, setNoteFormat] = useState<NoteFormat>('Free')

  // Analysis fields
  const [analysis, setAnalysis] = useState<SessionAnalysis>(defaultAnalysis)

  // Tags
  const [customTagInput, setCustomTagInput] = useState('')

  // Microphone / recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)

  // AI convert
  const [isConverting, setIsConverting] = useState(false)
  const [convertSuccess, setConvertSuccess] = useState(false)

  // Form state
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  // Load clients
  useEffect(() => {
    apiClient.getClients().then(c => {
      setClients(c)
      setLoadingClients(false)
    }).catch(() => setLoadingClients(false))
  }, [])

  // When client changes, load previous session for context
  useEffect(() => {
    if (!selectedClientId) { setPrevSession(null); return }
    apiClient.getLatestClientSession(selectedClientId).then(setPrevSession)
  }, [selectedClientId])

  const updateAnalysis = useCallback(<K extends keyof SessionAnalysis>(key: K, value: SessionAnalysis[K]) => {
    setAnalysis(prev => ({ ...prev, [key]: value }))
  }, [])

  const toggleIntervention = (name: string) => {
    setAnalysis(prev => ({
      ...prev,
      interventions_used: prev.interventions_used.includes(name)
        ? prev.interventions_used.filter(i => i !== name)
        : [...prev.interventions_used, name],
    }))
  }

  // ── Tag helpers ───────────────────────────────────────────────────────────

  const togglePredefinedTag = (tag: string) => {
    setAnalysis(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag],
    }))
  }

  const addCustomTag = () => {
    const tag = customTagInput.replace(/,/g, '').trim()
    if (!tag || analysis.tags.includes(tag)) { setCustomTagInput(''); return }
    setAnalysis(prev => ({ ...prev, tags: [...prev.tags, tag] }))
    setCustomTagInput('')
  }

  const removeTag = (tag: string) => {
    setAnalysis(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }))
  }

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
              free_text: prev.free_text
                ? `${prev.free_text}\n${text}`
                : text,
            }))
          }
        } catch {
          // silently ignore transcription errors
        } finally {
          setIsTranscribing(false)
        }
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
    } catch {
      // User denied mic permission — ignore
    }
  }

  // ── AI Convert ────────────────────────────────────────────────────────────

  const handleAIConvert = async () => {
    if (!analysis.free_text.trim() || noteFormat === 'Free') return
    setIsConverting(true)
    setConvertSuccess(false)
    try {
      const result = await apiClient.convertNoteFormat(analysis.free_text, noteFormat)
      setAnalysis(prev => ({ ...prev, ...result }))
      setConvertSuccess(true)
      setTimeout(() => setConvertSuccess(false), 3000)
    } catch {
      // silently ignore — user can fill fields manually
    } finally {
      setIsConverting(false)
    }
  }

  // ── Misc ─────────────────────────────────────────────────────────────────

  const filteredClients = clients.filter(c =>
    c.full_name.toLowerCase().includes(clientSearch.toLowerCase())
  )

  const selectedClient = clients.find(c => c.id === selectedClientId)
  const durationMinutes = endTime ? calcDurationMinutes(startTime, endTime) : 50

  const handleSave = async (status: 'draft' | 'finalized') => {
    if (!selectedClientId) { setSaveError('Please select a client.'); return }
    setIsSaving(true)
    setSaveError('')
    const finalAnalysis: SessionAnalysis = { ...analysis, note_format: noteFormat, session_status: status }
    try {
      const sessionDatetime = new Date(`${sessionDate}T${startTime}:00`)
      const session = await apiClient.createSession({
        client_id: selectedClientId,
        session_date: sessionDatetime.toISOString(),
        duration_minutes: durationMinutes,
        session_type: sessionType,
        notes: buildNotesSummary(finalAnalysis),
        analysis: finalAnalysis as unknown as Record<string, unknown>,
      })
      router.push(`/sessions?client_id=${selectedClientId}&session_id=${session.id}&saved=true`)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save session.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <Link href="/sessions" className="text-therapy-coral hover:opacity-80 transition-opacity text-sm inline-flex items-center mb-2">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Sessions
          </Link>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-therapy-navy">New Session Record</h1>
            <div className="flex items-center space-x-3">
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
                    <span>Saving...</span>
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

        {/* ── 1. Session Header ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-therapy-navy mb-5">Session Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Client selector */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-therapy-navy mb-1">
                Client <span className="text-red-500">*</span>
              </label>
              {selectedClient ? (
                <div className="flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-therapy-coral rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">
                        {selectedClient.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-therapy-navy">{selectedClient.full_name}</p>
                      <p className="text-xs text-gray-500">{selectedClient.age} y/o · {selectedClient.gender}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setSelectedClientId(''); setClientSearch('') }}
                    className="text-xs text-therapy-coral hover:underline"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search client name..."
                    value={clientSearch}
                    onChange={e => setClientSearch(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent text-sm"
                  />
                  {clientSearch && (
                    <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto">
                      {loadingClients ? (
                        <p className="px-4 py-3 text-sm text-gray-500">Loading...</p>
                      ) : filteredClients.length === 0 ? (
                        <p className="px-4 py-3 text-sm text-gray-500">No clients found</p>
                      ) : filteredClients.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => { setSelectedClientId(c.id); setClientSearch('') }}
                          className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 text-left"
                        >
                          <div className="w-7 h-7 bg-therapy-coral rounded-full flex items-center justify-center shrink-0">
                            <span className="text-white text-xs font-bold">
                              {c.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-therapy-navy">{c.full_name}</p>
                            <p className="text-xs text-gray-500">{c.age} y/o · {c.gender}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

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

            {/* Start time */}
            <div>
              <label className="block text-sm font-medium text-therapy-navy mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent text-sm"
              />
            </div>

            {/* End time */}
            <div>
              <label className="block text-sm font-medium text-therapy-navy mb-1">
                End Time
                {endTime && (
                  <span className="ml-2 text-xs text-gray-500 font-normal">({durationMinutes} min)</span>
                )}
              </label>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent text-sm"
              />
            </div>

            {/* Therapeutic modality */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-therapy-navy mb-1">Primary Therapeutic Approach</label>
              <input
                type="text"
                placeholder="e.g. Cognitive Behavioural Therapy, EMDR, Person-centred..."
                value={modality}
                onChange={e => setModality(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Previous session context */}
        {prevSession && <PreviousSessionPanel session={prevSession} />}

        {/* ── 2. Session Notes ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-therapy-navy mb-5">Session Notes</h2>

          {/* FREE TEXT — always at top, primary input */}
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
              {/* Microphone button */}
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

          {/* FORMAT SELECTOR + AI CONVERT */}
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

              {noteFormat !== 'Free' && (
                <button
                  type="button"
                  onClick={handleAIConvert}
                  disabled={!analysis.free_text.trim() || isConverting}
                  className={`ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    convertSuccess
                      ? 'bg-green-500 text-white'
                      : 'bg-therapy-navy text-white hover:bg-opacity-90 disabled:opacity-40'
                  }`}
                >
                  {isConverting ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Converting…
                    </>
                  ) : convertSuccess ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Converted!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      AI Convert
                    </>
                  )}
                </button>
              )}
            </div>
            {noteFormat !== 'Free' && (
              <p className="text-xs text-gray-400 mb-5">
                Write or dictate notes above, then click <strong>AI Convert</strong> to auto-fill the {noteFormat} fields. You can also fill them manually.
              </p>
            )}
          </div>

          {/* BIRP */}
          {noteFormat === 'BIRP' && (
            <div className="space-y-4">
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

          {/* DAP */}
          {noteFormat === 'DAP' && (
            <div className="space-y-4">
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

          {/* SOAP */}
          {noteFormat === 'SOAP' && (
            <div className="space-y-4">
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

        {/* ── 3. Session Tags ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-therapy-navy mb-1">Session Tags</h2>
          <p className="text-xs text-gray-400 mb-4">Label this session for easy filtering and tracking over time.</p>

          {/* Predefined tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            {PREDEFINED_SESSION_TAGS.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => togglePredefinedTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  analysis.tags.includes(tag)
                    ? 'bg-therapy-coral text-white'
                    : 'border border-gray-300 text-gray-600 hover:border-therapy-coral hover:text-therapy-coral'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Custom tag input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={customTagInput}
              onChange={e => setCustomTagInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addCustomTag()
                }
              }}
              placeholder="Add custom tag… (Enter or comma to add)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent text-sm"
            />
            <button
              type="button"
              onClick={addCustomTag}
              disabled={!customTagInput.trim()}
              className="px-4 py-2 bg-therapy-navy text-white rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>

          {/* Selected tags summary */}
          {analysis.tags.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Selected ({analysis.tags.length})</p>
              <div className="flex flex-wrap gap-2">
                {analysis.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-therapy-coral bg-opacity-10 text-therapy-coral rounded-full text-xs font-medium"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-600 transition-colors ml-0.5"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── 4. Mood, Affect & Interventions ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-therapy-navy mb-5">Client Presentation</h2>

          {/* Mood slider */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-therapy-navy">Mood Rating</label>
              <span className="text-sm font-semibold text-therapy-coral">
                {analysis.mood_rating} — {MOOD_LABELS[analysis.mood_rating]}
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={analysis.mood_rating}
              onChange={e => updateAnalysis('mood_rating', Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-therapy-coral"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>1 Severely distressed</span>
              <span>10 Thriving</span>
            </div>
          </div>

          {/* Affect */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-therapy-navy mb-2">Affect (observed)</label>
            <div className="flex flex-wrap gap-2">
              {AFFECT_OPTIONS.map(a => (
                <button
                  key={a}
                  type="button"
                  onClick={() => updateAnalysis('affect', analysis.affect === a ? '' : a)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                    analysis.affect === a
                      ? 'bg-therapy-navy text-white'
                      : 'border border-gray-300 text-gray-600 hover:border-therapy-navy hover:text-therapy-navy'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Interventions */}
          <div>
            <label className="block text-sm font-medium text-therapy-navy mb-2">Interventions Used</label>
            <div className="flex flex-wrap gap-2">
              {INTERVENTION_OPTIONS.map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleIntervention(i)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    analysis.interventions_used.includes(i)
                      ? 'bg-therapy-coral text-white'
                      : 'border border-gray-300 text-gray-600 hover:border-therapy-coral hover:text-therapy-coral'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── 5. Risk Assessment ── */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-5">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-base font-semibold text-amber-900">Risk Assessment</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Risk level */}
            <div>
              <label className="block text-sm font-medium text-amber-900 mb-2">Overall Risk Level</label>
              <div className="flex gap-2">
                {(['none', 'low', 'moderate', 'high'] as RiskLevel[]).map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => updateAnalysis('risk_level', level)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${
                      analysis.risk_level === level
                        ? level === 'none' ? 'bg-green-500 text-white'
                          : level === 'low' ? 'bg-blue-500 text-white'
                          : level === 'moderate' ? 'bg-orange-500 text-white'
                          : 'bg-red-600 text-white'
                        : 'border border-amber-300 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
              {(analysis.risk_level === 'moderate' || analysis.risk_level === 'high') && (
                <p className="mt-2 text-xs text-red-700 font-medium">
                  Document safety plan status and follow-up actions below.
                </p>
              )}
            </div>

            {/* Toggles */}
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200 cursor-pointer">
                <span className="text-sm text-amber-900">Suicidality screened</span>
                <button
                  type="button"
                  onClick={() => updateAnalysis('suicidality_screened', !analysis.suicidality_screened)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${analysis.suicidality_screened ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${analysis.suicidality_screened ? 'translate-x-5' : ''}`} />
                </button>
              </label>
              <label className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200 cursor-pointer">
                <span className="text-sm text-amber-900">Safety plan updated</span>
                <button
                  type="button"
                  onClick={() => updateAnalysis('safety_plan_updated', !analysis.safety_plan_updated)}
                  className={`relative w-10 h-5 rounded-full transition-colors ${analysis.safety_plan_updated ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${analysis.safety_plan_updated ? 'translate-x-5' : ''}`} />
                </button>
              </label>
            </div>

            {/* Risk notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-amber-900 mb-1">Risk Notes</label>
              <textarea
                rows={3}
                value={analysis.risk_notes}
                onChange={e => updateAnalysis('risk_notes', e.target.value)}
                placeholder="Document any risk-related observations, disclosures, or actions taken..."
                className="w-full px-4 py-3 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-400 focus:border-transparent resize-none text-sm bg-white"
              />
            </div>
          </div>
        </div>

        {/* ── 6. Homework ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-therapy-navy mb-5">Homework</h2>

          {/* Previous homework completion */}
          {prevSession && !!(prevSession.analysis as Record<string, unknown>)?.homework_assigned && (
            <div className="mb-5 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-1">Previous homework</p>
              <p className="text-sm text-blue-800 mb-3">
                {String((prevSession.analysis as Record<string, unknown>).homework_assigned)}
              </p>
              <div>
                <p className="text-xs font-medium text-blue-700 mb-2">Completion status</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    { v: 'completed', label: 'Completed' },
                    { v: 'partial', label: 'Partially' },
                    { v: 'not_completed', label: 'Not completed' },
                    { v: 'na', label: 'N/A' },
                  ] as { v: HomeworkCompletion; label: string }[]).map(({ v, label }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => updateAnalysis('homework_completion', v)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        analysis.homework_completion === v
                          ? 'bg-blue-600 text-white'
                          : 'border border-blue-300 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* New homework */}
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

        {/* ── 7. Next Session ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-therapy-navy mb-5">Planning</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-therapy-navy mb-1">Next Session Focus</label>
              <textarea
                rows={3}
                value={analysis.next_session_focus}
                onChange={e => updateAnalysis('next_session_focus', e.target.value)}
                placeholder="What should be prioritised in the next session?"
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent resize-none text-sm bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-therapy-navy mb-1">Follow-up Actions</label>
              <textarea
                rows={2}
                value={analysis.follow_up_actions}
                onChange={e => updateAnalysis('follow_up_actions', e.target.value)}
                placeholder="Referrals, letters to write, consultations needed, other actions..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent resize-none text-sm bg-gray-50 focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>

        {/* ── 8. Private Notes ── */}
        <div className="border-2 border-dashed border-gray-300 rounded-xl p-6">
          <div className="flex items-start space-x-3 mb-4">
            <svg className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-gray-600">Private Process Notes</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Not part of the official clinical record. Personal impressions, hypotheses, countertransference reactions.
              </p>
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
          <Link href="/sessions" className="text-sm text-gray-500 hover:text-therapy-navy">Cancel</Link>
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

// ─── Page export (wrap in Suspense for useSearchParams) ───────────────────────

export default function NewSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-therapy-coral" />
      </div>
    }>
      <NewSessionForm />
    </Suspense>
  )
}
