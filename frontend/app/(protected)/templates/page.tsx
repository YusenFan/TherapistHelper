'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { apiClient, type NoteTemplate, type NoteTemplateInput } from '@/lib/api'
import { CUSTOM_FORMAT_KEY, NOTE_FORMATS, formatLabel, sectionsForFormat } from '@/lib/noteFormats'
import {
  FALLBACK_DEFAULT_NOTE_TEMPLATE,
  setHideTemplateCopyPrompt,
  shouldShowTemplateCopyPrompt,
} from '@/lib/templatePreferences'

type CatalogTab = 'all' | 'intake' | 'progress' | 'client_summary' | 'therapy'
type TemplateSource = 'builtin' | 'custom'
type SectionFormat = 'paragraph' | 'bullets'

interface TemplateSectionDraft {
  id: string
  title: string
  example: string
  format: SectionFormat
}

interface CatalogTemplate {
  id: string
  value: string
  source: TemplateSource
  name: string
  description: string
  base_format: string
  sections: TemplateSectionDraft[]
  tags: string[]
  categories: CatalogTab[]
  template?: NoteTemplate
}

interface EditorDraft {
  id?: string
  name: string
  description: string
  base_format: string
  sections: TemplateSectionDraft[]
  tags: string[]
}

const CATALOG_TABS: { key: CatalogTab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'intake', label: 'Intake' },
  { key: 'progress', label: 'Progress' },
  { key: 'client_summary', label: 'Client summary' },
  { key: 'therapy', label: 'Therapy' },
]

const EXAMPLE_COPY: Record<string, string> = {
  Subjective:
    'The client reports feeling overwhelmed with their current workload and family responsibilities. They mention having difficulty sleeping and experiencing frequent headaches. The client expresses concern about their ability to manage stress effectively.',
  Objective:
    'The client is observed to have a tense posture and frequently rub their temples. They speak in a soft, monotone voice and avoid eye contact. Speech is clear and at a normal rate and volume.',
  Assessment:
    'The client presents with symptoms consistent with increased anxiety and situational stress. Insight is intact, and they remain motivated to practice coping strategies between sessions.',
  Plan:
    'Continue weekly therapy, practice paced breathing daily, and track sleep quality before the next session. Reassess stress level and coping effectiveness next visit.',
  Data:
    'Client discussed recent stressors, sleep disruption, and reduced interest in activities. Session focused on emotional regulation, problem solving, and identifying near-term supports.',
  Behavior:
    'Client arrived on time, appeared tired, and participated throughout the session. Affect was constricted but appropriate to the topics discussed.',
  Goal:
    'Client continues working toward reducing anxiety symptoms and improving follow-through with healthy routines.',
  Intervention:
    'Therapist used reflective listening, cognitive reframing, grounding practice, and collaborative planning to support skill use outside session.',
  Response:
    'Client was receptive to the interventions and identified two realistic actions to complete before the next appointment.',
  'Session Focus':
    'The session focused on work stress, strained family communication, sleep disruption, and building a short list of manageable next steps.',
  'Client Presentation':
    'Client appeared engaged and thoughtful, with moments of tearfulness when describing recent pressure at home.',
  Interventions:
    'Therapist provided validation, explored automatic thoughts, practiced grounding, and supported the client in prioritizing one achievable behavior change.',
  Progress:
    'Client demonstrated improved awareness of stress cues and reported using a breathing strategy twice since the previous session.',
  Appearance:
    'Client appeared stated age and well-groomed.',
  Speech:
    'Speech was clear, emotionally expressive at times, and engaged readily in conversation.',
  Mood:
    'Client reported feeling depressed, worried about family, and tired at home.',
  Affect:
    'Affect was congruent with the content discussed and included sadness, concern, and appropriate humor.',
  'Thought Process':
    'Thought process was linear and goal-directed, with occasional circumstantial details before returning to the main topic.',
  'Thought Content':
    'Client described guilt and responsibility related to recent events and denied suicidal ideation.',
  Perception:
    'No hallucinations, delusions, or perceptual disturbances were reported or observed.',
  Cognition:
    'Cognition appeared intact with good memory recall and orientation.',
  'Insight & Judgment':
    'Client demonstrated good insight into relational patterns and solid judgment about next steps.',
  'Mental Status Exam':
    '- Appearance: Client appeared stated age and well-groomed.\n- Behavior: Client maintained appropriate eye contact and activity level.\n- Speech: Speech was clear and at a normal rate.\n- Mood: Client reported feeling anxious and tired.\n- Affect: Affect was congruent with session content.\n- Thought Process: Thought process was linear and goal-directed.',
  Summary:
    'Client has made steady progress toward identifying triggers, using coping skills, and communicating needs more clearly across primary relationships.',
  Recommendations:
    'Continue weekly therapy, reinforce coping practice, and revisit treatment goals at the next care plan review.',
}

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
  soap:
    "Subjective, Objective, Assessment, and Plan. Track the client's progress, thoughts, behavioral changes, subjective experiences, and next clinical steps.",
  dap:
    'Data, Assessment, and Plan. A compact progress note for sessions where the clinical data and response can be documented together.',
  birp:
    'Behavior, Intervention, Response, and Plan. Useful when treatment work centers on observable behavior and intervention effectiveness.',
  girp:
    'Goal, Intervention, Response, and Plan. Keeps each note aligned to a treatment goal and the client response in session.',
  upheal:
    'A therapy-focused progress note with session focus, client presentation, interventions, progress, and plan.',
  mse_intake:
    'A structured mental status exam template covering appearance, behavior, speech, mood, affect, thought process, cognition, insight, and judgment.',
  enhanced_soap:
    'SOAP with additional mental status and intervention detail for sessions that need more clinical structure.',
  emdr:
    'A structured EMDR progress note for target memory, cognition, desensitization, installation, body scan, and closure.',
  client_summary:
    'A concise client summary for care coordination, case review, or quick clinical handoff.',
}

