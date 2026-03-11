'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient, type ClientData, type IntakeAnalysis } from '@/lib/api'

interface BasicFormData {
  fullName: string
  age: string
  gender: string
  customGender: string
  background: string
}

interface FormErrors {
  fullName?: string
  age?: string
  gender?: string
  background?: string
  general?: string
}

type MicState = 'idle' | 'recording' | 'transcribing'

const genderOptions = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  { value: 'other', label: 'Other...' },
]

const clinicalFields: { key: keyof IntakeAnalysis; label: string; description: string; rows: number }[] = [
  {
    key: 'presenting_problem',
    label: 'Presenting Problem',
    description: 'The main reasons the client is seeking therapy',
    rows: 3,
  },
  {
    key: 'clinical_symptoms',
    label: 'Clinical Symptoms / Syndrome',
    description: 'Symptom clusters — depressive, panic, trauma-related, OCD, social anxiety, etc.',
    rows: 3,
  },
  {
    key: 'diagnosis',
    label: 'Diagnosis',
    description: 'Based on DSM-5 / ICD-11 framework where applicable',
    rows: 2,
  },
  {
    key: 'case_formulation',
    label: 'Case Formulation',
    description: 'What the problem is, how it developed, what keeps it going, protective factors, treatment approach',
    rows: 5,
  },
  {
    key: 'risk_level',
    label: 'Risk Level',
    description: 'Assessment for self-harm, suicide, harm to others, abuse, or severe impairment',
    rows: 2,
  },
  {
    key: 'functioning_severity',
    label: 'Functioning & Severity',
    description: 'Impact on daily life, work, relationships, sleep, concentration, self-care',
    rows: 3,
  },
  {
    key: 'personality_patterns',
    label: 'Developmental & Personality Patterns',
    description: 'Recurring interpersonal patterns — perfectionism, dependency, dysregulation, insecure attachment, avoidance',
    rows: 3,
  },
  {
    key: 'strengths_resources',
    label: 'Strengths & Resources',
    description: 'Resilience, insight, motivation, support systems, coping skills, values, goals',
    rows: 3,
  },
]

