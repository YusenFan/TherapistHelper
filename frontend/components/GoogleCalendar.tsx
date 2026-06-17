'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type GoogleEvent = {
  id: string
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  htmlLink?: string
}

type TokenClient = {
  requestAccessToken: (opts?: { prompt?: string }) => void
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

const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'
const GSI_SRC = 'https://accounts.google.com/gsi/client'
const TOKEN_STORAGE_KEY = 'gcal_access_token'
const TOKEN_EXPIRY_KEY = 'gcal_token_expiry'

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

export default function GoogleCalendar() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const [token, setToken] = useState<string | null>(null)
  const [events, setEvents] = useState<GoogleEvent[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenClient, setTokenClient] = useState<TokenClient | null>(null)

  const viewWeekStart = useMemo(() => {
    const d = startOfWeek(new Date())
    d.setDate(d.getDate() + weekOffset * 7)
    return d
  }, [weekOffset])

  const viewWeekEnd = useMemo(() => endOfWeek(viewWeekStart), [viewWeekStart])

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
    if (!clientId) return
    let cancelled = false
    loadGsi()
      .then(() => {
        if (cancelled || !window.google) return
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
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
  }, [clientId])

  const fetchEvents = useCallback(async (accessToken: string, weekStart: Date, weekEnd: Date) => {
    setLoading(true)
    setError(null)
    try {
      const timeMin = weekStart.toISOString()
      const timeMax = weekEnd.toISOString()
      const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
      url.searchParams.set('timeMin', timeMin)
      url.searchParams.set('timeMax', timeMax)
      url.searchParams.set('singleEvents', 'true')
      url.searchParams.set('orderBy', 'startTime')
      url.searchParams.set('maxResults', '250')
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.status === 401) {
        setToken(null)
        window.localStorage.removeItem(TOKEN_STORAGE_KEY)
        window.localStorage.removeItem(TOKEN_EXPIRY_KEY)
        throw new Error('Google session expired. Please reconnect.')
      }
      if (!res.ok) throw new Error(`Calendar API error: ${res.status}`)
      const data = await res.json()
      setEvents(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load events')
      setEvents([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (token) fetchEvents(token, viewWeekStart, viewWeekEnd)
  }, [token, viewWeekStart, viewWeekEnd, fetchEvents])

  const handleConnect = () => {
    if (!tokenClient) return
    tokenClient.requestAccessToken({ prompt: 'consent' })
  }

  const weekDays = useMemo(() => {
    const days: Date[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(viewWeekStart)
      d.setDate(viewWeekStart.getDate() + i)
      days.push(d)
    }
    return days
  }, [viewWeekStart])

  const eventsByDay = useMemo(() => {
    const map = new Map<string, GoogleEvent[]>()
    for (const ev of events) {
      const raw = ev.start?.dateTime || ev.start?.date
      if (!raw) continue
      const start = new Date(raw)
      const key = `${start.getFullYear()}-${start.getMonth()}-${start.getDate()}`
      const arr = map.get(key) ?? []
      arr.push(ev)
      map.set(key, arr)
    }
    return map
  }, [events])

  if (!clientId) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-amber-900 text-sm">
        Missing <code className="font-mono">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>. Set it in <code className="font-mono">frontend/.env.local</code> to enable Google Calendar.
      </div>
    )
  }

  const sameMonth = viewWeekStart.getMonth() === viewWeekEnd.getMonth()
  const sameYear = viewWeekStart.getFullYear() === viewWeekEnd.getFullYear()
  const weekLabel = sameMonth
    ? `${viewWeekStart.toLocaleString(undefined, { month: 'long', day: 'numeric' })} – ${viewWeekEnd.getDate()}, ${viewWeekEnd.getFullYear()}`
    : sameYear
      ? `${viewWeekStart.toLocaleString(undefined, { month: 'short', day: 'numeric' })} – ${viewWeekEnd.toLocaleString(undefined, { month: 'short', day: 'numeric' })}, ${viewWeekEnd.getFullYear()}`
      : `${viewWeekStart.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} – ${viewWeekEnd.toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`

  const today = new Date()

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-therapy-navy">{weekLabel}</h2>
          {token && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setWeekOffset(weekOffset - 1)}
                className="px-2 py-1 text-gray-500 hover:text-therapy-navy hover:bg-gray-100 rounded"
                aria-label="Previous week"
              >
                ←
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="px-2 py-1 text-xs text-gray-600 hover:text-therapy-navy hover:bg-gray-100 rounded"
              >
                This week
              </button>
              <button
                onClick={() => setWeekOffset(weekOffset + 1)}
                className="px-2 py-1 text-gray-500 hover:text-therapy-navy hover:bg-gray-100 rounded"
                aria-label="Next week"
              >
                →
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {loading && <span className="text-xs text-gray-500">Loading…</span>}
          {!token && (
            <button
              onClick={handleConnect}
              disabled={!tokenClient}
              className="text-sm font-medium text-white bg-therapy-coral hover:bg-opacity-90 disabled:opacity-60 px-4 py-2 rounded-lg transition-colors"
            >
              Connect Google Calendar
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-5 py-2 text-sm text-red-700">{error}</div>
      )}

      {!token ? (
        <div className="p-10 text-center text-gray-500 text-sm">
          Connect your Google Calendar to see your sessions and appointments here.
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-7 text-xs font-medium text-gray-500 border-b border-gray-200">
            {weekDays.map((d) => {
              const isToday = isSameDay(d, today)
              return (
                <div key={d.toISOString()} className="px-2 py-2 text-center">
                  <div className="uppercase tracking-wide">{d.toLocaleString(undefined, { weekday: 'short' })}</div>
                  <div
                    className={`mt-1 inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold ${
                      isToday ? 'bg-therapy-coral text-white' : 'text-therapy-navy'
                    }`}
                  >
                    {d.getDate()}
                  </div>
                </div>
              )
            })}
          </div>
          <div className="grid grid-cols-7">
            {weekDays.map((d) => {
              const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
              const dayEvents = eventsByDay.get(key) ?? []
              return (
                <div
                  key={key}
                  className="min-h-[240px] border-r border-b border-gray-100 last:border-r-0 p-2 space-y-1"
                >
                  {dayEvents.length === 0 && (
                    <div className="text-[11px] text-gray-300 italic px-1">No events</div>
                  )}
                  {dayEvents.map((ev) => {
                    const startRaw = ev.start?.dateTime || ev.start?.date
                    const start = startRaw ? new Date(startRaw) : null
                    const timeLabel = start && ev.start?.dateTime
                      ? start.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
                      : 'All day'
                    return (
                      <a
                        key={ev.id}
                        href={ev.htmlLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[11px] px-1.5 py-1 bg-therapy-blue bg-opacity-20 text-therapy-navy rounded hover:bg-opacity-40 transition-colors"
                        title={ev.summary || '(no title)'}
                      >
                        <div className="font-medium truncate">{ev.summary || '(no title)'}</div>
                        <div className="text-[10px] text-gray-600">{timeLabel}</div>
                      </a>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