const BUILT_IN_ORDER = ['soap', 'dap', 'birp', 'girp', 'mse_intake', 'enhanced_soap', 'emdr']

function sectionId(title: string, index: number) {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${index}`
}

function makeSections(titles: string[]): TemplateSectionDraft[] {
  return titles.map((title, index) => ({
    id: sectionId(title, index),
    title,
    example: EXAMPLE_COPY[title] || 'Document clinically relevant observations, interventions, response, and next steps for this section.',
    format: title === 'Mental Status Exam' || title === 'MSE' ? 'bullets' : 'paragraph',
  }))
}

function isSectionFormat(value?: string): value is SectionFormat {
  return value === 'paragraph' || value === 'bullets'
}

function buildBuiltinTemplates(): CatalogTemplate[] {
  return BUILT_IN_ORDER.map((key) => {
    const format = NOTE_FORMATS.find((item) => item.key === key)
    if (!format) return null

    const categories: CatalogTab[] = ['progress', 'therapy']
    if (key === 'mse_intake') categories.push('intake')

    return {
      id: `builtin:${key}`,
      value: key,
      source: 'builtin',
      name: format.label,
      base_format: key,
      description: TEMPLATE_DESCRIPTIONS[key] || `${format.label} progress note template.`,
      sections: makeSections(format.sections),
      tags: ['Individuals', 'Therapy', 'Progress note'],
      categories,
    }
  }).filter(Boolean) as CatalogTemplate[]
}

const BUILT_IN_TEMPLATES = buildBuiltinTemplates()

function customTemplateToCatalog(template: NoteTemplate): CatalogTemplate {
  const baseFormat = template.base_format || CUSTOM_FORMAT_KEY
  const name = template.name || 'Untitled template'
  const stored = template.section_settings || []
  const description = template.description || TEMPLATE_DESCRIPTIONS[baseFormat] || `Custom template based on ${formatLabel(baseFormat)}.`
  const sections = makeSections(template.sections.length ? template.sections : sectionsForFormat(baseFormat))
    .map((section, index) => {
      const saved = stored.find((item) => item.title === section.title) || stored[index]
      if (!saved) return section

      return {
        ...section,
        example: saved.example || section.example,
        format: isSectionFormat(saved.format) ? saved.format : section.format,
      }
    })
  const categories: CatalogTab[] = ['progress', 'therapy']
  if (baseFormat === 'mse_intake' || /intake/i.test(name)) categories.push('intake')
  if (/summary/i.test(name)) categories.push('client_summary')

  return {
    id: `custom:${template.id}`,
    value: `template:${template.id}`,
    source: 'custom',
    name,
    base_format: baseFormat,
    description,
    sections,
    tags: ['Therapy', 'Progress note'],
    categories,
    template,
  }
}

function visibleRowTags(tags: string[]) {
  return tags.filter((tag) => tag !== 'Individuals')
}

function tagClass(tag: string) {
  if (/progress/i.test(tag)) return 'border-sky-200 bg-sky-50 text-sky-700'
  if (/individual/i.test(tag)) return 'border-amber-200 bg-amber-50 text-amber-800'
  return 'border-amber-200 bg-amber-50 text-amber-800'
}

function IconDocument({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h8M8 11h8M8 15h5M6 3h9l3 3v15H6V3z" />
    </svg>
  )
}

function IconUser({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11a3 3 0 100-6 3 3 0 000 6zM6 19a6 6 0 0112 0" />
    </svg>
  )
}

function IconEdit({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L9.75 16.902 6 18l1.098-3.75L16.862 4.487z" />
    </svg>
  )
}

function IconDuplicate({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 8h10v10H8zM6 16H5a2 2 0 01-2-2V5a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  )
}

function IconCheck({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  )
}

function TagPills({ tags, compact = false }: { tags: string[]; compact?: boolean }) {
  const shownTags = compact ? visibleRowTags(tags) : tags
  return (
    <div className="flex flex-wrap items-center gap-2">
      {shownTags.map((tag) => (
        <span key={tag} className={`rounded-md border px-2.5 py-1 text-xs font-bold ${tagClass(tag)}`}>
          {tag}
        </span>
      ))}
    </div>
  )
}

function DefaultButton({
  isDefault,
  onClick,
}: {
  isDefault: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onClick()
      }}
      disabled={isDefault}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-bold transition-colors ${
        isDefault
          ? 'cursor-default border-gray-200 bg-white text-gray-400'
          : 'border-gray-300 bg-white text-therapy-charcoal hover:border-therapy-honey hover:text-amber-800'
      }`}
    >
      {isDefault && <IconCheck className="h-4 w-4 text-emerald-600" />}
      {isDefault ? 'Your default' : 'Set as default'}
    </button>
  )
}

