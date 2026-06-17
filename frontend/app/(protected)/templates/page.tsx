'use client'

import { useState, useEffect } from 'react'
import { apiClient, type NoteTemplate, type NoteTemplateInput } from '@/lib/api'
import { NOTE_FORMATS, CUSTOM_FORMAT_KEY, formatLabel } from '@/lib/noteFormats'

const blank: NoteTemplateInput = { name: '', base_format: CUSTOM_FORMAT_KEY, sections: [''] }

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<NoteTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [editing, setEditing] = useState<NoteTemplate | null>(null)
  const [draft, setDraft] = useState<NoteTemplateInput | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    apiClient.getTemplates()
      .then(setTemplates)
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load templates'))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const startNew = () => { setEditing(null); setDraft({ ...blank, sections: [''] }) }
  const startEdit = (t: NoteTemplate) => {
    setEditing(t)
    setDraft({ name: t.name, base_format: t.base_format || CUSTOM_FORMAT_KEY, sections: [...t.sections] })
  }

  const seedFromFormat = (key: string) => {
    if (!draft) return
    const fmt = NOTE_FORMATS.find(f => f.key === key)
    setDraft({ ...draft, base_format: key, sections: fmt ? [...fmt.sections] : draft.sections })
  }

  const save = async () => {
    if (!draft) return
    const cleaned = { ...draft, sections: draft.sections.map(s => s.trim()).filter(Boolean) }
    if (!cleaned.name.trim() || cleaned.sections.length === 0) {
      setError('Template needs a name and at least one section.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      if (editing) await apiClient.updateTemplate(editing.id, cleaned)
      else await apiClient.createTemplate(cleaned)
      setDraft(null); setEditing(null); load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const remove = async (t: NoteTemplate) => {
    if (!confirm(`Delete template "${t.name}"?`)) return
    await apiClient.deleteTemplate(t.id)
    load()
  }

  const input = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent'

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-therapy-navy">Note Templates</h1>
            <p className="text-gray-600 mt-1">Reusable note structures for any client session</p>
          </div>
          {!draft && (
            <button onClick={startNew} className="px-5 py-2.5 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 font-medium">
              + New Template
            </button>
          )}
        </div>
      </div>

      <main className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

        {draft && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-5 max-w-2xl">
            <h2 className="text-lg font-semibold text-therapy-navy">{editing ? 'Edit template' : 'New template'}</h2>
            <div>
              <label className="block text-sm font-medium text-therapy-navy mb-1">Name</label>
              <input className={input} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-therapy-navy mb-1">Base format (optional — seeds sections)</label>
              <select className={input} value={draft.base_format} onChange={e => seedFromFormat(e.target.value)}>
                <option value={CUSTOM_FORMAT_KEY}>Custom (from scratch)</option>
                {NOTE_FORMATS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-therapy-navy mb-1">Sections</label>
              <div className="space-y-2">
                {draft.sections.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input className={input} value={s}
                      onChange={e => { const next = [...draft.sections]; next[i] = e.target.value; setDraft({ ...draft, sections: next }) }} />
                    <button onClick={() => setDraft({ ...draft, sections: draft.sections.filter((_, j) => j !== i) })}
                      className="px-3 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50">✕</button>
                  </div>
                ))}
              </div>
              <button onClick={() => setDraft({ ...draft, sections: [...draft.sections, ''] })}
                className="mt-2 text-sm text-therapy-coral font-medium">+ Add section</button>
            </div>
            <div className="flex gap-3">
              <button onClick={save} disabled={saving} className="px-5 py-2.5 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50">
                {saving ? 'Saving…' : 'Save Template'}
              </button>
              <button onClick={() => { setDraft(null); setEditing(null) }} className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium">
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading ? <p className="text-gray-500">Loading…</p> : (
          templates.length === 0 && !draft ? (
            <p className="text-gray-500">No templates yet. Create one based on a format, or from scratch.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(t => (
                <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-therapy-navy">{t.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Based on {formatLabel(t.base_format)}</p>
                    </div>
                    <div className="flex gap-2 text-sm">
                      <button onClick={() => startEdit(t)} className="text-therapy-coral font-medium">Edit</button>
                      <button onClick={() => remove(t)} className="text-red-500 font-medium">Delete</button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mt-3">{t.sections.join(' · ')}</p>
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  )
}