export default function NewClientPage() {
  const router = useRouter()

  // Step state
  const [step, setStep] = useState<1 | 2>(1)

  // Basic form
  const [basicForm, setBasicForm] = useState<BasicFormData>({
    fullName: '',
    age: '',
    gender: '',
    customGender: '',
    background: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Microphone
  const [micState, setMicState] = useState<MicState>('idle')
  const [micError, setMicError] = useState('')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Step 2 — clinical assessment
  const [assessment, setAssessment] = useState<IntakeAnalysis>({
    presenting_problem: '',
    clinical_symptoms: '',
    diagnosis: '',
    case_formulation: '',
    risk_level: '',
    functioning_severity: '',
    personality_patterns: '',
    strengths_resources: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')


  // ── Validation ──────────────────────────────────────────────
  const validateBasic = (): boolean => {
    const newErrors: FormErrors = {}
    if (!basicForm.fullName.trim()) newErrors.fullName = 'Client name is required'
    else if (basicForm.fullName.trim().length < 2) newErrors.fullName = 'Name must be at least 2 characters'
    if (!basicForm.age) newErrors.age = 'Age is required'
    else if (isNaN(Number(basicForm.age)) || Number(basicForm.age) < 0 || Number(basicForm.age) > 120)
      newErrors.age = 'Age must be between 0 and 120'
    if (!basicForm.gender) newErrors.gender = 'Gender selection is required'
    if (!basicForm.background.trim())
      newErrors.background = 'Background is required to generate the clinical preview'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const clearError = (name: keyof FormErrors) => {
    if (errors[name]) setErrors(prev => { const e = { ...prev }; delete e[name]; return e })
  }

  const handleFieldChange = (name: keyof BasicFormData, value: string) => {
    setBasicForm(prev => ({ ...prev, [name]: value }))
    clearError(name as keyof FormErrors)
  }

  // ── Microphone ───────────────────────────────────────────────
  const startRecording = useCallback(async () => {
    setMicError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      audioChunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })

      recorder.ondataavailable = e => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null

        setMicState('transcribing')
        try {
          const blob = new Blob(audioChunksRef.current, { type: mimeType })
          const text = await apiClient.speechToText(blob, 'recording.webm')
          if (text.trim()) {
            setBasicForm(prev => ({
              ...prev,
              background: prev.background
                ? `${prev.background} ${text.trim()}`
                : text.trim(),
            }))
            clearError('background')
          }
        } catch (err) {
          setMicError(err instanceof Error ? err.message : 'Transcription failed. Please try again.')
        } finally {
          setMicState('idle')
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start(250) // collect chunks every 250ms
      setMicState('recording')
    } catch (err) {
      setMicError('Microphone access denied. Please allow microphone permission.')
      setMicState('idle')
    }
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const toggleMic = () => {
    if (micState === 'idle') startRecording()
    else if (micState === 'recording') stopRecording()
  }

  // ── Generate preview ─────────────────────────────────────────
  const handleGeneratePreview = async () => {
    if (!validateBasic()) return
    setIsAnalyzing(true)
    try {
      const result = await apiClient.analyzeIntake({
        background: basicForm.background,
        name: basicForm.fullName,
        age: parseInt(basicForm.age),
        gender: basicForm.gender,
      })
      setAssessment(result)
      setStep(2)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Failed to generate clinical preview. Please try again.' })
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ── Submit ────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const clientData: ClientData = {
        full_name: basicForm.fullName,
        age: parseInt(basicForm.age),
        gender: basicForm.gender,
        custom_gender: basicForm.gender === 'other' ? basicForm.customGender : undefined,
        background: basicForm.background || undefined,
        notes: JSON.stringify(assessment),
      }
      const newClient = await apiClient.createClient(clientData)
      router.push(`/clients/${newClient.id}?created=true`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create client profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Link
            href="/clients"
            className="text-therapy-coral hover:opacity-80 transition-opacity mb-3 inline-flex items-center text-sm"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Clients
          </Link>
          <h1 className="text-3xl font-bold text-therapy-navy">New Client Profile</h1>

          {/* Step indicator */}
          <div className="mt-3 flex items-center space-x-2">
            <button
              onClick={() => step === 2 && setStep(1)}
              className="flex items-center text-sm"
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-1.5 ${step === 1 ? 'bg-therapy-coral text-white' : 'bg-green-500 text-white'}`}>
                {step > 1 ? '✓' : '1'}
              </span>
              <span className={step === 1 ? 'text-therapy-coral font-medium' : 'text-green-600'}>Basic Info</span>
            </button>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="flex items-center text-sm">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-1.5 ${step === 2 ? 'bg-therapy-coral text-white' : 'bg-gray-200 text-gray-400'}`}>
                2
              </span>
              <span className={step === 2 ? 'text-therapy-coral font-medium' : 'text-gray-400'}>Clinical Preview</span>
            </span>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* ══ STEP 1 ══════════════════════════════════════════════════ */}
        {step === 1 && (
          <div className="space-y-6">
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-800 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-xl font-semibold text-therapy-navy mb-6">Basic Information</h2>
              <div className="space-y-6">

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-therapy-navy mb-1">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="fullName"
                    value={basicForm.fullName}
                    onChange={e => handleFieldChange('fullName', e.target.value)}
                    placeholder="e.g. Jordan Smith"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent transition-colors ${errors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                </div>

                {/* Age */}
                <div>
                  <label htmlFor="age" className="block text-sm font-medium text-therapy-navy mb-1">
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="age"
                    min="0"
                    max="120"
                    value={basicForm.age}
                    onChange={e => handleFieldChange('age', e.target.value)}
                    placeholder="25"
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent transition-colors ${errors.age ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
                  />
                  {errors.age && <p className="mt-1 text-sm text-red-600">{errors.age}</p>}
                </div>

                {/* Gender */}
                <div>
                  <fieldset>
                    <legend className="block text-sm font-medium text-therapy-navy mb-3">
                      Gender <span className="text-red-500">*</span>
                    </legend>
                    <div className="space-y-2">
                      {genderOptions.map(option => (
                        <div key={option.value} className="flex items-center">
                          <input
                            type="radio"
                            id={`gender-${option.value}`}
                            name="gender"
                            value={option.value}
                            checked={basicForm.gender === option.value}
                            onChange={e => handleFieldChange('gender', e.target.value)}
                            className="h-4 w-4 text-therapy-coral focus:ring-therapy-coral border-gray-300"
                          />
                          <label htmlFor={`gender-${option.value}`} className="ml-3 text-sm text-therapy-navy">
                            {option.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    {basicForm.gender === 'other' && (
                      <input
                        type="text"
                        placeholder="Please specify"
                        value={basicForm.customGender}
                        onChange={e => handleFieldChange('customGender', e.target.value)}
                        className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-therapy-coral focus:border-transparent"
                      />
                    )}
                    {errors.gender && <p className="mt-2 text-sm text-red-600">{errors.gender}</p>}
                  </fieldset>
                </div>
              </div>
            </div>

            {/* Background */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-therapy-navy">Client Background</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Describe presenting concerns, history, referral source, and relevant context. The AI will use this to generate a clinical assessment preview.
                    </p>
                  </div>
                  {/* Mic button */}
                  <button
                    type="button"
                    onClick={toggleMic}
                    disabled={micState === 'transcribing'}
                    title={micState === 'recording' ? 'Stop recording' : micState === 'transcribing' ? 'Transcribing...' : 'Record background via microphone'}
                    className={`ml-4 shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                      micState === 'recording'
                        ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200 animate-pulse'
                        : micState === 'transcribing'
                        ? 'bg-gray-200 cursor-not-allowed'
                        : 'bg-therapy-coral bg-opacity-10 hover:bg-opacity-20 text-therapy-coral'
                    }`}
                  >
                    {micState === 'transcribing' ? (
                      <svg className="animate-spin w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className={`w-5 h-5 ${micState === 'recording' ? 'text-white' : 'text-therapy-coral'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Mic status */}
                {micState === 'recording' && (
                  <p className="mt-2 text-xs text-red-500 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-pulse" />
                    Recording... click the microphone to stop
                  </p>
                )}
                {micState === 'transcribing' && (
                  <p className="mt-2 text-xs text-gray-500">Transcribing with Voxtral...</p>
                )}
                {micError && (
                  <p className="mt-2 text-xs text-red-600">{micError}</p>
                )}
              </div>

              <textarea
                rows={10}
                value={basicForm.background}
                onChange={e => {
                  handleFieldChange('background', e.target.value)
                }}
                placeholder="e.g. Client is a 28-year-old self-referred professional seeking support for work-related stress and anxiety. Reports persistent worry, sleep difficulties, and difficulty concentrating over the past 6 months following a promotion. No prior therapy history. Family background includes high parental expectations and older sibling with depression..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent resize-none transition-colors ${errors.background ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}
              />

              <div className="mt-2">
                {errors.background
                  ? <p className="text-sm text-red-600">{errors.background}</p>
                  : <span className="text-xs text-gray-400">The more detail you provide, the better the AI analysis</span>
                }
              </div>

              {/* Security notice */}
              <div className="mt-4 flex items-start bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <svg className="w-4 h-4 text-gray-400 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-600">Your data is secure.</span> All client information is processed through Tinfoil's confidential compute infrastructure — your data remains encrypted and private at every stage, including during AI analysis and speech transcription.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <Link href="/clients" className="text-gray-600 hover:text-therapy-navy transition-colors text-sm">
                Cancel
              </Link>
              <button
                onClick={handleGeneratePreview}
                disabled={isAnalyzing}
                className="px-8 py-3 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isAnalyzing ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Generating Clinical Preview...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Generate Clinical Preview</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ══ STEP 2 ══════════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Summary banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-therapy-navy">{basicForm.fullName}</p>
                <p className="text-sm text-gray-600 mt-0.5">{basicForm.age} years old · {basicForm.gender}</p>
              </div>
              <button onClick={() => setStep(1)} className="text-sm text-therapy-coral hover:underline">
                Edit basic info
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-therapy-navy">Clinical Assessment Preview</h2>
                <p className="text-sm text-gray-500 mt-1">
                  AI-generated from the background you provided. Review and edit each field before saving.
                </p>
              </div>

              <div className="space-y-6">
                {clinicalFields.map((field, idx) => (
                  <div key={field.key} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                    <label htmlFor={`field-${field.key}`} className="block mb-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-therapy-coral bg-opacity-15 text-therapy-coral text-xs font-bold mr-2">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-semibold text-therapy-navy">{field.label}</span>
                      <p className="text-xs text-gray-400 mt-0.5 ml-7">{field.description}</p>
                    </label>
                    <textarea
                      id={`field-${field.key}`}
                      rows={field.rows}
                      value={assessment[field.key]}
                      onChange={e => setAssessment(prev => ({ ...prev, [field.key]: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent resize-none text-sm text-gray-800 bg-gray-50 focus:bg-white transition-colors"
                    />
                  </div>
                ))}
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
                <svg className="w-5 h-5 text-red-400 mr-2 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 15c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <p className="text-red-800 text-sm">{submitError}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(1)}
                className="text-gray-600 hover:text-therapy-navy transition-colors flex items-center text-sm"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Creating Profile...</span>
                  </>
                ) : (
                  <span>Create Client Profile</span>
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
