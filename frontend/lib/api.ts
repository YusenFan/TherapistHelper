const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// ============================================================================
// Types (new minimal schema)
// ============================================================================

export interface Client {
  id: string
  therapist_id?: string
  name: string
  pronouns?: string
  date_of_birth?: string
  client_type?: string
  primary_diagnosis?: string
  other_diagnoses?: string[]
  high_risk?: boolean
  extra_info?: string
  created_at?: string
  updated_at?: string
}

export type ClientInput = {
  name: string
  pronouns?: string
  date_of_birth?: string
  client_type?: string
  primary_diagnosis?: string
  other_diagnoses?: string[]
  high_risk?: boolean
  extra_info?: string
}

export interface Session {
  id: string
  therapist_id?: string
  client_id: string
  session_date: string
  summary?: string
  note_format?: string
  note_content?: Record<string, string>
  template_id?: string
  created_at?: string
  updated_at?: string
}

export type SessionInput = {
  client_id: string
  session_date: string
  summary?: string
  note_format?: string
  note_content?: Record<string, string>
  template_id?: string
}

export interface NoteTemplate {
  id: string
  therapist_id?: string
  name: string
  base_format?: string
  sections: string[]
  created_at?: string
  updated_at?: string
}

export type NoteTemplateInput = {
  name: string
  base_format?: string
  sections: string[]
}

export interface UserSettings {
  id: string
  therapist_id: string
  default_ehr?: string | null
  last_used_ehr?: string | null
  created_at?: string
  updated_at?: string
}

// ============================================================================
// API client
// ============================================================================

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null

    const makeRequest = async (authToken: string | null): Promise<Response> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      }
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`
      return fetch(url, { ...options, headers })
    }

    let response = await makeRequest(token)

    if (response.status === 401 && typeof window !== 'undefined') {
      try {
        const { account } = await import('./appwrite')
        const jwt = await account.createJWT()
        token = jwt.jwt
        localStorage.setItem('token', token)
        response = await makeRequest(token)
      } catch (err) {
        console.error('Failed to refresh JWT:', err)
        localStorage.removeItem('token')
      }
    }

    if (!response.ok) {
      const error = await response.text()
      if (error) {
        let message = error
        try {
          const parsed = JSON.parse(error) as { detail?: string; message?: string }
          message = parsed.detail || parsed.message || error
        } catch {
          message = error
        }
        throw new Error(message)
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    if (response.status === 204) return undefined as T
    return response.json()
  }

  // ---- Clients ----
  getClients(): Promise<Client[]> {
    return this.request<Client[]>('/api/v1/clients/')
  }
  getClientsCount(): Promise<{ total_clients: number }> {
    return this.request('/api/v1/clients/stats/count')
  }
  getClient(id: string): Promise<Client> {
    return this.request<Client>(`/api/v1/clients/${id}`)
  }
  createClient(data: ClientInput): Promise<Client> {
    return this.request<Client>('/api/v1/clients/', { method: 'POST', body: JSON.stringify(data) })
  }
  updateClient(id: string, data: Partial<ClientInput>): Promise<Client> {
    return this.request<Client>(`/api/v1/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }
  deleteClient(id: string): Promise<void> {
    return this.request<void>(`/api/v1/clients/${id}`, { method: 'DELETE' })
  }

  // ---- Sessions ----
  getSessions(): Promise<Session[]> {
    return this.request<Session[]>('/api/v1/sessions/')
  }
  getClientSessions(clientId: string): Promise<Session[]> {
    return this.request<Session[]>(`/api/v1/sessions/client/${clientId}`)
  }
  getSession(id: string): Promise<Session> {
    return this.request<Session>(`/api/v1/sessions/${id}`)
  }
  createSession(data: SessionInput): Promise<Session> {
    return this.request<Session>('/api/v1/sessions/', { method: 'POST', body: JSON.stringify(data) })
  }
  updateSession(id: string, data: Partial<SessionInput>): Promise<Session> {
    return this.request<Session>(`/api/v1/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }
  deleteSession(id: string): Promise<void> {
    return this.request<void>(`/api/v1/sessions/${id}`, { method: 'DELETE' })
  }

  // ---- Note Templates ----
  getTemplates(): Promise<NoteTemplate[]> {
    return this.request<NoteTemplate[]>('/api/v1/templates/')
  }
  createTemplate(data: NoteTemplateInput): Promise<NoteTemplate> {
    return this.request<NoteTemplate>('/api/v1/templates/', { method: 'POST', body: JSON.stringify(data) })
  }
  updateTemplate(id: string, data: Partial<NoteTemplateInput>): Promise<NoteTemplate> {
    return this.request<NoteTemplate>(`/api/v1/templates/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  }
  deleteTemplate(id: string): Promise<void> {
    return this.request<void>(`/api/v1/templates/${id}`, { method: 'DELETE' })
  }

  // ---- User Settings (EHR) ----
  getUserSettings(): Promise<UserSettings> {
    return this.request<UserSettings>('/api/v1/settings/')
  }
  updateUserSettings(data: { default_ehr?: string; last_used_ehr?: string }): Promise<UserSettings> {
    return this.request<UserSettings>('/api/v1/settings/', { method: 'PUT', body: JSON.stringify(data) })
  }

  // ---- AI ----
  async transcribeAudio(audio: Blob, language?: string): Promise<{ transcript: string; language?: string }> {
    const form = new FormData()
    const ext = (audio.type.split('/')[1] || 'webm').split(';')[0]
    form.append('audio', audio, `recording.${ext}`)
    if (language) form.append('language', language)

    const url = `${this.baseUrl}/api/v1/ai/transcribe`
    let token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    const send = (t: string | null) => fetch(url, {
      method: 'POST',
      headers: t ? { Authorization: `Bearer ${t}` } : undefined,
      body: form,
    })
    let res = await send(token)
    if (res.status === 401 && typeof window !== 'undefined') {
      const { account } = await import('./appwrite')
      const jwt = await account.createJWT()
      token = jwt.jwt
      localStorage.setItem('token', token)
      res = await send(token)
    }
    if (!res.ok) throw new Error(await res.text())
    return res.json()
  }

  generateNote(data: {
    summary: string
    note_format?: string
    sections: string[]
    client_context?: string
  }): Promise<{ note_content: Record<string, string> }> {
    return this.request('/api/v1/ai/generate-note', { method: 'POST', body: JSON.stringify(data) })
  }
}

export const apiClient = new ApiClient()