function TemplateRow({
  item,
  isDefault,
  onPreview,
  onDefault,
  onCustomize,
  onEdit,
}: {
  item: CatalogTemplate
  isDefault: boolean
  onPreview: () => void
  onDefault: () => void
  onCustomize?: () => void
  onEdit?: () => void
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onPreview()
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPreview}
      onKeyDown={handleKeyDown}
      className="grid min-h-[76px] cursor-pointer grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-gray-200 bg-white px-4 py-4 outline-none transition-colors last:border-b-0 hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-therapy-honey sm:px-5"
    >
      <div className="flex min-w-0 items-center gap-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-800">
          <IconUser className="h-5 w-5" />
        </span>
        <h3 className="truncate text-base font-bold text-therapy-charcoal">{item.name}</h3>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
        <TagPills tags={item.tags} compact />
        <DefaultButton
          isDefault={isDefault}
          onClick={onDefault}
        />
        {item.source === 'builtin' ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onCustomize?.()
            }}
            className="h-10 rounded-lg border border-therapy-honey bg-white px-4 text-sm font-bold text-amber-800 transition-colors hover:bg-amber-50"
          >
            Customize
          </button>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onEdit?.()
            }}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold text-therapy-charcoal transition-colors hover:bg-gray-50"
          >
            <IconEdit />
            Edit
          </button>
        )}
      </div>
    </div>
  )
}

