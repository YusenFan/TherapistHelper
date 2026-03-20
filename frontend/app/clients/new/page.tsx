'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiClient, type ClientData, type IntakeAnalysis } from '@/lib/api'

// ── Form data shape ──────────────────────────────────────────
interface BasicFormData {
  // Identity
  fullName: string
  preferredName: string
  dateOfBirth: string
  // Contact
  email: string
  phone: string
  // Gender & Identity
  administrativeSex: string
  genderIdentity: string
  genderIdentityOther: string
  pronouns: string
  sexualOrientation: string
  sexualOrientationOther: string
  // Race & Ethnicity
  raceValues: string[]
  raceOther: string
  ethnicityValues: string[]
  ethnicityOther: string
  // Language
  languageCodes: string[]
  // Lifestyle
  smokingStatus: string
  maritalStatus: string
  employmentStatus: string
  occupationTitle: string
  religiousSpiritualAffiliation: string
  // Clinical
  background: string
}

interface FormErrors {
  fullName?: string
  background?: string
  general?: string
}

type MicState = 'idle' | 'recording' | 'transcribing'

// ── Option sets ──────────────────────────────────────────────
const administrativeSexOptions = [
  { value: '', label: 'Select...' },
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'intersex', label: 'Intersex' },
  { value: 'unknown', label: 'Unknown' },
]

const genderIdentityOptions = [
  { value: '', label: 'Select...' },
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'non-binary', label: 'Non-binary' },
  { value: 'transgender_woman', label: 'Transgender Woman' },
  { value: 'transgender_man', label: 'Transgender Man' },
  { value: 'genderqueer', label: 'Genderqueer' },
  { value: 'genderfluid', label: 'Genderfluid' },
  { value: 'agender', label: 'Agender' },
  { value: 'two_spirit', label: 'Two-Spirit' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'other', label: 'Other...' },
]

