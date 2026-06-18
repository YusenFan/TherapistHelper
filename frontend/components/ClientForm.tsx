'use client'

import { useState } from 'react'
import { type ClientInput, type Client } from '@/lib/api'
import { CLIENT_TYPES } from '@/lib/noteFormats'

interface Props {
  initial?: Client
  submitting?: boolean
  submitLabel?: string
  onSubmit: (data: ClientInput) => void
  onCancel?: () => void
}

export default function ClientForm({ initial, submitting, submitLabel = 'Save', onSubmit, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [pronouns, setPronouns] = useState(initial?.pronouns ?? '')
  const [dob, setDob] = useState(initial?.date_of_birth ?? '')
  const [clientType, setClientType] = useState(initial?.client_type ?? 'individual')
  const [highRisk, setHighRisk] = useState<boolean>(initial?.high_risk ?? false)
  const [extra, setExtra] = useState(initial?.extra_info ?? '')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      name: name.trim(),
      pronouns: pronouns.trim() || undefined,
      date_of_birth: dob || undefined,
      client_type: clientType,
      high_risk: highRisk,
      extra_info: extra.trim() || undefined,
    })
  }

  const label = 'block text-sm font-medium text-therapy-navy mb-1'
  const input = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-xl border border-gray-200 p-6 max-w-2xl">
      <div>
        <label className={label}>Name *</label>
        <input className={input} value={name} onChange={e => setName(e.target.value)} required />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={label}>Pronouns</label>
          <input className={input} value={pronouns} onChange={e => setPronouns(e.target.value)} placeholder="she/her" />
        </div>
        <div>
          <label className={label}>Date of birth</label>
          <input type="date" className={input} value={dob} onChange={e => setDob(e.target.value)} />
        </div>
      </div>

      <div>
        <label className={label}>Type</label>
        <select className={input} value={clientType} onChange={e => setClientType(e.target.value)}>
          {CLIENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-therapy-navy">
        <input type="checkbox" checked={highRisk} onChange={e => setHighRisk(e.target.checked)} />
        High risk
      </label>

      <div>
        <label className={label}>Extra info</label>
        <textarea className={input} rows={4} value={extra} onChange={e => setExtra(e.target.value)} />
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={submitting || !name.trim()}
          className="px-5 py-2.5 bg-therapy-coral text-white rounded-lg hover:bg-opacity-90 font-medium disabled:opacity-50">
          {submitting ? 'Saving…' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
            Cancel
          </button>
        )}
      </div>
    </form>
  )
}