function SectionPreview({ section }: { section: TemplateSectionDraft }) {
  const bulletLines = section.example
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.startsWith('- '))

  return (
    <section className="border-t border-gray-200 pt-8 first:border-t-0 first:pt-0">
      <div>
        <h3 className="text-2xl font-bold text-therapy-charcoal">{section.title}</h3>
        {bulletLines.length > 0 || section.format === 'bullets' ? (
          <ul className="mt-4 list-disc space-y-1.5 pl-6 text-base leading-7 text-therapy-charcoal">
            {(bulletLines.length ? bulletLines : section.example.split('. ').filter(Boolean).map((line) => `- ${line}`)).map((line) => (
              <li key={line}>
                {line.replace(/^- /, '')}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 max-w-3xl text-base leading-7 text-therapy-charcoal">{section.example}</p>
        )}
      </div>
    </section>
  )
}

function TemplatePreview({
  item,
  isDefault,
  onClose,
  onDefault,
  onDuplicate,
}: {
  item: CatalogTemplate
  isDefault: boolean
  onClose: () => void
  onDefault: () => void
  onDuplicate: () => void
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-therapy-charcoal">{item.name}</h1>
          <div className="flex items-center gap-3">
            <DefaultButton isDefault={isDefault} onClick={onDefault} />
            <button
              type="button"
              onClick={onDuplicate}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold text-therapy-charcoal transition-colors hover:bg-gray-50"
            >
              <IconDuplicate />
              Duplicate
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full text-2xl leading-none text-gray-500 transition-colors hover:bg-gray-100 hover:text-therapy-charcoal"
              aria-label="Close preview"
            >
              x
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-2xl font-bold text-gray-600">Progress note</h2>
          <div className="mt-7 space-y-8">
            {item.sections.map((section) => (
              <SectionPreview key={section.id} section={section} />
            ))}
          </div>
        </div>

        <aside className="space-y-10 lg:pt-1">
          <div>
            <h2 className="text-base font-bold text-gray-600">Description</h2>
            <p className="mt-4 text-base leading-7 text-gray-700">{item.description}</p>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-600">Tags</h2>
            <div className="mt-4">
              <TagPills tags={item.tags} />
            </div>
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-600">Author</h2>
            <div className="mt-4 flex items-center gap-3">
              <span className="relative flex h-5 w-10 items-center">
                <span className="h-5 w-5 rounded-full bg-sky-400" />
                <span className="-ml-2 h-5 w-5 rounded-full bg-therapy-honey" />
              </span>
              <span className="font-bold text-therapy-charcoal">{item.source === 'builtin' ? 'Upheal' : 'You'}</span>
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}

function SectionSettingsMenu({
  section,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onFormat,
  onRename,
  onRemove,
}: {
  section: TemplateSectionDraft
  canMoveUp: boolean
  canMoveDown: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onFormat: (format: SectionFormat) => void
  onRename: () => void
  onRemove: () => void
}) {
  return (
    <div className="absolute right-0 top-10 z-20 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
        <span className="text-sm font-medium text-therapy-charcoal">Reorder</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={!canMoveUp}
            onClick={onMoveUp}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Move section up"
          >
            ^
          </button>
          <button
            type="button"
            disabled={!canMoveDown}
            onClick={onMoveDown}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            aria-label="Move section down"
          >
            v
          </button>
        </div>
      </div>

      <div className="border-b border-gray-100 px-4 py-3">
        <div className="mb-2 text-sm font-medium text-gray-700">Format</div>
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1">
          {(['paragraph', 'bullets'] as SectionFormat[]).map((format) => (
            <button
              key={format}
              type="button"
              onClick={() => onFormat(format)}
              className={`rounded-md px-3 py-2 text-sm font-bold capitalize ${
                section.format === format ? 'bg-white text-therapy-charcoal shadow-sm' : 'text-gray-500 hover:text-therapy-charcoal'
              }`}
            >
              {format === 'paragraph' ? 'Lines' : 'Bullets'}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={onRename}
        className="flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left text-sm font-medium text-therapy-charcoal hover:bg-gray-50"
      >
        <IconEdit />
        Change section title
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="flex w-full items-center gap-3 px-4 py-4 text-left text-sm font-medium text-red-600 hover:bg-red-50"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 7h12M9 7V5h6v2m-8 0l1 14h8l1-14" />
        </svg>
        Remove section
      </button>
    </div>
  )
}

function TemplateEditor({
  draft,
  saving,
  selectedSectionId,
  openMenuSectionId,
  onSelectedSection,
  onOpenMenu,
  onCancel,
  onSave,
  onDraftChange,
}: {
  draft: EditorDraft
  saving: boolean
  selectedSectionId: string | null
  openMenuSectionId: string | null
  onSelectedSection: (id: string) => void
  onOpenMenu: (id: string | null) => void
  onCancel: () => void
  onSave: () => void
  onDraftChange: (draft: EditorDraft) => void
}) {
  const updateSection = (id: string, patch: Partial<TemplateSectionDraft>) => {
    onDraftChange({
      ...draft,
      sections: draft.sections.map((section) => (
        section.id === id ? { ...section, ...patch } : section
      )),
    })
  }

  const moveSection = (id: string, direction: -1 | 1) => {
    const index = draft.sections.findIndex((section) => section.id === id)
    const nextIndex = index + direction
    if (index < 0 || nextIndex < 0 || nextIndex >= draft.sections.length) return
    const nextSections = [...draft.sections]
    const [section] = nextSections.splice(index, 1)
    nextSections.splice(nextIndex, 0, section)
    onDraftChange({ ...draft, sections: nextSections })
  }

  const removeSection = (id: string) => {
    const nextSections = draft.sections.filter((section) => section.id !== id)
    onDraftChange({ ...draft, sections: nextSections.length ? nextSections : makeSections(['New section']) })
    onOpenMenu(null)
  }

  const addSection = () => {
    const nextIndex = draft.sections.length + 1
    const section: TemplateSectionDraft = {
      id: `new-section-${Date.now()}`,
      title: `New section ${nextIndex}`,
      example: 'Add the clinical guidance or example language for this section.',
      format: 'paragraph',
    }
    onDraftChange({ ...draft, sections: [...draft.sections, section] })
    onSelectedSection(section.id)
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3 text-sm">
            <IconDocument className="h-5 w-5 shrink-0 text-gray-500" />
            <button type="button" onClick={onCancel} className="text-gray-500 hover:text-therapy-charcoal">
              Note templates
            </button>
            <span className="text-gray-300">&gt;</span>
            <span className="truncate font-bold text-therapy-charcoal">{draft.name || 'Untitled template'}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="h-10 rounded-lg border border-gray-300 bg-white px-4 text-sm font-bold text-therapy-charcoal hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={saving}
              className="h-10 rounded-lg bg-therapy-honey px-5 text-sm font-bold text-therapy-charcoal transition-colors hover:bg-amber-500 disabled:opacity-50"
            >
              {saving ? 'Updating...' : 'Update template'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-200 px-7 py-7">
            <h1 className="text-3xl font-normal text-therapy-charcoal">Progress note</h1>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-therapy-charcoal"
              aria-label="Edit template title"
            >
              <IconEdit className="h-5 w-5" />
            </button>
          </div>

          <div className="divide-y divide-gray-200">
            {draft.sections.map((section, index) => {
              const selected = selectedSectionId === section.id
              const open = openMenuSectionId === section.id

              return (
                <section key={section.id} className="px-7 py-8">
                  <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_190px]">
                    <div>
                      <input
                        value={section.title}
                        onFocus={() => onSelectedSection(section.id)}
                        onChange={(event) => updateSection(section.id, { title: event.target.value })}
                        className={`w-full rounded-lg border px-4 py-3 text-2xl font-bold text-therapy-charcoal outline-none transition-colors ${
                          selected
                            ? 'border-gray-300 bg-white shadow-sm focus:ring-2 focus:ring-amber-200'
                            : 'border-transparent bg-transparent hover:border-gray-200 focus:border-gray-300 focus:ring-2 focus:ring-amber-200'
                        }`}
                      />
                      {section.format === 'bullets' ? (
                        <ul className="mt-4 list-disc space-y-1.5 pl-6 text-base leading-7 text-gray-600">
                          {section.example
                            .split('\n')
                            .map((line) => line.trim())
                            .filter(Boolean)
                            .map((line) => (
                              <li key={line}>{line.replace(/^- /, '')}</li>
                            ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-base leading-7 text-gray-600">{section.example}</p>
                      )}
                    </div>

                    <div className="relative flex items-start justify-end pt-3 text-sm text-gray-600">
                      <button
                        type="button"
                        onClick={() => onOpenMenu(open ? null : section.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-xl leading-none text-gray-500 hover:bg-gray-100 hover:text-therapy-charcoal"
                        aria-label={`Open settings for ${section.title}`}
                      >
                        ...
                      </button>
                      {open && (
                        <SectionSettingsMenu
                          section={section}
                          canMoveUp={index > 0}
                          canMoveDown={index < draft.sections.length - 1}
                          onMoveUp={() => moveSection(section.id, -1)}
                          onMoveDown={() => moveSection(section.id, 1)}
                          onFormat={(format) => updateSection(section.id, { format })}
                          onRename={() => {
                            onSelectedSection(section.id)
                            onOpenMenu(null)
                          }}
                          onRemove={() => removeSection(section.id)}
                        />
                      )}
                    </div>
                  </div>
                </section>
              )
            })}
          </div>

          <div className="border-t border-gray-200 px-7 py-6">
            <button
              type="button"
              onClick={addSection}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-amber-300 bg-amber-50 px-4 text-sm font-bold text-amber-800 hover:bg-amber-100"
            >
              + Add section
            </button>
          </div>
        </div>

        <aside className="space-y-8 lg:pt-1">
          <div>
            <label htmlFor="template-name" className="text-base font-bold text-therapy-charcoal">
              Template name
            </label>
            <input
              id="template-name"
              value={draft.name}
              onChange={(event) => onDraftChange({ ...draft, name: event.target.value })}
              className="mt-3 w-full rounded-lg border border-gray-300 px-4 py-3 text-base text-therapy-charcoal outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div>
            <label htmlFor="template-description" className="text-base font-bold text-therapy-charcoal">
              Description
            </label>
            <textarea
              id="template-description"
              value={draft.description}
              onChange={(event) => onDraftChange({ ...draft, description: event.target.value })}
              rows={5}
              className="mt-3 w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-base leading-6 text-therapy-charcoal outline-none focus:ring-2 focus:ring-amber-200"
            />
          </div>

          <div>
            <h2 className="text-base font-bold text-therapy-charcoal">Tags</h2>
            <div className="mt-3">
              <TagPills tags={draft.tags} />
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}

function CopyPromptModal({
  template,
  busy,
  hideAgain,
  onHideAgain,
  onCancel,
  onContinue,
}: {
  template: CatalogTemplate
  busy: boolean
  hideAgain: boolean
  onHideAgain: (checked: boolean) => void
  onCancel: () => void
  onContinue: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="px-6 pb-8 pt-7 text-center sm:px-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-gray-200 bg-white text-therapy-charcoal shadow-sm">
            <IconDuplicate className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-2xl font-bold leading-snug text-therapy-charcoal">
            We&apos;ll make a copy of our &quot;{template.name}&quot; template for you to customize
          </h2>
          <p className="mt-4 text-base leading-7 text-gray-500">
            The original stays as-is, so it&apos;s always there when you need it.
          </p>
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-therapy-charcoal">
            <input
              type="checkbox"
              checked={hideAgain}
              onChange={(event) => onHideAgain(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-therapy-honey focus:ring-therapy-honey"
            />
            Don&apos;t show again
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="h-10 rounded-lg border border-gray-300 bg-white px-5 text-sm font-bold text-therapy-charcoal hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onContinue}
              disabled={busy}
              className="h-10 rounded-lg bg-therapy-honey px-5 text-sm font-bold text-therapy-charcoal hover:bg-amber-500 disabled:opacity-50"
            >
              {busy ? 'Copying...' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<NoteTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<CatalogTab>('all')
  const [search, setSearch] = useState('')
  const [defaultTemplate, setDefaultTemplateState] = useState(FALLBACK_DEFAULT_NOTE_TEMPLATE)
  const [preview, setPreview] = useState<CatalogTemplate | null>(null)
  const [editorDraft, setEditorDraft] = useState<EditorDraft | null>(null)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [openMenuSectionId, setOpenMenuSectionId] = useState<string | null>(null)
  const [pendingCustomize, setPendingCustomize] = useState<CatalogTemplate | null>(null)
  const [hideCopyPrompt, setHideCopyPromptState] = useState(false)
  const [saving, setSaving] = useState(false)

  const load = useCallback(() => {
    setLoading(true)
    Promise.all([
      apiClient.getTemplates(),
      apiClient.getUserSettings().catch(() => null),
    ])
      .then(([items, settings]) => {
        setTemplates(items)
        const nextDefault = settings?.default_note_template && settings.default_note_template !== 'upheal'
          ? settings.default_note_template
          : FALLBACK_DEFAULT_NOTE_TEMPLATE
        setDefaultTemplateState(nextDefault)
        setError(null)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load templates'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const customTemplates = useMemo(() => templates.map(customTemplateToCatalog), [templates])

  const filteredBuiltIns = useMemo(() => {
    const query = search.trim().toLowerCase()
    return BUILT_IN_TEMPLATES.filter((item) => {
      const matchesTab = activeTab === 'all' || item.categories.includes(activeTab)
      const matchesSearch = !query || `${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(query)
      return matchesTab && matchesSearch
    })
  }, [activeTab, search])

  const filteredCustom = useMemo(() => {
    const query = search.trim().toLowerCase()
    return customTemplates.filter((item) => {
      const matchesTab = activeTab === 'all' || item.categories.includes(activeTab)
      const matchesSearch = !query || `${item.name} ${item.description} ${item.tags.join(' ')}`.toLowerCase().includes(query)
      return matchesTab && matchesSearch
    })
  }, [activeTab, customTemplates, search])

  const currentPreview = useMemo(() => {
    if (!preview) return null
    return [...BUILT_IN_TEMPLATES, ...customTemplates].find((item) => item.id === preview.id) || preview
  }, [customTemplates, preview])

  const setAsDefault = async (value: string) => {
    const previous = defaultTemplate
    setDefaultTemplateState(value)
    try {
      await apiClient.updateUserSettings({ default_note_template: value })
    } catch (e) {
      setDefaultTemplateState(previous)
      setError(e instanceof Error ? e.message : 'Failed to save default template')
    }
  }

  const openEditor = (item: CatalogTemplate) => {
    setPreview(null)
    setOpenMenuSectionId(null)
    const draft: EditorDraft = {
      id: item.template?.id,
      name: item.name,
      description: item.description,
      base_format: item.base_format,
      sections: item.sections.map((section) => ({ ...section })),
      tags: item.tags.includes('Individuals') ? item.tags : ['Individuals', ...item.tags],
    }
    setEditorDraft(draft)
    setSelectedSectionId(draft.sections[0]?.id || null)
  }

  const startNew = () => {
    const draft: EditorDraft = {
      name: 'Untitled template',
      description: 'Custom progress note template.',
      base_format: CUSTOM_FORMAT_KEY,
      sections: makeSections(['New section']),
      tags: ['Individuals', 'Therapy', 'Progress note'],
    }
    setPreview(null)
    setEditorDraft(draft)
    setSelectedSectionId(draft.sections[0]?.id || null)
  }

  const duplicateForEditing = async (item: CatalogTemplate) => {
    setSaving(true)
    setError(null)
    try {
      const payload: NoteTemplateInput = {
        name: `${item.name} (Copy)`,
        base_format: item.base_format,
        description: item.description,
        sections: item.sections.map((section) => section.title.trim()).filter(Boolean),
        section_settings: item.sections.map((section) => ({
          title: section.title,
          format: section.format,
          example: section.example,
        })),
      }
      const created = await apiClient.createTemplate(payload)
      setTemplates((prev) => [created, ...prev])
      setPendingCustomize(null)
      setHideTemplateCopyPrompt(hideCopyPrompt)
      openEditor(customTemplateToCatalog(created))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to copy template')
    } finally {
      setSaving(false)
    }
  }

  const requestCustomize = (item: CatalogTemplate) => {
    if (shouldShowTemplateCopyPrompt()) {
      setPendingCustomize(item)
      setHideCopyPromptState(false)
      return
    }
    duplicateForEditing(item)
  }

  const saveEditor = async () => {
    if (!editorDraft) return
    const cleanedSections = editorDraft.sections.map((section) => section.title.trim()).filter(Boolean)
    if (!editorDraft.name.trim() || cleanedSections.length === 0) {
      setError('Template needs a name and at least one section.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      const payload: NoteTemplateInput = {
        name: editorDraft.name.trim(),
        base_format: editorDraft.base_format,
        description: editorDraft.description,
        sections: cleanedSections,
        section_settings: editorDraft.sections.map((section) => ({
          title: section.title.trim(),
          format: section.format,
          example: section.example,
        })),
      }
      const saved = editorDraft.id
        ? await apiClient.updateTemplate(editorDraft.id, payload)
        : await apiClient.createTemplate(payload)

      setTemplates((prev) => {
        const exists = prev.some((item) => item.id === saved.id)
        return exists ? prev.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...prev]
      })
      setEditorDraft(null)
      setOpenMenuSectionId(null)
      setSelectedSectionId(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  if (editorDraft) {
    return (
      <>
        <TemplateEditor
          draft={editorDraft}
          saving={saving}
          selectedSectionId={selectedSectionId}
          openMenuSectionId={openMenuSectionId}
          onSelectedSection={setSelectedSectionId}
          onOpenMenu={setOpenMenuSectionId}
          onCancel={() => {
            setEditorDraft(null)
            setOpenMenuSectionId(null)
            setSelectedSectionId(null)
          }}
          onSave={saveEditor}
          onDraftChange={setEditorDraft}
        />
        {error && (
          <div className="fixed bottom-6 right-6 z-50 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-lg">
            {error}
          </div>
        )}
      </>
    )
  }

  if (currentPreview) {
    return (
      <>
        <TemplatePreview
          item={currentPreview}
          isDefault={defaultTemplate === currentPreview.value}
          onClose={() => setPreview(null)}
          onDefault={() => setAsDefault(currentPreview.value)}
          onDuplicate={() => requestCustomize(currentPreview)}
        />
        {pendingCustomize && (
          <CopyPromptModal
            template={pendingCustomize}
            busy={saving}
            hideAgain={hideCopyPrompt}
            onHideAgain={setHideCopyPromptState}
            onCancel={() => setPendingCustomize(null)}
            onContinue={() => duplicateForEditing(pendingCustomize)}
          />
        )}
      </>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:flex-row lg:items-start lg:justify-between lg:px-8">
          <div>
            <h1 className="text-4xl font-bold tracking-normal text-therapy-charcoal">Note templates</h1>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto">
            <label className="relative flex-1 lg:w-80">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                </svg>
              </span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search templates..."
                className="h-12 w-full rounded-xl border border-gray-300 bg-white pl-12 pr-4 text-base outline-none focus:border-therapy-honey focus:ring-2 focus:ring-amber-100"
              />
            </label>
            <button
              type="button"
              onClick={startNew}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-therapy-honey bg-white px-5 text-base font-bold text-amber-800 transition-colors hover:bg-amber-50"
            >
              New template
            </button>
          </div>
        </div>

        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8" aria-label="Template categories">
          <div className="flex gap-8 overflow-x-auto border-b border-gray-200">
            {CATALOG_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`relative whitespace-nowrap px-1 pb-6 pt-3 text-base font-bold transition-colors ${
                  activeTab === tab.key ? 'text-amber-800' : 'text-gray-600 hover:text-therapy-charcoal'
                }`}
              >
                {tab.label}
                {activeTab === tab.key && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-therapy-honey" />
                )}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <section>
          <h2 className="text-2xl font-bold text-therapy-charcoal">My custom templates</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {loading ? (
              <div className="px-5 py-6 text-sm text-gray-500">Loading...</div>
            ) : filteredCustom.length ? (
              filteredCustom.map((item) => (
                <TemplateRow
                  key={item.id}
                  item={item}
                  isDefault={defaultTemplate === item.value}
                  onPreview={() => setPreview(item)}
                  onDefault={() => setAsDefault(item.value)}
                  onEdit={() => openEditor(item)}
                />
              ))
            ) : (
              <div className="px-5 py-6 text-sm text-gray-500">No custom templates match this view.</div>
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-therapy-charcoal">Individual templates</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {filteredBuiltIns.length ? (
              filteredBuiltIns.map((item) => (
                <TemplateRow
                  key={item.id}
                  item={item}
                  isDefault={defaultTemplate === item.value}
                  onPreview={() => setPreview(item)}
                  onDefault={() => setAsDefault(item.value)}
                  onCustomize={() => requestCustomize(item)}
                />
              ))
            ) : (
              <div className="px-5 py-6 text-sm text-gray-500">No individual templates match this view.</div>
            )}
          </div>
        </section>
      </main>

      {pendingCustomize && (
        <CopyPromptModal
          template={pendingCustomize}
          busy={saving}
          hideAgain={hideCopyPrompt}
          onHideAgain={setHideCopyPromptState}
          onCancel={() => setPendingCustomize(null)}
          onContinue={() => duplicateForEditing(pendingCustomize)}
        />
      )}
    </div>
  )
}
