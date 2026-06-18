'use client'

import { useCallback, useEffect, useMemo, useState, type DragEvent, type MouseEvent } from 'react'
import { apiClient, type Client, type NoteTemplate } from '@/lib/api'
import { NOTE_FORMATS } from '@/lib/noteFormats'
import { FALLBACK_DEFAULT_NOTE_TEMPLATE } from '@/lib/templatePreferences'

type GoogleEvent = {
  id: string
  summary?: string
  description?: string
  start?: { dateTime?: string; date?: string; timeZone?: string }
  end?: { dateTime?: string; date?: string; timeZone?: string }
  htmlLink?: string
  extendedProperties?: { private?: Record<string, string | undefined> }
}

export type CalendarSessionPreset = {
  clientId?: string
  date?: string
  time?: string
  duration?: number
  template?: string
}

type Props = {
  onStartSession?: (mode: 'write' | 'upload', preset: CalendarSessionPreset) => void
}

type TokenClient = {
  requestAccessToken: (opts?: { prompt?: string }) => void
}

type CreateDraft = {
  clientId: string
  date: string
  time: string
  duration: number
}

type TemplateOption = {
  value: string
  label: string
}

type ContextMenuState = {
  x: number
  y: number
  event: GoogleEvent
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (resp: { access_token?: string; error?: string }) => void
          }) => TokenClient
          revoke: (token: string, done?: () => void) => void
        }
      }
    }
  }
}

const SCOPE = 'https://www.googleapis.com/auth/calendar.events'
const GSI_SRC = 'https://accounts.google.com/gsi/client'
const TOKEN_STORAGE_KEY = 'gcal_events_access_token'
const TOKEN_EXPIRY_KEY = 'gcal_events_token_expiry'
const EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'
const HOUR_HEIGHT = 72
const TIME_AXIS_WIDTH = 72
const SLOT_MINUTES = 15
const DEFAULT_DURATION = 50
const DEFAULT_START_HOUR = 7
const DEFAULT_END_HOUR = 20
const DURATIONS = [15, 30, 45, 50, 60, 75, 90]

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

function localDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function localTime(d: Date) {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function parseGoogleDate(value?: { dateTime?: string; date?: string }) {
  if (value?.dateTime) return new Date(value.dateTime)
  if (value?.date) return parseDateOnly(value.date)
  return null
}

function startOfWeek(d: Date) {
  const r = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  r.setDate(r.getDate() - r.getDay())
  return r
}

function endOfWeek(d: Date) {
  const s = startOfWeek(d)
  const e = new Date(s)
  e.setDate(s.getDate() + 6)
  e.setHours(23, 59, 59, 999)
  return e
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function roundToSlot(minutes: number) {
  return Math.round(minutes / SLOT_MINUTES) * SLOT_MINUTES
}

function minutesSinceMidnight(d: Date) {
  return d.getHours() * 60 + d.getMinutes()
}

function eventDuration(event: GoogleEvent) {
  const stored = Number(event.extendedProperties?.private?.duration_minutes)
  if (Number.isFinite(stored) && stored > 0) return stored
  if (!event.start?.dateTime) return DEFAULT_DURATION
  const start = parseGoogleDate(event.start)
  const end = parseGoogleDate(event.end)
  if (!start || !end) return DEFAULT_DURATION
  const diff = Math.round((end.getTime() - start.getTime()) / 60000)
  return diff > 0 ? diff : DEFAULT_DURATION
}

function eventSort(a: GoogleEvent, b: GoogleEvent) {
  return (parseGoogleDate(a.start)?.getTime() ?? 0) - (parseGoogleDate(b.start)?.getTime() ?? 0)
}

function formatHour(hour: number) {
  const d = new Date()
  d.setHours(hour, 0, 0, 0)
  return d.toLocaleTimeString(undefined, { hour: 'numeric' })
}

function formatRange(start: Date | null, end: Date | null) {
  if (!start) return 'All day'
  const startLabel = start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  if (!end) return startLabel
  const endLabel = end.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  return `${startLabel} - ${endLabel}`
}

function loadGsi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('no window'))
    if (window.google?.accounts?.oauth2) return resolve()
    const existing = document.querySelector(`script[src="${GSI_SRC}"]`) as HTMLScriptElement | null
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Identity Services')))
      return
    }
    const s = document.createElement('script')
    s.src = GSI_SRC
    s.async = true
    s.defer = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'))
    document.head.appendChild(s)
  })
}