const pronounsOptions = [
  { value: '', label: 'Select...' },
  { value: 'she/her', label: 'She/Her' },
  { value: 'he/him', label: 'He/Him' },
  { value: 'they/them', label: 'They/Them' },
  { value: 'she/they', label: 'She/They' },
  { value: 'he/they', label: 'He/They' },
  { value: 'ze/zir', label: 'Ze/Zir' },
  { value: 'any', label: 'Any pronouns' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const sexualOrientationOptions = [
  { value: '', label: 'Select...' },
  { value: 'heterosexual', label: 'Heterosexual / Straight' },
  { value: 'gay', label: 'Gay' },
  { value: 'lesbian', label: 'Lesbian' },
  { value: 'bisexual', label: 'Bisexual' },
  { value: 'pansexual', label: 'Pansexual' },
  { value: 'asexual', label: 'Asexual' },
  { value: 'queer', label: 'Queer' },
  { value: 'questioning', label: 'Questioning' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'other', label: 'Other...' },
]

const raceOptions = [
  { value: 'american_indian_alaska_native', label: 'American Indian / Alaska Native' },
  { value: 'asian', label: 'Asian' },
  { value: 'black_african_american', label: 'Black / African American' },
  { value: 'native_hawaiian_pacific_islander', label: 'Native Hawaiian / Pacific Islander' },
  { value: 'white', label: 'White' },
  { value: 'multiracial', label: 'Multiracial' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const ethnicityOptions = [
  { value: 'hispanic_latino', label: 'Hispanic / Latino' },
  { value: 'not_hispanic_latino', label: 'Not Hispanic / Latino' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'zh', label: 'Chinese (Mandarin)' },
  { value: 'yue', label: 'Chinese (Cantonese)' },
  { value: 'tl', label: 'Tagalog' },
  { value: 'vi', label: 'Vietnamese' },
  { value: 'ar', label: 'Arabic' },
  { value: 'fr', label: 'French' },
  { value: 'ko', label: 'Korean' },
  { value: 'ru', label: 'Russian' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'ja', label: 'Japanese' },
  { value: 'de', label: 'German' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ms', label: 'Malay' },
  { value: 'other', label: 'Other' },
]

const smokingStatusOptions = [
  { value: '', label: 'Select...' },
  { value: 'never', label: 'Never smoker' },
  { value: 'former', label: 'Former smoker' },
  { value: 'current_daily', label: 'Current daily smoker' },
  { value: 'current_occasional', label: 'Current occasional smoker' },
  { value: 'unknown', label: 'Unknown' },
]

const maritalStatusOptions = [
  { value: '', label: 'Select...' },
  { value: 'single', label: 'Single' },
  { value: 'married', label: 'Married' },
  { value: 'domestic_partnership', label: 'Domestic Partnership' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'separated', label: 'Separated' },
  { value: 'widowed', label: 'Widowed' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const employmentStatusOptions = [
  { value: '', label: 'Select...' },
  { value: 'employed_full_time', label: 'Employed (Full-time)' },
  { value: 'employed_part_time', label: 'Employed (Part-time)' },
  { value: 'self_employed', label: 'Self-employed' },
  { value: 'unemployed', label: 'Unemployed' },
  { value: 'student', label: 'Student' },
  { value: 'retired', label: 'Retired' },
  { value: 'disabled', label: 'Disabled' },
  { value: 'homemaker', label: 'Homemaker' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const clinicalFields: { key: keyof IntakeAnalysis; label: string; description: string; rows: number; group?: string }[] = [
  {
    key: 'identification',
    label: 'Identification',
    description: 'Brief identifying summary — age, gender, referral source, presenting appearance',
    rows: 2,
  },
  {
    key: 'presenting_problem',
    label: 'History of Present Problem',
    description: 'Main reasons for seeking therapy, onset, duration, severity, triggers',
    rows: 4,
  },
  {
    key: 'psychiatric_history',
    label: 'Psychiatric History',
    description: 'Past psychiatric/psychological treatment, hospitalizations, previous diagnoses, medications tried',
    rows: 3,
  },
  {
    key: 'trauma_history',
    label: 'Trauma History',
    description: 'History of trauma — abuse, neglect, accidents, violence, significant losses',
    rows: 3,
  },
  {
    key: 'family_psychiatric_history',
    label: 'Family Psychiatric History',
    description: 'Mental health history in family — diagnoses, substance use, suicide, hospitalizations among relatives',
    rows: 3,
  },
  {
    key: 'medical_history',
    label: 'Medical Condition & History',
    description: 'Current and past medical conditions, surgeries, chronic illnesses',
    rows: 3,
  },
  {
    key: 'current_medications',
    label: 'Current Medications',
    description: 'All current medications including psychiatric, medical, supplements, dosages',
    rows: 2,
  },
  {
    key: 'substance_use',
    label: 'Substance Use',
    description: 'Current and past use of alcohol, drugs, tobacco — frequency, quantity, dependence history',
    rows: 3,
  },
  {
    key: 'family_history',
    label: 'Family History',
    description: 'Family composition, dynamics, relationships, upbringing, current family support',
    rows: 3,
  },
  {
    key: 'social_history',
    label: 'Social History',
    description: 'Social relationships, support network, living situation, daily activities, isolation patterns',
    rows: 3,
  },
  {
    key: 'spiritual_cultural_factors',
    label: 'Spiritual / Cultural Factors',
    description: 'Religious/spiritual beliefs, cultural background, influence on coping and worldview',
    rows: 2,
  },
  {
    key: 'developmental_history',
    label: 'Developmental History',
    description: 'Early development, childhood milestones, attachment patterns, significant childhood experiences',
    rows: 3,
  },
  {
    key: 'educational_vocational_history',
    label: 'Educational / Vocational History',
    description: 'Education level, academic performance, work history, current employment, career concerns',
    rows: 3,
  },
  {
    key: 'legal_history',
    label: 'Legal History',
    description: 'Any legal involvement — arrests, custody issues, restraining orders, pending cases',
    rows: 2,
  },
  {
    key: 'snap_strengths',
    label: 'SNAP — Strengths',
    description: 'Resilience, insight, motivation, coping skills, values, accomplishments',
    rows: 3,
    group: 'snap',
  },
  {
    key: 'snap_needs',
    label: 'SNAP — Needs',
    description: 'Areas requiring support, unmet needs, treatment priorities',
    rows: 3,
    group: 'snap',
  },
  {
    key: 'snap_abilities',
    label: 'SNAP — Abilities',
    description: 'Functional capacities, skills, competencies, resources available',
    rows: 3,
    group: 'snap',
  },
  {
    key: 'snap_preferences',
    label: 'SNAP — Preferences',
    description: 'Preferred treatment approach, goals, what they want from therapy',
    rows: 3,
    group: 'snap',
  },
]

// ── Collapsible Section ──────────────────────────────────────
function Section({
  title,
  subtitle,
  defaultOpen = true,
  children,
}: {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-8 py-5 text-left"
      >
        <div>
          <h2 className="text-xl font-semibold text-therapy-navy">{title}</h2>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-8 pb-8 space-y-5">{children}</div>}
    </div>
  )
}

// ── Reusable field components ────────────────────────────────
function TextField({
  label,
  id,
  value,
  onChange,
  placeholder,
  required,
  error,
  type = 'text',
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  error?: string
  type?: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-therapy-navy mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent transition-colors text-sm ${
          error ? 'border-red-300 bg-red-50' : 'border-gray-300'
        }`}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

function SelectField({
  label,
  id,
  value,
  onChange,
  options,
}: {
  label: string
  id: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-therapy-navy mb-1">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent transition-colors text-sm bg-white"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function CheckboxGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (values: string[]) => void
}) {
  const toggle = (val: string) => {
    onChange(selected.includes(val) ? selected.filter(v => v !== val) : [...selected, val])
  }
  return (
    <div>
      <span className="block text-sm font-medium text-therapy-navy mb-2">{label}</span>
      <div className="flex flex-wrap gap-2">
        {options.map(o => (
          <button
            key={o.value}
            type="button"
            onClick={() => toggle(o.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              selected.includes(o.value)
                ? 'bg-therapy-coral text-white border-therapy-coral'
                : 'bg-white text-gray-600 border-gray-300 hover:border-therapy-coral hover:text-therapy-coral'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// Main Page
// ══════════════════════════════════════════════════════════════

export default function NewClientPage() {
  const router = useRouter()

  // Step state
  const [step, setStep] = useState<1 | 2>(1)

  // Basic form
  const [basicForm, setBasicForm] = useState<BasicFormData>({
    fullName: '',
    preferredName: '',
    dateOfBirth: '',
    email: '',
    phone: '',
    administrativeSex: '',
    genderIdentity: '',
    genderIdentityOther: '',
    pronouns: '',
    sexualOrientation: '',
    sexualOrientationOther: '',
    raceValues: [],
    raceOther: '',
    ethnicityValues: [],
    ethnicityOther: '',
    languageCodes: [],
    smokingStatus: '',
    maritalStatus: '',
    employmentStatus: '',
    occupationTitle: '',
    religiousSpiritualAffiliation: '',
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
    identification: '',
    presenting_problem: '',
    psychiatric_history: '',
    trauma_history: '',
    family_psychiatric_history: '',
    medical_history: '',
    current_medications: '',
    substance_use: '',
    family_history: '',
    social_history: '',
    spiritual_cultural_factors: '',
    developmental_history: '',
    educational_vocational_history: '',
    legal_history: '',
    snap_strengths: '',
    snap_needs: '',
    snap_abilities: '',
    snap_preferences: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // ── Helpers ────────────────────────────────────────────────
  const calculateAge = (dob: string): number | undefined => {
    if (!dob) return undefined
    const birth = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
    return age >= 0 && age <= 150 ? age : undefined
  }

  const computedAge = calculateAge(basicForm.dateOfBirth)

  const updateField = <K extends keyof BasicFormData>(key: K, value: BasicFormData[K]) => {
    setBasicForm(prev => ({ ...prev, [key]: value }))
    if (key in errors) setErrors(prev => { const e = { ...prev }; delete e[key as keyof FormErrors]; return e })
  }

  // ── Validation ─────────────────────────────────────────────
  const validateBasic = (): boolean => {
    const newErrors: FormErrors = {}
    if (!basicForm.fullName.trim()) newErrors.fullName = 'Client name is required'
    else if (basicForm.fullName.trim().length < 2) newErrors.fullName = 'Name must be at least 2 characters'
    if (!basicForm.background.trim())
      newErrors.background = 'Background is required to generate the clinical preview'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // ── Microphone ─────────────────────────────────────────────
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
        stream.getTracks().forEach(t => t.stop())
        streamRef.current = null
        setMicState('transcribing')
        try {
          const blob = new Blob(audioChunksRef.current, { type: mimeType })
          const text = await apiClient.speechToText(blob, 'recording.webm')
          if (text.trim()) {
            setBasicForm(prev => ({
              ...prev,
              background: prev.background ? `${prev.background} ${text.trim()}` : text.trim(),
            }))
          }
        } catch (err) {
          setMicError(err instanceof Error ? err.message : 'Transcription failed. Please try again.')
        } finally {
          setMicState('idle')
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start(250)
      setMicState('recording')
    } catch {
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

  // ── Generate preview ───────────────────────────────────────
  const handleGeneratePreview = async () => {
    if (!validateBasic()) return
    setIsAnalyzing(true)
    try {
      const result = await apiClient.analyzeIntake({
        background: basicForm.background,
        name: basicForm.fullName,
        age: computedAge,
        gender: basicForm.genderIdentity || undefined,
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

  // ── Submit ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError('')
    try {
      const clientData: ClientData = {
        full_name: basicForm.fullName,
        preferred_name: basicForm.preferredName || undefined,
        date_of_birth: basicForm.dateOfBirth || undefined,
        approximate_age: computedAge,
        administrative_sex: basicForm.administrativeSex || undefined,
        gender_identity: basicForm.genderIdentity || undefined,
        gender_identity_other: basicForm.genderIdentity === 'other' ? basicForm.genderIdentityOther || undefined : undefined,
        pronouns: basicForm.pronouns || undefined,
        sexual_orientation: basicForm.sexualOrientation || undefined,
        sexual_orientation_other: basicForm.sexualOrientation === 'other' ? basicForm.sexualOrientationOther || undefined : undefined,
        race_values: basicForm.raceValues.length > 0 ? basicForm.raceValues : undefined,
        race_other: basicForm.raceValues.includes('other') ? basicForm.raceOther || undefined : undefined,
        ethnicity_values: basicForm.ethnicityValues.length > 0 ? basicForm.ethnicityValues : undefined,
        ethnicity_other: basicForm.ethnicityValues.includes('other') ? basicForm.ethnicityOther || undefined : undefined,
        language_codes: basicForm.languageCodes.length > 0 ? basicForm.languageCodes : undefined,
        smoking_status: basicForm.smokingStatus || undefined,
        marital_status: basicForm.maritalStatus || undefined,
        employment_status: basicForm.employmentStatus || undefined,
        occupation_title: basicForm.occupationTitle || undefined,
        religious_spiritual_affiliation: basicForm.religiousSpiritualAffiliation || undefined,
        email: basicForm.email || undefined,
        phone: basicForm.phone || undefined,
        background_summary: basicForm.background || undefined,
      }

      // Remove undefined keys
      const cleanData = Object.fromEntries(
        Object.entries(clientData).filter(([, v]) => v !== undefined)
      ) as ClientData

      const newClient = await apiClient.createClient(cleanData)

      // Save the clinical assessment
      const assessmentData: Record<string, string> = {}
      for (const [key, value] of Object.entries(assessment)) {
        if (value && value.trim()) {
          // Map 'identification' to 'identification_summary' for the DB field name
          const dbKey = key === 'identification' ? 'identification_summary' : key
          assessmentData[dbKey] = value.trim()
        }
      }
      if (Object.keys(assessmentData).length > 0) {
        try {
          await apiClient.createClinicalAssessment({
            client_id: newClient.id,
            assessment_type: 'intake',
            is_current: true,
            ...assessmentData,
          })
        } catch (err) {
          console.error('Failed to save clinical assessment:', err)
        }
      }

      router.push(`/clients/${newClient.id}?created=true`)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create client profile. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────
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
            <button onClick={() => step === 2 && setStep(1)} className="flex items-center text-sm">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-1.5 ${step === 1 ? 'bg-therapy-coral text-white' : 'bg-green-500 text-white'}`}>
                {step > 1 ? '\u2713' : '1'}
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

        {/* ══ STEP 1 ═════════════════════════════════════════════ */}
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

            {/* ── Basic Information ─────────────────────────────── */}
            <Section title="Basic Information" subtitle="Only the client name is required. All other fields are optional.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextField
                  label="Client Name"
                  id="fullName"
                  value={basicForm.fullName}
                  onChange={v => updateField('fullName', v)}
                  placeholder="e.g. Jordan Smith"
                  required
                  error={errors.fullName}
                />
                <TextField
                  label="Preferred Name"
                  id="preferredName"
                  value={basicForm.preferredName}
                  onChange={v => updateField('preferredName', v)}
                  placeholder="e.g. Jo"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextField
                  label="Date of Birth"
                  id="dateOfBirth"
                  type="date"
                  value={basicForm.dateOfBirth}
                  onChange={v => updateField('dateOfBirth', v)}
                />
                <div>
                  <label className="block text-sm font-medium text-therapy-navy mb-1">Age</label>
                  <p className="px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50 text-sm text-therapy-navy">
                    {computedAge != null ? `${computedAge} years old` : 'Auto-calculated from date of birth'}
                  </p>
                </div>
              </div>
            </Section>

            {/* ── Contact ──────────────────────────────────────── */}
            <Section title="Contact Information" defaultOpen={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <TextField
                  label="Email"
                  id="email"
                  type="email"
                  value={basicForm.email}
                  onChange={v => updateField('email', v)}
                  placeholder="client@example.com"
                />
                <TextField
                  label="Phone"
                  id="phone"
                  type="tel"
                  value={basicForm.phone}
                  onChange={v => updateField('phone', v)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </Section>

            {/* ── Gender & Identity ────────────────────────────── */}
            <Section title="Gender & Identity" defaultOpen={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectField
                  label="Administrative Sex"
                  id="administrativeSex"
                  value={basicForm.administrativeSex}
                  onChange={v => updateField('administrativeSex', v)}
                  options={administrativeSexOptions}
                />
                <SelectField
                  label="Gender Identity"
                  id="genderIdentity"
                  value={basicForm.genderIdentity}
                  onChange={v => updateField('genderIdentity', v)}
                  options={genderIdentityOptions}
                />
              </div>
              {basicForm.genderIdentity === 'other' && (
                <TextField
                  label="Gender Identity (specify)"
                  id="genderIdentityOther"
                  value={basicForm.genderIdentityOther}
                  onChange={v => updateField('genderIdentityOther', v)}
                  placeholder="Please specify"
                />
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectField
                  label="Pronouns"
                  id="pronouns"
                  value={basicForm.pronouns}
                  onChange={v => updateField('pronouns', v)}
                  options={pronounsOptions}
                />
                <SelectField
                  label="Sexual Orientation"
                  id="sexualOrientation"
                  value={basicForm.sexualOrientation}
                  onChange={v => updateField('sexualOrientation', v)}
                  options={sexualOrientationOptions}
                />
              </div>
              {basicForm.sexualOrientation === 'other' && (
                <TextField
                  label="Sexual Orientation (specify)"
                  id="sexualOrientationOther"
                  value={basicForm.sexualOrientationOther}
                  onChange={v => updateField('sexualOrientationOther', v)}
                  placeholder="Please specify"
                />
              )}
            </Section>

            {/* ── Race, Ethnicity & Language ────────────────────── */}
            <Section title="Race, Ethnicity & Language" defaultOpen={false}>
              <CheckboxGroup
                label="Race"
                options={raceOptions}
                selected={basicForm.raceValues}
                onChange={v => updateField('raceValues', v)}
              />
              {basicForm.raceValues.includes('other') && (
                <TextField
                  label="Race (specify)"
                  id="raceOther"
                  value={basicForm.raceOther}
                  onChange={v => updateField('raceOther', v)}
                  placeholder="Please specify"
                />
              )}
              <CheckboxGroup
                label="Ethnicity"
                options={ethnicityOptions}
                selected={basicForm.ethnicityValues}
                onChange={v => updateField('ethnicityValues', v)}
              />
              <CheckboxGroup
                label="Languages Spoken"
                options={languageOptions}
                selected={basicForm.languageCodes}
                onChange={v => updateField('languageCodes', v)}
              />
            </Section>

            {/* ── Lifestyle & Social ───────────────────────────── */}
            <Section title="Lifestyle & Social" defaultOpen={false}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectField
                  label="Smoking Status"
                  id="smokingStatus"
                  value={basicForm.smokingStatus}
                  onChange={v => updateField('smokingStatus', v)}
                  options={smokingStatusOptions}
                />
                <SelectField
                  label="Marital Status"
                  id="maritalStatus"
                  value={basicForm.maritalStatus}
                  onChange={v => updateField('maritalStatus', v)}
                  options={maritalStatusOptions}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <SelectField
                  label="Employment Status"
                  id="employmentStatus"
                  value={basicForm.employmentStatus}
                  onChange={v => updateField('employmentStatus', v)}
                  options={employmentStatusOptions}
                />
                <TextField
                  label="Occupation / Job Title"
                  id="occupationTitle"
                  value={basicForm.occupationTitle}
                  onChange={v => updateField('occupationTitle', v)}
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <TextField
                label="Religious / Spiritual Affiliation"
                id="religiousSpiritualAffiliation"
                value={basicForm.religiousSpiritualAffiliation}
                onChange={v => updateField('religiousSpiritualAffiliation', v)}
                placeholder="e.g. Christian, Buddhist, Agnostic, None"
              />
            </Section>

            {/* ── Background ──────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="mb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-therapy-navy">
                      Client Background <span className="text-red-500">*</span>
                    </h3>
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
                {micState === 'recording' && (
                  <p className="mt-2 text-xs text-red-500 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-1.5 animate-pulse" />
                    Recording... click the microphone to stop
                  </p>
                )}
                {micState === 'transcribing' && (
                  <p className="mt-2 text-xs text-gray-500">Transcribing with Voxtral...</p>
                )}
                {micError && <p className="mt-2 text-xs text-red-600">{micError}</p>}
              </div>

              <textarea
                rows={10}
                value={basicForm.background}
                onChange={e => updateField('background', e.target.value)}
                placeholder="e.g. Client is a 28-year-old self-referred professional seeking support for work-related stress and anxiety. Reports persistent worry, sleep difficulties, and difficulty concentrating over the past 6 months following a promotion. No prior therapy history. Family background includes high parental expectations and older sibling with depression..."
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent resize-none transition-colors ${
                  errors.background ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
              />
              <div className="mt-2">
                {errors.background
                  ? <p className="text-sm text-red-600">{errors.background}</p>
                  : <span className="text-xs text-gray-400">The more detail you provide, the better the AI analysis</span>}
              </div>

              {/* Security notice */}
              <div className="mt-4 flex items-start bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
                <svg className="w-4 h-4 text-gray-400 mt-0.5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <p className="text-xs text-gray-500">
                  <span className="font-medium text-gray-600">Your data is secure.</span> All client information is processed through Tinfoil&apos;s confidential compute infrastructure — your data remains encrypted and private at every stage, including during AI analysis and speech transcription.
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

        {/* ══ STEP 2 ═════════════════════════════════════════════ */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Summary banner */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 flex items-center justify-between">
              <div>
                <p className="font-semibold text-therapy-navy">
                  {basicForm.fullName}
                  {basicForm.preferredName && <span className="text-gray-500 font-normal"> ({basicForm.preferredName})</span>}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {[
                    computedAge != null && `${computedAge} years old`,
                    basicForm.genderIdentity && genderIdentityOptions.find(o => o.value === basicForm.genderIdentity)?.label,
                    basicForm.pronouns && pronounsOptions.find(o => o.value === basicForm.pronouns)?.label,
                  ].filter(Boolean).join(' \u00b7 ') || 'No demographic details provided'}
                </p>
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
                {clinicalFields.map((field, idx) => {
                  const isFirstSnap = field.group === 'snap' && (idx === 0 || clinicalFields[idx - 1].group !== 'snap')
                  return (
                    <div key={field.key}>
                      {isFirstSnap && (
                        <div className="mb-4 pt-2">
                          <h3 className="text-lg font-semibold text-therapy-navy">SNAP Assessment</h3>
                          <p className="text-xs text-gray-400 mt-0.5">Strengths, Needs, Abilities, and Preferences</p>
                        </div>
                      )}
                      <div className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
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
                    </div>
                  )
                })}
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
