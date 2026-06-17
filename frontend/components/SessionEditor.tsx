'use client'

import { useState, useEffect, useMemo } from 'react'
import { apiClient, type Client, type Session, type NoteTemplate, type SessionInput } from '@/lib/api'
import { NOTE_FORMATS, CUSTOM_FORMAT_KEY } from '@/lib/noteFormats'

interface Props {
  initial?: Session
  fixedClientId?: string
  onSaved: (session: Session) => void
  onDelete?: () => void
}

// A selectable note format: either a built-in format or a user template.
type Choice = { id: string; label: string; format: string; sections: string[]; templateId?: string }

export default function SessionEditor({ initial, fixedClientId, onSaved, onDelete }: Props) {
  const [clients, setClients] = useState<Client[]>([])
  const [templates, setTemplates] = useState<NoteTemplate[]>([])

  const [clientId, setClientId] = useState(initial?.client_id ?? fixedClientId ?? '')
  const [date, setDate] = useState((initial?.session_date ?? new Date().toISOString()).slice(0, 10))
  const [summary, setSummary] = useState(initial?.summary ?? '')
  const [choiceId, setChoiceId] = useState('')
  const [content, setContent] = useState<Record<string, string>>(initial?.note_content ?? {})
  const [sections, setSections] = useState<string[]>(
    initial?.note_content ? Object.keys(initial.note_content) : []
  )
  const [noteFormat, setNoteFormat] = useState(initial?.note_format ?? '')
  const [templateId, setTemplateId] = useState<string | undefined>(initial?.template_id)

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient.getClients().then(setClients).catch(() => {})
    apiClient.getTemplates().then(setTemplates).catch(() => {})
  }, [])

  const choices: Choice[] = useMemo(() => {
    const builtin: Choice[] = NOTE_FORMATS.map(f => ({
      id: `format:${f.key}`, label: f.label, format: f.key, sections: f.sections,
    }))
    const tpl: Choice[] = templates.map(t => ({
      id: `template:${t.id}`, label: `${t.name} (template)`,
      format: t.base_format || CUSTOM_FORMAT_KEY, sections: t.sections, templateId: t.id,
    }))
    return [...builtin, ...tpl]
  }, [templates])

  const applyChoice = (id: string) => {
    setChoiceId(id)
    const c = choices.find(x => x.id === id)
    if (!c) return
    setNoteFormat(c.format)
    setTemplateId(c.templateId)
    setSections(c.sections)
    setContent(prev => {
      const next: Record<string, string> = {}
      c.sections.forEach(s => { next[s] = prev[s] ?? '' })
      return next
    })
  }

  const handleSave = async () => {
    if (!clientId) { setError('Please select a client.'); return }
    setSaving(true)
    setError(null)
    const payload: SessionInput = {
      client_id: clientId,
      session_date: new Date(date).toISOString(),
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

  const label = 'block text-sm font-medium text-therapy-navy mb-1'
  const input = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent'

  return (
    <div className="space-y-6 bg-white rounded-xl border border-gray-200 p-6 max-w-3xl">
      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Client *</label>
          <select className={input} value={clientId} onChange={e => setClientId(e.target.value)} disabled={!!fixedClientId || !!initial}>
            <option value="">— Select client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className={label}>Session date *</label>
          <input type="date" className={input} value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>

      <div>
        <label className={label}>Session summary</label>
        <textarea className={input} rows={5} value={summary} onChange={e => setSummary(e.target.value)} placeholder="Summary of the session…" />
      </div>

      <div>
        <label className={label}>Note format / template</label>
        <select className={input} value={choiceId} onChange={e => applyChoice(e.target.value)}>
          <option value="">{sections.length ? '— Keep current —' : '— Select a format —'}</option>
          <optgroup label="Formats">
            {choices.filter(c => !c.templateId).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </optgroup>
          {choices.some(c => c.templateId) && (
            <optgroup label="My templates">
              {choices.filter(c => c.templateId).map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </optgroup>
          )}
        </select>
      </div>

      {sections.map(section => (
        <div key={section}>
          <label className={label}>{section}</label>
          <textarea
            className={input}
            rows={3}
            value={content[section] ?? ''}
            onChange={e => setContent(prev => ({ ...prev, [section]: e.target.value }))}
          />
        </div>
      ))}

      <div className="flex gap-3 pt-2">
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50">
          {saving ? 'Saving…' : initial ? 'Save Changes' : 'Create Session'}
        </button>
        {onDelete && (
          <button onClick={onDelete} className="px-5 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium">
            Delete
          </button>
        )}
      </div>
    </div>
  )
}