function Icon({ name, className = 'h-4 w-4' }: { name: 'plus' | 'mic' | 'upload' | 'calendar' | 'close'; className?: string }) {
  const paths = {
    plus: 'M12 5v14m7-7H5',
    mic: 'M19 11a7 7 0 01-14 0m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z',
    upload: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
    calendar: 'M8 7V3m8 4V3M5 11h14M7 21h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v12a2 2 0 002 2z',
    close: 'M6 18L18 6M6 6l12 12',
  }
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={paths[name]} />
    </svg>
  )
}

function EventDialog({
  event,
  clients,
  templateOptions,
  defaultTemplate,
  onClose,
  onStart,
}: {
  event: GoogleEvent
  clients: Client[]
  templateOptions: TemplateOption[]
  defaultTemplate: string
  onClose: () => void
  onStart?: (mode: 'write' | 'upload', preset: CalendarSessionPreset) => void
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(defaultTemplate)
  const start = parseGoogleDate(event.start)
  const end = parseGoogleDate(event.end)
  const privateProps = event.extendedProperties?.private
  const client = privateProps?.client_id ? clients.find((c) => c.id === privateProps.client_id) : undefined
  const clientName = client?.name || privateProps?.client_name
  const preset: CalendarSessionPreset = {
    clientId: privateProps?.client_id || undefined,
    date: start ? localDate(start) : undefined,
    time: start && event.start?.dateTime ? localTime(start) : undefined,
    duration: eventDuration(event),
    template: selectedTemplate || undefined,
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Calendar session</p>
            <h3 className="mt-1 truncate text-xl font-bold text-therapy-navy">{event.summary || 'Untitled event'}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {formatRange(start, end)}
              {clientName ? ` · ${clientName}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-therapy-navy">
              Note template
            </label>
            <select
              value={selectedTemplate}
              onChange={(selectEvent) => setSelectedTemplate(selectEvent.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-therapy-navy focus:outline-none focus:ring-2 focus:ring-therapy-coral"
            >
              <option value="">Select a template</option>
              {templateOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => onStart?.('write', preset)}
            disabled={!selectedTemplate}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-therapy-coral px-4 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="mic" />
            Write / Dictate
          </button>
          <button
            type="button"
            onClick={() => onStart?.('upload', preset)}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-therapy-navy shadow-sm transition-colors hover:bg-gray-50"
          >
            <Icon name="upload" />
            Upload
          </button>
          </div>
        </div>

        {event.htmlLink && (
          <div className="border-t border-gray-100 px-5 py-3">
            <a
              href={event.htmlLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-500 transition-colors hover:text-therapy-navy"
            >
              Open in Google Calendar
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

function CreateDialog({
  open,
  draft,
  clients,
  saving,
  onClose,
  onChange,
  onSubmit,
}: {
  open: boolean
  draft: CreateDraft
  clients: Client[]
  saving: boolean
  onClose: () => void
  onChange: (draft: CreateDraft) => void
  onSubmit: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl"
        onSubmit={(event) => {
          event.preventDefault()
          onSubmit()
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h3 className="text-xl font-bold text-therapy-navy">Create calendar session</h3>
            <p className="mt-1 text-sm text-gray-500">This adds the appointment to Google Calendar.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-therapy-navy">Client</label>
            <select
              value={draft.clientId}
              onChange={(event) => onChange({ ...draft, clientId: event.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-therapy-coral"
            >
              <option value="">Unassigned session</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-therapy-navy">Date</label>
              <input
                type="date"
                value={draft.date}
                onChange={(event) => onChange({ ...draft, date: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-therapy-coral"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-therapy-navy">Time</label>
              <input
                type="time"
                value={draft.time}
                onChange={(event) => onChange({ ...draft, time: event.target.value })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-therapy-coral"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-therapy-navy">Duration</label>
              <select
                value={draft.duration}
                onChange={(event) => onChange({ ...draft, duration: Number(event.target.value) })}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-therapy-coral"
              >
                {DURATIONS.map((duration) => (
                  <option key={duration} value={duration}>{duration} mins</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-therapy-navy transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-therapy-coral px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-opacity-90 disabled:opacity-50"
          >
            <Icon name="calendar" />
            {saving ? 'Creating...' : 'Create session'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function GoogleCalendar({ onStartSession }: Props) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const [token, setToken] = useState<string | null>(null)
  const [events, setEvents] = useState<GoogleEvent[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [templates, setTemplates] = useState<NoteTemplate[]>([])
  const [defaultTemplate, setDefaultTemplate] = useState(FALLBACK_DEFAULT_NOTE_TEMPLATE)
  const [weekOffset, setWeekOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [movingId, setMovingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tokenClient, setTokenClient] = useState<TokenClient | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<GoogleEvent | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState<CreateDraft>(() => {
    const now = new Date()
    return { clientId: '', date: localDate(now), time: localTime(now), duration: DEFAULT_DURATION }
  })

  const viewWeekStart = useMemo(() => {
    const d = startOfWeek(new Date())
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])

  const viewWeekEnd = useMemo(() => endOfWeek(viewWeekStart), [viewWeekStart])

  const resetToken = useCallback(() => {
    setToken(null)
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(TOKEN_STORAGE_KEY)
    window.localStorage.removeItem(TOKEN_EXPIRY_KEY)
  }, [])

  useEffect(() => {
    apiClient.getClients().then(setClients).catch(() => {})
    apiClient.getTemplates().then(setTemplates).catch(() => {})
    apiClient.getUserSettings()
      .then((settings) => {
        setDefaultTemplate(settings.default_note_template || FALLBACK_DEFAULT_NOTE_TEMPLATE)
      })
      .catch(() => setDefaultTemplate(FALLBACK_DEFAULT_NOTE_TEMPLATE))
  }, [])

  useEffect(() => {
    if (!contextMenu) return
    const close = () => setContextMenu(null)
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setContextMenu(null)
    }
    window.addEventListener('click', close)
    window.addEventListener('scroll', close, true)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('scroll', close, true)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [contextMenu])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = window.localStorage.getItem(TOKEN_STORAGE_KEY)
    const expiry = Number(window.localStorage.getItem(TOKEN_EXPIRY_KEY) || 0)
    if (stored && expiry > Date.now()) {
      setToken(stored)
    } else {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY)
      window.localStorage.removeItem(TOKEN_EXPIRY_KEY)
    }
  }, [])

  useEffect(() => {
    if (!googleClientId) return
    let cancelled = false
    loadGsi()
      .then(() => {
        if (cancelled || !window.google) return
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: googleClientId,
          scope: SCOPE,
          callback: (resp) => {
            if (resp.error || !resp.access_token) {
              setError(resp.error || 'No access token received')
              return
            }
            setToken(resp.access_token)
            setError(null)
            const expiresAt = Date.now() + 55 * 60 * 1000
            window.localStorage.setItem(TOKEN_STORAGE_KEY, resp.access_token)
            window.localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt))
          },
        })
        setTokenClient(client)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to init Google sign-in'))
    return () => {
      cancelled = true
    }
  }, [googleClientId])

  const fetchEvents = useCallback(async (accessToken: string, weekStart: Date, weekEnd: Date) => {
    setLoading(true)
    setError(null)
    try {
      const url = new URL(EVENTS_URL)
      url.searchParams.set('timeMin', weekStart.toISOString())
      url.searchParams.set('timeMax', weekEnd.toISOString())
      url.searchParams.set('singleEvents', 'true')
      url.searchParams.set('orderBy', 'startTime')
      url.searchParams.set('maxResults', '250')
      const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${accessToken}` } })
      if (res.status === 401) {
        resetToken()
        throw new Error('Google session expired. Please reconnect.')
      }
      if (res.status === 403) {
        resetToken()
        throw new Error('Reconnect Google Calendar to grant scheduling access.')
      }
      if (!res.ok) throw new Error(`Calendar API error: ${res.status}`)
      const data = await res.json()
      setEvents(Array.isArray(data.items) ? data.items.sort(eventSort) : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [resetToken])

  useEffect(() => {
    if (token) fetchEvents(token, viewWeekStart, viewWeekEnd)
  }, [token, viewWeekStart, viewWeekEnd, fetchEvents])

  const calendarRequest = useCallback(async (url: string, options: RequestInit = {}) => {
    if (!token) throw new Error('Connect Google Calendar first.')
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers as Record<string, string> | undefined),
    }
    const res = await fetch(url, { ...options, headers })
    if (res.status === 401) {
      resetToken()
      throw new Error('Google session expired. Please reconnect.')
    }
    if (res.status === 403) {
      resetToken()
      throw new Error('Reconnect Google Calendar to grant scheduling access.')
    }
    if (!res.ok) {
      let message = `Calendar API error: ${res.status}`
      try {
        const body = await res.json()
        message = body?.error?.message || message
      } catch {}
      throw new Error(message)
    }
    return res.status === 204 ? null : res.json()
  }, [resetToken, token])

  const weekDays = useMemo(() => {
    const days: Date[] = []
    for (let index = 0; index < 7; index++) {
      const d = new Date(viewWeekStart)
      d.setDate(viewWeekStart.getDate() + index)
      days.push(d)
    }
    return days
  }, [viewWeekStart])

  const timedEventsByDay = useMemo(() => {
    const map = new Map<string, GoogleEvent[]>()
    for (const event of events) {
      if (!event.start?.dateTime) continue
      const start = parseGoogleDate(event.start)
      if (!start) continue
      const key = dayKey(start)
      map.set(key, [...(map.get(key) ?? []), event])
    }
    map.forEach((value, key) => {
      map.set(key, value.sort(eventSort))
    })
    return map
  }, [events])

  const allDayEventsByDay = useMemo(() => {
    const map = new Map<string, GoogleEvent[]>()
    for (const event of events) {
      if (!event.start?.date || event.start.dateTime) continue
      const start = parseGoogleDate(event.start)
      if (!start) continue
      const key = dayKey(start)
      map.set(key, [...(map.get(key) ?? []), event])
    }
    return map
  }, [events])

  const templateOptions = useMemo<TemplateOption[]>(() => [
    ...NOTE_FORMATS.map((format) => ({ value: format.key, label: format.label })),
    ...templates.map((template) => ({ value: `template:${template.id}`, label: template.name })),
  ], [templates])

  const timeRange = useMemo(() => {
    let startHour = DEFAULT_START_HOUR
    let endHour = DEFAULT_END_HOUR
    for (const event of events) {
      if (!event.start?.dateTime) continue
      const start = parseGoogleDate(event.start)
      const end = parseGoogleDate(event.end)
      if (!start) continue
      startHour = Math.min(startHour, Math.floor(start.getHours()))
      endHour = Math.max(endHour, end ? end.getHours() + (end.getMinutes() > 0 ? 1 : 0) : start.getHours() + 1)
    }
    startHour = clamp(startHour, 0, 23)
    endHour = clamp(Math.max(endHour, startHour + 6), startHour + 1, 24)
    return { startHour, endHour }
  }, [events])

  const hours = useMemo(() => {
    const result: number[] = []
    for (let hour = timeRange.startHour; hour <= timeRange.endHour; hour++) result.push(hour)
    return result
  }, [timeRange])

  const gridHeight = (timeRange.endHour - timeRange.startHour) * HOUR_HEIGHT
  const gridTemplateColumns = `${TIME_AXIS_WIDTH}px repeat(7, minmax(112px, 1fr))`
  const today = new Date()
  const sameMonth = viewWeekStart.getMonth() === viewWeekEnd.getMonth()
  const sameYear = viewWeekStart.getFullYear() === viewWeekEnd.getFullYear()
  const weekLabel = sameMonth
    ? `${viewWeekStart.toLocaleString(undefined, { month: 'long', day: 'numeric' })} - ${viewWeekEnd.getDate()}, ${viewWeekEnd.getFullYear()}`
    : sameYear
      ? `${viewWeekStart.toLocaleString(undefined, { month: 'short', day: 'numeric' })} - ${viewWeekEnd.toLocaleString(undefined, { month: 'short', day: 'numeric' })}, ${viewWeekEnd.getFullYear()}`
      : `${viewWeekStart.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} - ${viewWeekEnd.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`

  const dateFromGridPoint = (node: HTMLDivElement, clientY: number, day: Date) => {
    const rect = node.getBoundingClientRect()
    const y = clamp(clientY - rect.top, 0, rect.height)
    const rawMinutes = timeRange.startHour * 60 + (y / HOUR_HEIGHT) * 60
    const minutes = clamp(roundToSlot(rawMinutes), timeRange.startHour * 60, timeRange.endHour * 60 - SLOT_MINUTES)
    const result = new Date(day)
    result.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0)
    return result
  }

  const openCreate = (start?: Date) => {
    const d = start ?? new Date()
    setDraft({ clientId: '', date: localDate(d), time: localTime(d), duration: DEFAULT_DURATION })
    setCreateOpen(true)
  }

  const handleGridClick = (event: MouseEvent<HTMLDivElement>, day: Date) => {
    if ((event.target as HTMLElement).closest('[data-event-card]')) return
    openCreate(dateFromGridPoint(event.currentTarget, event.clientY, day))
  }

  const handleConnect = () => {
    if (!tokenClient) return
    tokenClient.requestAccessToken({ prompt: 'consent' })
  }

  const openEventMenu = (menuEvent: MouseEvent<HTMLElement>, event: GoogleEvent) => {
    menuEvent.preventDefault()
    menuEvent.stopPropagation()
    setSelectedEvent(null)
    setContextMenu({
      x: menuEvent.clientX,
      y: menuEvent.clientY,
      event,
    })
  }

  const handleCreateEvent = async () => {
    if (!draft.date || !draft.time) return
    setSaving(true)
    setError(null)
    try {
      const start = new Date(`${draft.date}T${draft.time}`)
      const end = new Date(start.getTime() + draft.duration * 60000)
      const selectedClient = clients.find((client) => client.id === draft.clientId)
      const privateProps: Record<string, string> = {
        therapisthelper_type: 'session',
        duration_minutes: String(draft.duration),
      }
      if (selectedClient) {
        privateProps.client_id = selectedClient.id
        privateProps.client_name = selectedClient.name
      }
      const created = await calendarRequest(EVENTS_URL, {
        method: 'POST',
        body: JSON.stringify({
          summary: selectedClient ? `${selectedClient.name} session` : 'Therapy session',
          description: 'Created in TheraBee.',
          start: { dateTime: start.toISOString() },
          end: { dateTime: end.toISOString() },
          extendedProperties: { private: privateProps },
        }),
      }) as GoogleEvent
      setEvents((current) => [...current, created].sort(eventSort))
      setCreateOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create calendar session')
    } finally {
      setSaving(false)
    }
  }

  const handleDrop = async (dropEvent: DragEvent<HTMLDivElement>, day: Date) => {
    dropEvent.preventDefault()
    const eventId = dropEvent.dataTransfer.getData('text/plain')
    const event = events.find((candidate) => candidate.id === eventId)
    if (!event || !event.start?.dateTime) return
    const start = dateFromGridPoint(dropEvent.currentTarget, dropEvent.clientY, day)
    const duration = eventDuration(event)
    const end = new Date(start.getTime() + duration * 60000)
    const previous = events
    const patch = {
      start: { dateTime: start.toISOString() },
      end: { dateTime: end.toISOString() },
      extendedProperties: {
        private: {
          ...(event.extendedProperties?.private ?? {}),
          duration_minutes: String(duration),
        },
      },
    }
    setMovingId(eventId)
    setError(null)
    setEvents((current) => current.map((candidate) => candidate.id === eventId ? { ...candidate, ...patch } : candidate).sort(eventSort))
    try {
      const updated = await calendarRequest(`${EVENTS_URL}/${encodeURIComponent(eventId)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }) as GoogleEvent
      setEvents((current) => current.map((candidate) => candidate.id === eventId ? updated : candidate).sort(eventSort))
    } catch (e) {
      setEvents(previous)
      setError(e instanceof Error ? e.message : 'Failed to move calendar session')
    } finally {
      setMovingId(null)
    }
  }

  const handleDeleteEvent = async (event: GoogleEvent) => {
    if (!window.confirm('Delete this calendar session from Google Calendar?')) return
    setContextMenu(null)
    setDeletingId(event.id)
    setError(null)
    try {
      await calendarRequest(`${EVENTS_URL}/${encodeURIComponent(event.id)}`, { method: 'DELETE' })
      setEvents((current) => current.filter((candidate) => candidate.id !== event.id))
      if (selectedEvent?.id === event.id) setSelectedEvent(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to delete calendar session')
    } finally {
      setDeletingId(null)
    }
  }

  if (!googleClientId) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Missing <code className="font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>. Set it in <code className="font-mono">frontend/.env.local</code> to enable Google Calendar.
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="shrink-0 flex flex-col gap-3 border-b border-gray-200 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-therapy-navy">{weekLabel}</h2>
          {token && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-therapy-navy"
                aria-label="Previous week"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset(0)}
                className="rounded px-2 py-1 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-therapy-navy"
              >
                This week
              </button>
              <button
                type="button"
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-therapy-navy"
                aria-label="Next week"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(loading || movingId || deletingId) && (
            <span className="text-xs font-medium text-gray-500">
              {deletingId ? 'Deleting...' : movingId ? 'Moving...' : 'Loading...'}
            </span>
          )}
          {token && (
            <button
              type="button"
              onClick={() => openCreate()}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-therapy-navy transition-colors hover:bg-gray-50"
            >
              <Icon name="plus" />
              New session
            </button>
          )}
          {!token && (
            <button
              type="button"
              onClick={handleConnect}
              disabled={!tokenClient}
              className="rounded-lg bg-therapy-coral px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-opacity-90 disabled:opacity-60"
            >
              Connect Google Calendar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="border-b border-red-200 bg-red-50 px-5 py-2 text-sm text-red-700">{error}</div>
      )}

      {!token ? (
        <div className="flex min-h-0 flex-1 items-center justify-center p-10 text-center text-sm text-gray-500">
          Connect your Google Calendar to see and schedule sessions here.
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <div className="min-w-[920px]">
            <div className="sticky top-0 z-30 grid border-b border-gray-200 bg-white" style={{ gridTemplateColumns }}>
              <div className="sticky left-0 z-20 border-r border-gray-200 bg-white" />
              {weekDays.map((day) => {
                const isToday = isSameDay(day, today)
                return (
                  <div key={day.toISOString()} className="border-r border-gray-100 px-2 py-3 text-center last:border-r-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                      {day.toLocaleString(undefined, { weekday: 'short' })}
                    </div>
                    <div
                      className={`mt-1 inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
                        isToday ? 'bg-therapy-coral text-white' : 'text-therapy-navy'
                      }`}
                    >
                      {day.getDate()}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="grid border-b border-gray-200 bg-therapy-cream/40" style={{ gridTemplateColumns }}>
              <div className="sticky left-0 z-20 border-r border-gray-200 bg-therapy-cream/90 px-2 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                All-day
              </div>
              {weekDays.map((day) => {
                const dayEvents = allDayEventsByDay.get(dayKey(day)) ?? []
                return (
                  <div key={dayKey(day)} className="min-h-11 border-r border-gray-100 p-1.5 last:border-r-0">
                    {dayEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        data-event-card
                        onClick={() => setSelectedEvent(event)}
                        onContextMenu={(menuEvent) => openEventMenu(menuEvent, event)}
                        className="mb-1 w-full truncate rounded-md bg-white px-2 py-1 text-left text-[11px] font-semibold text-therapy-navy shadow-sm ring-1 ring-gray-200 transition-colors hover:bg-gray-50"
                        title={event.summary || 'Untitled event'}
                      >
                        {event.summary || 'Untitled event'}
                      </button>
                    ))}
                  </div>
                )
              })}
            </div>

            <div className="grid bg-white" style={{ gridTemplateColumns }}>
              <div className="sticky left-0 z-20 border-r border-gray-200 bg-white" style={{ height: gridHeight }}>
                {hours.slice(0, -1).map((hour, index) => (
                  <div
                    key={hour}
                    className="absolute right-2 -translate-y-2 text-[11px] font-medium text-gray-400"
                    style={{ top: index * HOUR_HEIGHT }}
                  >
                    {formatHour(hour)}
                  </div>
                ))}
              </div>

              {weekDays.map((day) => {
                const key = dayKey(day)
                const dayEvents = timedEventsByDay.get(key) ?? []
                const currentMinutes = minutesSinceMidnight(today)
                const showNowLine = isSameDay(day, today)
                  && currentMinutes >= timeRange.startHour * 60
                  && currentMinutes <= timeRange.endHour * 60
                const nowTop = ((currentMinutes - timeRange.startHour * 60) / 60) * HOUR_HEIGHT

                return (
                  <div
                    key={key}
                    className="relative border-r border-gray-100 last:border-r-0"
                    style={{ height: gridHeight }}
                    onClick={(event) => handleGridClick(event, day)}
                    onDragOver={(event) => {
                      event.preventDefault()
                      event.dataTransfer.dropEffect = 'move'
                    }}
                    onDrop={(event) => handleDrop(event, day)}
                  >
                    {hours.slice(0, -1).map((hour, index) => (
                      <div
                        key={hour}
                        className="pointer-events-none absolute inset-x-0 border-t border-gray-100"
                        style={{ top: index * HOUR_HEIGHT }}
                      />
                    ))}

                    {showNowLine && (
                      <div
                        className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-therapy-berry"
                        style={{ top: nowTop }}
                      >
                        <span className="absolute -left-1 -top-1.5 h-3 w-3 rounded-full bg-therapy-berry" />
                      </div>
                    )}

                    {dayEvents.map((event, index) => {
                      const start = parseGoogleDate(event.start)
                      const end = parseGoogleDate(event.end)
                      if (!start) return null
                      const privateProps = event.extendedProperties?.private
                      const isTheraSession = privateProps?.therapisthelper_type === 'session'
                      const client = privateProps?.client_id ? clients.find((c) => c.id === privateProps.client_id) : undefined
                      const clientName = client?.name || privateProps?.client_name
                      const top = ((minutesSinceMidnight(start) - timeRange.startHour * 60) / 60) * HOUR_HEIGHT
                      const height = Math.max((eventDuration(event) / 60) * HOUR_HEIGHT, 30)

                      return (
                        <button
                          key={event.id}
                          type="button"
                          data-event-card
                          draggable
                          onClick={(clickEvent) => {
                            clickEvent.stopPropagation()
                            setSelectedEvent(event)
                          }}
                          onContextMenu={(menuEvent) => openEventMenu(menuEvent, event)}
                          onDragStart={(dragEvent) => {
                            dragEvent.dataTransfer.setData('text/plain', event.id)
                            dragEvent.dataTransfer.effectAllowed = 'move'
                          }}
                          className={`absolute z-20 overflow-hidden rounded-lg px-2 py-1 text-left text-[11px] shadow-sm ring-1 transition-all hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-therapy-coral ${
                            isTheraSession
                              ? 'bg-therapy-coral text-white ring-therapy-coral/30'
                              : 'bg-therapy-mist text-therapy-navy ring-therapy-sage/30'
                          } ${movingId === event.id ? 'opacity-60' : ''}`}
                          style={{
                            top: clamp(top, 0, Math.max(gridHeight - 30, 0)),
                            height: Math.min(height, Math.max(gridHeight - top, 30)),
                            left: `${4 + (index % 3) * 3}%`,
                            width: `${92 - (index % 3) * 3}%`,
                          }}
                          title={event.summary || 'Untitled event'}
                        >
                          <div className="truncate font-semibold">{event.summary || 'Untitled event'}</div>
                          <div className={`truncate text-[10px] ${isTheraSession ? 'text-white/85' : 'text-gray-600'}`}>
                            {formatRange(start, end)}
                            {clientName ? ` · ${clientName}` : ''}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <CreateDialog
        open={createOpen}
        draft={draft}
        clients={clients}
        saving={saving}
        onClose={() => setCreateOpen(false)}
        onChange={setDraft}
        onSubmit={handleCreateEvent}
      />

      {contextMenu && (
        <div
          className="fixed z-50 w-56 overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => handleDeleteEvent(contextMenu.event)}
            disabled={deletingId === contextMenu.event.id}
            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          >
            <span>Delete from calendar</span>
            <span className="text-xs text-red-400">Del</span>
          </button>
        </div>
      )}

      {selectedEvent && (
        <EventDialog
          event={selectedEvent}
          clients={clients}
          templateOptions={templateOptions}
          defaultTemplate={defaultTemplate}
          onClose={() => setSelectedEvent(null)}
          onStart={(mode, preset) => {
            setSelectedEvent(null)
            onStartSession?.(mode, preset)
          }}
        />
      )}
    </div>
  )
}
