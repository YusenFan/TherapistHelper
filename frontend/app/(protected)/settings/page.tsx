'use client'

import { useEffect, useState } from 'react'
import { apiClient } from '@/lib/api'

const EHR_OPTIONS = [
  { value: 'therapynotes', label: 'TherapyNotes' },
  { value: 'simplepractice', label: 'SimplePractice' },
  { value: 'janeapp', label: 'Jane App' },
]

export default function SettingsPage() {
  const [defaultEhr, setDefaultEhr] = useState('')
  const [loading, setLoading] = useState(true)
  const [savedMsg, setSavedMsg] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient.getUserSettings()
      .then(s => setDefaultEhr(s.default_ehr ?? ''))
      .catch(e => setError(e instanceof Error ? e.message : 'Failed to load settings'))
      .finally(() => setLoading(false))
  }, [])

  const saveEhr = async (value: string) => {
    setDefaultEhr(value)
    setSavedMsg('')
    try {
      await apiClient.updateUserSettings({ default_ehr: value })
      setSavedMsg('Saved')
      setTimeout(() => setSavedMsg(''), 2000)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save')
    }
  }

  const input = 'w-full max-w-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-therapy-coral focus:border-transparent'

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-3xl font-bold text-therapy-navy">Settings</h1>
        </div>
      </div>

      <main className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8">
        {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>}

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-therapy-navy mb-1">Default EHR</h2>
          <p className="text-sm text-gray-600 mb-4">Used by the Chrome extension when syncing notes.</p>
          {loading ? <p className="text-gray-500">Loading…</p> : (
            <div className="flex items-center gap-3">
              <select className={input} value={defaultEhr} onChange={e => saveEhr(e.target.value)}>
                <option value="">— None —</option>
                {EHR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {savedMsg && <span className="text-sm text-therapy-green">{savedMsg}</span>}
            </div>
          )}
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-therapy-navy mb-1">Chrome extension</h2>
          <p className="text-sm text-gray-600 mb-3">
            Sync saved session notes straight into your EHR's note page.
          </p>
          <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
            <li>Open <span className="font-mono">chrome://extensions</span> and enable Developer mode.</li>
            <li>Click “Load unpacked” and select the <span className="font-mono">extension/</span> folder.</li>
            <li>Open the extension, sign in, pick your EHR, then choose a session note to sync.</li>
          </ol>
        </section>
      </main>
    </div>
  )
}
