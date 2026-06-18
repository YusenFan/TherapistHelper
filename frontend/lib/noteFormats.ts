// Built-in note formats and their default sections, plus the DSM-5 diagnosis
// picker list. Shared by the session editor, template editor, and client form.

export interface NoteFormatDef {
  key: string
  label: string
  sections: string[]
}

export const NOTE_FORMATS: NoteFormatDef[] = [
  { key: 'soap', label: 'SOAP', sections: ['Subjective', 'Objective', 'Assessment', 'Plan'] },
  { key: 'dap', label: 'DAP', sections: ['Data', 'Assessment', 'Plan'] },
  { key: 'birp', label: 'BIRP', sections: ['Behavior', 'Intervention', 'Response', 'Plan'] },
  { key: 'girp', label: 'GIRP', sections: ['Goal', 'Intervention', 'Response', 'Plan'] },
  {
    key: 'mse_intake',
    label: 'Mental Status Exam',
    sections: [
      'Appearance', 'Behavior', 'Speech', 'Mood', 'Affect', 'Thought Process',
      'Thought Content', 'Perception', 'Cognition', 'Insight & Judgment',
    ],
  },
  {
    key: 'enhanced_soap',
    label: 'Enhanced SOAP',
    sections: ['Subjective', 'Objective', 'Mental Status Exam', 'Assessment', 'Interventions', 'Plan'],
  },
  { key: 'pirp', label: 'PIRP', sections: ['Problem', 'Intervention', 'Response', 'Plan'] },
  { key: 'sirp', label: 'SIRP', sections: ['Situation', 'Intervention', 'Response', 'Plan'] },
  { key: 'pie', label: 'PIE', sections: ['Problem', 'Intervention', 'Evaluation'] },
  {
    key: 'emdr',
    label: 'EMDR',
    sections: [
      'Target Memory', 'Negative Cognition', 'Positive Cognition', 'SUDs/VOC',
      'Desensitization', 'Installation', 'Body Scan', 'Closure',
    ],
  },
]

export const CUSTOM_FORMAT_KEY = 'custom'

export function formatLabel(key?: string): string {
  if (!key) return '—'
  if (key === CUSTOM_FORMAT_KEY) return 'Custom'
  return NOTE_FORMATS.find(f => f.key === key)?.label ?? key.toUpperCase()
}

export function sectionsForFormat(key: string): string[] {
  return NOTE_FORMATS.find(f => f.key === key)?.sections ?? []
}

export const CLIENT_TYPES: { value: string; label: string }[] = [
  { value: 'individual', label: 'Individual' },
  { value: 'couple', label: 'Couple' },
  { value: 'family', label: 'Family' },
  { value: 'child_adolescent', label: 'Child / Adolescent (C/A)' },
]

export function clientTypeLabel(value?: string): string {
  return CLIENT_TYPES.find(t => t.value === value)?.label ?? value ?? '—'
}

// Curated DSM-5-TR / ICD-10 diagnosis list for the picker. Display "code — label".
export const DSM5_DIAGNOSES: string[] = [
  'F32.9 — Major Depressive Disorder, single episode, unspecified',
  'F33.9 — Major Depressive Disorder, recurrent, unspecified',
  'F34.1 — Persistent Depressive Disorder (Dysthymia)',
  'F41.1 — Generalized Anxiety Disorder',
  'F41.0 — Panic Disorder',
  'F40.10 — Social Anxiety Disorder',
  'F40.00 — Agoraphobia',
  'F40.2 — Specific Phobia',
  'F42.2 — Obsessive-Compulsive Disorder',
  'F43.10 — Post-Traumatic Stress Disorder',
  'F43.0 — Acute Stress Disorder',
  'F43.20 — Adjustment Disorder',
  'F43.21 — Adjustment Disorder with depressed mood',
  'F43.22 — Adjustment Disorder with anxiety',
  'F31.9 — Bipolar I Disorder, unspecified',
  'F31.81 — Bipolar II Disorder',
  'F34.0 — Cyclothymic Disorder',
  'F20.9 — Schizophrenia',
  'F25.0 — Schizoaffective Disorder',
  'F90.2 — ADHD, combined presentation',
  'F90.0 — ADHD, predominantly inattentive',
  'F90.1 — ADHD, predominantly hyperactive/impulsive',
  'F84.0 — Autism Spectrum Disorder',
  'F50.00 — Anorexia Nervosa',
  'F50.2 — Bulimia Nervosa',
  'F50.81 — Binge-Eating Disorder',
  'F10.20 — Alcohol Use Disorder, moderate/severe',
  'F11.20 — Opioid Use Disorder, moderate/severe',
  'F12.20 — Cannabis Use Disorder, moderate/severe',
  'F60.3 — Borderline Personality Disorder',
  'F60.7 — Dependent Personality Disorder',
  'F60.6 — Avoidant Personality Disorder',
  'F60.81 — Narcissistic Personality Disorder',
  'F60.2 — Antisocial Personality Disorder',
  'F60.5 — Obsessive-Compulsive Personality Disorder',
  'F51.01 — Insomnia Disorder',
  'F45.1 — Somatic Symptom Disorder',
  'F63.81 — Intermittent Explosive Disorder',
  'F91.3 — Oppositional Defiant Disorder',
  'F93.0 — Separation Anxiety Disorder',
  'Z63.0 — Relationship Distress with Partner',
  'Z03.89 — No Diagnosis / Deferred',
]
